import { AlertTriangle, Check, Plus, Trash2, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePermissions } from "../context/PermissionsContext.jsx";

export default function Maintenance() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("fleet", "full");

  const [logs, setLogs] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [cost, setCost] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const logsRes = await fetch("http://localhost:8000/api/maintenance", {
        credentials: "include",
      });
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data);
      }

      const vRes = await fetch("http://localhost:8000/api/vehicles", {
        credentials: "include",
      });
      if (vRes.ok) {
        const data = await vRes.json();
        setVehiclesList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // List of vehicles that can be put in maintenance (available only)
  const availableVehicles = vehiclesList.filter(
    (v) => v.status === "available"
  );

  const resetForm = () => {
    setVehicleId("");
    setServiceType("");
    setCost("");
    setServiceDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setErrorMsg(null);
  };

  const openAddDialog = () => {
    resetForm();
    if (availableVehicles.length > 0) {
      setVehicleId(availableVehicles[0].id);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      const res = await fetch("http://localhost:8000/api/maintenance", {
        body: JSON.stringify({
          cost,
          notes,
          serviceDate,
          serviceType,
          vehicleId,
        }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (res.ok) {
        setIsDialogOpen(false);
        resetForm();
        loadData();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to create maintenance log");
      }
    } catch (err) {
      setErrorMsg("Network request failed");
    }
  };

  const handleCloseMaintenance = async (logId) => {
    if (
      !window.confirm("Complete maintenance and return vehicle to service?")
    ) {
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:8000/api/maintenance/${logId}/close`,
        {
          credentials: "include",
          method: "POST",
        }
      );
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to close maintenance log");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this maintenance record?"
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/maintenance/${id}`, {
        credentials: "include",
        method: "DELETE",
      });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Delete failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatCost = (val) =>
    new Intl.NumberFormat("en-IN", {
      currency: "INR",
      maximumFractionDigits: 0,
      style: "currency",
    }).format(Number.parseFloat(val));

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-1 font-semibold text-muted-foreground text-sm">
          <Wrench className="h-4 w-4 text-primary" />
          <span>Active & Historical Maintenance Records</span>
        </div>

        {canEdit && (
          <Button
            className="shrink-0 bg-primary font-semibold text-primary-foreground"
            onClick={openAddDialog}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Put Vehicle in Shop
          </Button>
        )}
      </div>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground text-sm">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Loading logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No maintenance logs recorded.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Service Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-semibold">
                      {log.vehicle?.name || "--"} ({log.vehicle?.regNo || "--"})
                    </TableCell>
                    <TableCell>{log.serviceType}</TableCell>
                    <TableCell>{formatCost(log.cost)}</TableCell>
                    <TableCell>
                      {new Date(log.serviceDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                      {log.notes || "--"}
                    </TableCell>
                    <TableCell>
                      {log.status === "in_shop" ? (
                        <Badge className="bg-orange-500 text-white hover:bg-orange-500/80">
                          In Shop
                        </Badge>
                      ) : (
                        <Badge className="bg-green-600 text-white hover:bg-green-600/80">
                          Completed
                        </Badge>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="h-14 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {log.status === "in_shop" && (
                            <Button
                              className="flex h-8 items-center gap-1 bg-green-600 font-semibold text-white hover:bg-green-600/80"
                              onClick={() => handleCloseMaintenance(log.id)}
                              size="xs"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Release Vehicle
                            </Button>
                          )}
                          <Button
                            className="group h-8 w-8 hover:bg-destructive/10"
                            onClick={() => handleDelete(log.id)}
                            size="icon"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Rule disclaimer warning */}
      <div className="flex items-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 font-semibold text-orange-600/90 text-xs">
        <AlertTriangle className="h-4 w-4 shrink-0 text-orange-600" />
        <span>
          Rule: Adding a vehicle to "Maintenance Log" automatically switches its
          status to "In Shop", removing it from the Driver's selection pool.
        </span>
      </div>

      {/* Put Vehicle In Shop Dialog Modal */}
      <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
        <DialogContent className="w-full max-w-md border border-border">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Put Vehicle in Shop</DialogTitle>
              <DialogDescription>
                Select an available vehicle and enter details of the maintenance
                task.
              </DialogDescription>
            </DialogHeader>

            {errorMsg && (
              <Alert className="my-2" variant="destructive">
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Vehicle (Available Only)</Label>
                <Select onValueChange={setVehicleId} value={vehicleId}>
                  <SelectTrigger className="w-full border-input bg-transparent">
                    <SelectValue>
                      {availableVehicles.find((v) => v.id === vehicleId)
                        ? `${availableVehicles.find((v) => v.id === vehicleId).name} (${availableVehicles.find((v) => v.id === vehicleId).regNo})`
                        : "Select vehicle..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableVehicles.length === 0 ? (
                      <SelectItem disabled value="none">
                        No available vehicles in fleet
                      </SelectItem>
                    ) : (
                      availableVehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name} ({v.regNo}) — Odometer: {v.odometerKm} km
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-type">Service Type / Task</Label>
                <Input
                  id="service-type"
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="e.g. Oil Change, Engine Checkup, Brake Repair"
                  required
                  value={serviceType}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maint-cost">Estimated Cost (INR)</Label>
                  <Input
                    id="maint-cost"
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="e.g. 5000"
                    required
                    type="number"
                    value={cost}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maint-date">Service Date</Label>
                  <Input
                    id="maint-date"
                    onChange={(e) => setServiceDate(e.target.value)}
                    required
                    type="date"
                    value={serviceDate}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maint-notes">Service Notes / Details</Label>
                <Input
                  id="maint-notes"
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Replaced front breakpads and filled engine oil."
                  value={notes}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setIsDialogOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="bg-primary font-semibold text-primary-foreground"
                disabled={availableVehicles.length === 0}
                type="submit"
              >
                Log Maintenance
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
