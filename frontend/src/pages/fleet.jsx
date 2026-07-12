import { Edit, Plus, Search, Trash2 } from "lucide-react";
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

export default function Fleet() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("fleet", "full");

  const [vehiclesList, setVehiclesList] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchReg, setSearchReg] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Add/Edit Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // "add" or "edit"
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [regNo, setRegNo] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("van");
  const [capacityKg, setCapacityKg] = useState("");
  const [odometerKm, setOdometerKm] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [status, setStatus] = useState("available");
  const [regionId, setRegionId] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);

  // Load vehicles and regions
  const loadVehicles = async () => {
    setLoading(true);
    try {
      const url = new URL("http://localhost:8000/api/vehicles");
      if (filterType !== "all") {
        url.searchParams.append("type", filterType);
      }
      if (filterStatus !== "all") {
        url.searchParams.append("status", filterStatus);
      }

      const res = await fetch(url.toString(), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setVehiclesList(data);
      }
    } catch (err) {
      console.error("Failed to load vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadRegions = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/vehicles/regions", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setRegions(data);
        if (data.length > 0 && !regionId) {
          setRegionId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load regions:", err);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [filterType, filterStatus]);

  useEffect(() => {
    loadRegions();
  }, []);

  // Filter local results by registration search
  const filteredVehicles = vehiclesList.filter((v) =>
    v.regNo.toLowerCase().includes(searchReg.toLowerCase())
  );

  const resetForm = () => {
    setRegNo("");
    setName("");
    setType("van");
    setCapacityKg("");
    setOdometerKm("");
    setAcquisitionCost("");
    setStatus("available");
    if (regions.length > 0) {
      setRegionId(regions[0].id);
    }
    setErrorMsg(null);
    setEditingVehicleId(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogMode("add");
    setIsDialogOpen(true);
  };

  const openEditDialog = (v) => {
    resetForm();
    setDialogMode("edit");
    setEditingVehicleId(v.id);
    setRegNo(v.regNo);
    setName(v.name);
    setType(v.type);
    setCapacityKg(v.capacityKg);
    setOdometerKm(v.odometerKm);
    setAcquisitionCost(v.acquisitionCost);
    setStatus(v.status);
    setRegionId(v.regionId || (regions.length > 0 ? regions[0].id : ""));
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const bodyData = {
      acquisitionCost,
      capacityKg,
      name,
      odometerKm: odometerKm ? Number.parseInt(odometerKm, 10) : 0,
      regionId: regionId || null,
      regNo,
      status,
      type,
    };

    try {
      let res;
      if (dialogMode === "add") {
        res = await fetch("http://localhost:8000/api/vehicles", {
          body: JSON.stringify(bodyData),
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
      } else {
        res = await fetch(
          `http://localhost:8000/api/vehicles/${editingVehicleId}`,
          {
            body: JSON.stringify(bodyData),
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            method: "PUT",
          }
        );
      }

      if (res.ok) {
        setIsDialogOpen(false);
        resetForm();
        loadVehicles();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to save vehicle details");
      }
    } catch (err) {
      setErrorMsg("Network request failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/vehicles/${id}`, {
        credentials: "include",
        method: "DELETE",
      });
      if (res.ok) {
        loadVehicles();
      } else {
        const err = await res.json();
        alert(err.error || "Delete failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatCapacity = (kg) => {
    const value = Number.parseFloat(kg);
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1).replace(/\.0$/, "")} Ton`;
    }
    return `${Math.round(value)} kg`;
  };

  const formatCost = (val) =>
    new Intl.NumberFormat("en-IN", {
      currency: "INR",
      maximumFractionDigits: 0,
      style: "currency",
    }).format(Number.parseFloat(val));

  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return (
          <Badge className="cursor-default bg-green-600 text-white hover:bg-green-600/80">
            Available
          </Badge>
        );
      case "on_trip":
        return (
          <Badge className="cursor-default bg-blue-600 text-white hover:bg-blue-600/80">
            On Trip
          </Badge>
        );
      case "in_shop":
        return (
          <Badge className="cursor-default bg-orange-500 text-white hover:bg-orange-500/80">
            In Shop
          </Badge>
        );
      case "retired":
        return (
          <Badge className="cursor-default bg-red-400 text-white hover:bg-red-400/80">
            Retired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              onChange={(e) => setSearchReg(e.target.value)}
              placeholder="Search reg. no..."
              value={searchReg}
            />
          </div>

          <Select onValueChange={setFilterType} value={filterType}>
            <SelectTrigger className="border-input bg-transparent">
              <SelectValue>
                {filterType === "all"
                  ? "All Types"
                  : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="van">Van</SelectItem>
              <SelectItem value="truck">Truck</SelectItem>
              <SelectItem value="mini">Mini</SelectItem>
              <SelectItem value="bus">Bus</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={setFilterStatus} value={filterStatus}>
            <SelectTrigger className="border-input bg-transparent">
              <SelectValue>
                {filterStatus === "all"
                  ? "All Statuses"
                  : filterStatus === "on_trip"
                    ? "On Trip"
                    : filterStatus === "in_shop"
                      ? "In Shop"
                      : filterStatus.charAt(0).toUpperCase() +
                        filterStatus.slice(1)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="on_trip">On Trip</SelectItem>
              <SelectItem value="in_shop">In Shop</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {canEdit && (
          <Button
            className="shrink-0 bg-primary font-semibold text-primary-foreground"
            onClick={openAddDialog}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Vehicle
          </Button>
        )}
      </div>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground text-sm">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Loading fleet records...</span>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No vehicles found matching filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reg. No. (Unique)</TableHead>
                  <TableHead>Name/Model</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Acq. Cost</TableHead>
                  <TableHead>Region/Depot</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-semibold text-sm tracking-wider">
                      {v.regNo}
                    </TableCell>
                    <TableCell>{v.name}</TableCell>
                    <TableCell className="capitalize">{v.type}</TableCell>
                    <TableCell>{formatCapacity(v.capacityKg)}</TableCell>
                    <TableCell>
                      {Number.parseInt(v.odometerKm, 10).toLocaleString()} km
                    </TableCell>
                    <TableCell>{formatCost(v.acquisitionCost)}</TableCell>
                    <TableCell>{v.region?.name || "--"}</TableCell>
                    <TableCell>{getStatusBadge(v.status)}</TableCell>
                    {canEdit && (
                      <TableCell className="flex h-14 items-center justify-end gap-2 text-right">
                        <Button
                          className="h-8 w-8 hover:bg-muted"
                          onClick={() => openEditDialog(v)}
                          size="icon"
                          variant="ghost"
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          className="group h-8 w-8 hover:bg-destructive/10"
                          onClick={() => handleDelete(v.id)}
                          size="icon"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Rule Warning disclaimer */}
      <div className="flex items-center rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 font-semibold text-orange-600/90 text-xs">
        <span>
          Rule: Registration No. must be unique · Retired/In Shop vehicles are
          hidden from Trip Dispatcher
        </span>
      </div>

      {/* Add / Edit Dialog Modal */}
      <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
        <DialogContent className="w-full max-w-md border border-border">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg">
                {dialogMode === "add"
                  ? "Register Vehicle"
                  : "Edit Vehicle Details"}
              </DialogTitle>
              <DialogDescription>
                Fill out the registry details below. All fields are required.
              </DialogDescription>
            </DialogHeader>

            {errorMsg && (
              <Alert className="my-2" variant="destructive">
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-no">Registration Number</Label>
                  <Input
                    id="reg-no"
                    onChange={(e) => setRegNo(e.target.value)}
                    placeholder="GJ01AB1234"
                    required
                    value={regNo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name / Model</Label>
                  <Input
                    id="name"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VAN-05 or TRK-12"
                    required
                    value={name}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <Select onValueChange={setType} value={type}>
                    <SelectTrigger className="w-full border-input bg-transparent">
                      <SelectValue>
                        {type
                          ? type.charAt(0).toUpperCase() + type.slice(1)
                          : "Select type..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="mini">Mini</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity (kg)</Label>
                  <Input
                    id="capacity"
                    onChange={(e) => setCapacityKg(e.target.value)}
                    placeholder="e.g. 500"
                    required
                    type="number"
                    value={capacityKg}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="odometer">Odometer (km)</Label>
                  <Input
                    id="odometer"
                    onChange={(e) => setOdometerKm(e.target.value)}
                    placeholder="0"
                    required
                    type="number"
                    value={odometerKm}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acq-cost">Acquisition Cost (INR)</Label>
                  <Input
                    id="acq-cost"
                    onChange={(e) => setAcquisitionCost(e.target.value)}
                    placeholder="e.g. 620000"
                    required
                    type="number"
                    value={acquisitionCost}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assigned Region</Label>
                  <Select onValueChange={setRegionId} value={regionId}>
                    <SelectTrigger className="w-full border-input bg-transparent">
                      <SelectValue>
                        {regions.find((r) => r.id === regionId)?.name ||
                          "Select region..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((reg) => (
                        <SelectItem key={reg.id} value={reg.id}>
                          {reg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Registry Status</Label>
                  <Select
                    disabled={
                      dialogMode === "edit" &&
                      (status === "on_trip" || status === "in_shop")
                    }
                    onValueChange={setStatus}
                    value={status}
                  >
                    <SelectTrigger className="w-full border-input bg-transparent">
                      <SelectValue>
                        {status === "on_trip"
                          ? "On Trip"
                          : status === "in_shop"
                            ? "In Shop"
                            : status
                              ? status.charAt(0).toUpperCase() + status.slice(1)
                              : "Select status..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      {dialogMode === "edit" && status === "on_trip" && (
                        <SelectItem value="on_trip">On Trip</SelectItem>
                      )}
                      {dialogMode === "edit" && status === "in_shop" && (
                        <SelectItem value="in_shop">In Shop</SelectItem>
                      )}
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                  {dialogMode === "edit" &&
                    (status === "on_trip" || status === "in_shop") && (
                      <span className="mt-1 block text-[10px] text-muted-foreground leading-tight">
                        *Status locked during active trip/maintenance log
                      </span>
                    )}
                </div>
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
              <Button className="font-semibold" type="submit">
                {dialogMode === "add" ? "Register" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
