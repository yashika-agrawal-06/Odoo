import { AlertTriangle, Edit, Plus, Search, Trash2 } from "lucide-react";
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

export default function Drivers() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("drivers", "full");

  const [driversList, setDriversList] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchName, setSearchName] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");

  // Add/Edit Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [name, setName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseCategory, setLicenseCategory] = useState("lmv");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [safetyScore, setSafetyScore] = useState("100");
  const [status, setStatus] = useState("available");
  const [regionId, setRegionId] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const url = new URL("http://localhost:8000/api/drivers");
      if (filterStatus !== "all") {
        url.searchParams.append("status", filterStatus);
      }
      if (filterCategory !== "all") {
        url.searchParams.append("licenseCategory", filterCategory);
      }
      if (filterRegion !== "all") {
        url.searchParams.append("regionId", filterRegion);
      }

      const res = await fetch(url.toString(), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setDriversList(data);
      }
    } catch (err) {
      console.error("Failed to load drivers:", err);
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
    loadDrivers();
  }, [filterStatus, filterCategory, filterRegion]);

  useEffect(() => {
    loadRegions();
  }, []);

  const filteredDrivers = driversList.filter((d) =>
    d.name.toLowerCase().includes(searchName.toLowerCase())
  );

  const resetForm = () => {
    setName("");
    setLicenseNumber("");
    setLicenseCategory("lmv");
    setLicenseExpiry("");
    setContactNumber("");
    setSafetyScore("100");
    setStatus("available");
    if (regions.length > 0) {
      setRegionId(regions[0].id);
    }
    setErrorMsg(null);
    setEditingDriverId(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogMode("add");
    setIsDialogOpen(true);
  };

  const openEditDialog = (d) => {
    resetForm();
    setDialogMode("edit");
    setEditingDriverId(d.id);
    setName(d.name);
    setLicenseNumber(d.licenseNumber);
    setLicenseCategory(d.licenseCategory);
    setLicenseExpiry(new Date(d.licenseExpiry).toISOString().split("T")[0]);
    setContactNumber(d.contactNumber);
    setSafetyScore(d.safetyScore);
    setStatus(d.status);
    setRegionId(d.regionId || (regions.length > 0 ? regions[0].id : ""));
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const bodyData = {
      contactNumber,
      licenseCategory,
      licenseExpiry,
      licenseNumber,
      name,
      regionId: regionId || null,
      safetyScore: Number.parseInt(safetyScore, 10),
      status,
    };

    try {
      let res;
      if (dialogMode === "add") {
        res = await fetch("http://localhost:8000/api/drivers", {
          body: JSON.stringify(bodyData),
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
      } else {
        res = await fetch(
          `http://localhost:8000/api/drivers/${editingDriverId}`,
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
        loadDrivers();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to save driver profile");
      }
    } catch (err) {
      setErrorMsg("Network request failed");
    }
  };

  const handleUpdateStatus = async (d, newStatus) => {
    if (d.status === newStatus) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/drivers/${d.id}`, {
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      if (res.ok) {
        loadDrivers();
      } else {
        const err = await res.json();
        alert(err.error || "Status update failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this driver profile?")
    ) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/drivers/${id}`, {
        credentials: "include",
        method: "DELETE",
      });
      if (res.ok) {
        loadDrivers();
      } else {
        const err = await res.json();
        alert(err.error || "Delete failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

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
      case "off_duty":
        return (
          <Badge className="cursor-default bg-slate-500 text-white hover:bg-slate-500/80">
            Off Duty
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="cursor-default bg-orange-500 text-white hover:bg-orange-500/80">
            Suspended
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
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Search driver name..."
              value={searchName}
            />
          </div>

          <Select onValueChange={setFilterCategory} value={filterCategory}>
            <SelectTrigger className="border-input bg-transparent">
              <SelectValue>
                {filterCategory === "all"
                  ? "All Licenses"
                  : filterCategory.toUpperCase()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Licenses</SelectItem>
              <SelectItem value="lmv">LMV (Light)</SelectItem>
              <SelectItem value="hmv">HMV (Heavy)</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={setFilterStatus} value={filterStatus}>
            <SelectTrigger className="border-input bg-transparent">
              <SelectValue>
                {filterStatus === "all"
                  ? "All Statuses"
                  : filterStatus === "on_trip"
                    ? "On Trip"
                    : filterStatus === "off_duty"
                      ? "Off Duty"
                      : filterStatus.charAt(0).toUpperCase() +
                        filterStatus.slice(1)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="on_trip">On Trip</SelectItem>
              <SelectItem value="off_duty">Off Duty</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={setFilterRegion} value={filterRegion}>
            <SelectTrigger className="border-input bg-transparent">
              <SelectValue>
                {filterRegion === "all"
                  ? "All Regions"
                  : regions.find((r) => r.id === filterRegion)?.name ||
                    "All Regions"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map((reg) => (
                <SelectItem key={reg.id} value={reg.id}>
                  {reg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canEdit && (
          <Button
            className="shrink-0 bg-primary font-semibold text-primary-foreground"
            onClick={openAddDialog}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Driver
          </Button>
        )}
      </div>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground text-sm">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Loading driver records...</span>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No drivers found matching filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>License No.</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>License Expiry</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Safety Score</TableHead>
                  <TableHead>Region/Depot</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && (
                    <TableHead className="min-w-[200px]">
                      Quick Status Toggle
                    </TableHead>
                  )}
                  {canEdit && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((d) => {
                  const isExpired = new Date(d.licenseExpiry) < new Date();
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-semibold">{d.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {d.licenseNumber}
                      </TableCell>
                      <TableCell className="uppercase">
                        {d.licenseCategory}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span
                          className={
                            isExpired
                              ? "flex items-center gap-1 font-semibold text-destructive"
                              : ""
                          }
                        >
                          {new Date(d.licenseExpiry).toLocaleDateString()}
                          {isExpired && (
                            <Badge
                              className="h-4 px-1 text-[10px]"
                              variant="destructive"
                            >
                              EXPIRED
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {d.contactNumber}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-bold ${d.safetyScore >= 90 ? "text-green-600" : d.safetyScore >= 80 ? "text-orange-500" : "text-destructive"}`}
                        >
                          {d.safetyScore}%
                        </span>
                      </TableCell>
                      <TableCell>{d.region?.name || "--"}</TableCell>
                      <TableCell>{getStatusBadge(d.status)}</TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex select-none items-center gap-1.5">
                            <Button
                              className={`h-6 text-[10px] ${d.status === "available" ? "bg-green-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                              disabled={d.status === "on_trip"}
                              onClick={() => handleUpdateStatus(d, "available")}
                              size="xs"
                            >
                              Available
                            </Button>
                            <Button
                              className={`h-6 text-[10px] ${d.status === "off_duty" ? "bg-slate-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                              disabled={d.status === "on_trip"}
                              onClick={() => handleUpdateStatus(d, "off_duty")}
                              size="xs"
                            >
                              Off Duty
                            </Button>
                            <Button
                              className={`h-6 text-[10px] ${d.status === "suspended" ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                              disabled={d.status === "on_trip"}
                              onClick={() => handleUpdateStatus(d, "suspended")}
                              size="xs"
                            >
                              Suspended
                            </Button>
                          </div>
                        </TableCell>
                      )}
                      {canEdit && (
                        <TableCell className="h-14 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              className="h-8 w-8 hover:bg-muted"
                              onClick={() => openEditDialog(d)}
                              size="icon"
                              variant="ghost"
                            >
                              <Edit className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                              className="group h-8 w-8 hover:bg-destructive/10"
                              onClick={() => handleDelete(d.id)}
                              size="icon"
                              variant="ghost"
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Rule disclaimer info */}
      <div className="flex items-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 font-semibold text-orange-600/90 text-xs">
        <AlertTriangle className="h-4 w-4 shrink-0 text-orange-600" />
        <span>
          Rule: Expired license or Suspended status → blocked from trip
          assignment
        </span>
      </div>

      {/* Add / Edit Dialog Modal */}
      <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
        <DialogContent className="w-full max-w-md border border-border">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg">
                {dialogMode === "add"
                  ? "Register Driver"
                  : "Edit Driver Profile"}
              </DialogTitle>
              <DialogDescription>
                Fill out driver credentials. Expiry and category are verified
                during trip routing.
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
                  <Label htmlFor="driver-name">Driver Name</Label>
                  <Input
                    id="driver-name"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Smith"
                    required
                    value={name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license-no">License Number</Label>
                  <Input
                    id="license-no"
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="DL-88213"
                    required
                    value={licenseNumber}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>License Category</Label>
                  <Select
                    onValueChange={setLicenseCategory}
                    value={licenseCategory}
                  >
                    <SelectTrigger className="w-full border-input bg-transparent">
                      <SelectValue>
                        {licenseCategory
                          ? licenseCategory.toUpperCase()
                          : "Select category..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lmv">
                        LMV (Light Motor Vehicle)
                      </SelectItem>
                      <SelectItem value="hmv">
                        HMV (Heavy Motor Vehicle)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    required
                    type="date"
                    value={licenseExpiry}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Number</Label>
                  <Input
                    id="contact"
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="9876543210"
                    required
                    value={contactNumber}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="safety">Safety Score (%)</Label>
                  <Input
                    id="safety"
                    max="100"
                    min="0"
                    onChange={(e) => setSafetyScore(e.target.value)}
                    placeholder="100"
                    required
                    type="number"
                    value={safetyScore}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Region/Depot</Label>
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
                  <Label>Driver Status</Label>
                  <Select
                    disabled={dialogMode === "edit" && status === "on_trip"}
                    onValueChange={setStatus}
                    value={status}
                  >
                    <SelectTrigger className="w-full border-input bg-transparent">
                      <SelectValue>
                        {status === "on_trip"
                          ? "On Trip"
                          : status === "off_duty"
                            ? "Off Duty"
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
                      <SelectItem value="off_duty">Off Duty</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  {dialogMode === "edit" && status === "on_trip" && (
                    <span className="mt-1 block text-[10px] text-muted-foreground leading-tight">
                      *Status locked during active trip
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
