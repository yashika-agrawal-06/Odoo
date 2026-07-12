import { AlertCircle, CheckCircle, Play, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { usePermissions } from "../context/PermissionsContext.jsx";

export default function Trips() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("trips", "full");

  const [tripsList, setTripsList] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [driversList, setDriversList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create Form State
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [cargoWeightKg, setCargoWeightKg] = useState("");
  const [plannedDistanceKm, setPlannedDistanceKm] = useState("");
  const [createError, setCreateError] = useState(null);

  // Complete Dialog State
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [completingTrip, setCompletingTrip] = useState(null);
  const [finalOdometer, setFinalOdometer] = useState("");
  const [revenue, setRevenue] = useState("");
  const [liters, setLiters] = useState("");
  const [fuelCost, setFuelCost] = useState("");
  const [fuelDate, setFuelDate] = useState("");
  const [tollAmount, setTollAmount] = useState("");
  const [otherAmount, setOtherAmount] = useState("");
  const [completeError, setCompleteError] = useState(null);

  // Cancel Dialog State
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancellingTrip, setCancellingTrip] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load trips
      const tripsRes = await fetch("http://localhost:8000/api/trips", {
        credentials: "include",
      });
      if (tripsRes.ok) {
        const data = await tripsRes.json();
        setTripsList(data);
      }

      // Load vehicles (to filter available ones)
      const vRes = await fetch("http://localhost:8000/api/vehicles", {
        credentials: "include",
      });
      if (vRes.ok) {
        const data = await vRes.json();
        setVehiclesList(data);
      }

      // Load drivers (to filter available ones)
      const dRes = await fetch("http://localhost:8000/api/drivers", {
        credentials: "include",
      });
      if (dRes.ok) {
        const data = await dRes.json();
        setDriversList(data);
      }
    } catch (err) {
      console.error("Failed to load dispatcher lists:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableVehicles = vehiclesList.filter(
    (v) => v.status === "available"
  );
  const availableDrivers = driversList.filter((d) => {
    const isExpired = new Date(d.licenseExpiry) < new Date();
    return d.status === "available" && !isExpired;
  });

  const selectedVehicle = vehiclesList.find((v) => v.id === selectedVehicleId);
  const selectedDriver = driversList.find((d) => d.id === selectedDriverId);

  // Validations
  let cargoWarning = null;
  const cargoWeight = Number.parseFloat(cargoWeightKg || 0);
  const vehicleCapacity = selectedVehicle
    ? Number.parseFloat(selectedVehicle.capacityKg)
    : 0;
  const isOverweight = selectedVehicle && cargoWeight > vehicleCapacity;

  if (isOverweight) {
    const diff = (cargoWeight - vehicleCapacity).toFixed(0);
    cargoWarning = `Vehicle Capacity: ${vehicleCapacity} kg. Cargo Weight: ${cargoWeight} kg. Capacity exceeded by ${diff} kg — dispatch blocked`;
  }

  // Handle Create Trip
  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setCreateError(null);

    if (isOverweight) {
      setCreateError("Cannot dispatch: cargo weight exceeds vehicle capacity.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/trips", {
        body: JSON.stringify({
          cargoWeightKg,
          destination,
          driverId: selectedDriverId,
          plannedDistanceKm,
          source,
          vehicleId: selectedVehicleId,
        }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (res.ok) {
        // Reset Form
        setSource("");
        setDestination("");
        setSelectedVehicleId("");
        setSelectedDriverId("");
        setCargoWeightKg("");
        setPlannedDistanceKm("");
        loadData();
      } else {
        const err = await res.json();
        setCreateError(err.error || "Failed to create trip");
      }
    } catch (err) {
      setCreateError("Network request failed");
    }
  };

  // Dispatch Trip
  const handleDispatch = async (tripId) => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/trips/${tripId}/dispatch`,
        {
          credentials: "include",
          method: "POST",
        }
      );
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to dispatch trip");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Complete Dialog
  const openCompleteDialog = (trip) => {
    setCompletingTrip(trip);
    setFinalOdometer(
      trip.vehicle?.odometerKm
        ? String(
            trip.vehicle.odometerKm +
              Math.round(Number.parseFloat(trip.plannedDistanceKm))
          )
        : ""
    );
    setRevenue("");
    setLiters("");
    setFuelCost("");
    setFuelDate(new Date().toISOString().split("T")[0]);
    setTollAmount("");
    setOtherAmount("");
    setCompleteError(null);
    setIsCompleteOpen(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    setCompleteError(null);

    const odometer = Number.parseInt(finalOdometer, 10);
    const startOdo = completingTrip.vehicle?.odometerKm || 0;
    if (odometer < startOdo) {
      setCompleteError(
        `Final odometer cannot be less than start odometer (${startOdo} km)`
      );
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8000/api/trips/${completingTrip.id}/complete`,
        {
          body: JSON.stringify({
            finalOdometerKm: finalOdometer,
            fuelCost: fuelCost || undefined,
            fuelDate: liters && fuelCost ? fuelDate : undefined,
            liters: liters || undefined,
            otherAmount: otherAmount || undefined,
            revenueAmount: revenue,
            tollAmount: tollAmount || undefined,
          }),
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }
      );

      if (res.ok) {
        setIsCompleteOpen(false);
        setCompletingTrip(null);
        loadData();
      } else {
        const err = await res.json();
        setCompleteError(err.error || "Failed to complete trip");
      }
    } catch (err) {
      setCompleteError("Network request failed");
    }
  };

  // Cancel Dialog
  const openCancelDialog = (trip) => {
    setCancellingTrip(trip);
    setCancelReason("");
    setCancelError(null);
    setIsCancelOpen(true);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    setCancelError(null);

    try {
      const res = await fetch(
        `http://localhost:8000/api/trips/${cancellingTrip.id}/cancel`,
        {
          body: JSON.stringify({ cancelReason }),
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }
      );

      if (res.ok) {
        setIsCancelOpen(false);
        setCancellingTrip(null);
        loadData();
      } else {
        const err = await res.json();
        setCancelError(err.error || "Failed to cancel trip");
      }
    } catch (err) {
      setCancelError("Network request failed");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "dispatched":
        return (
          <Badge className="bg-sky-500 font-medium text-white hover:bg-sky-500/80">
            Dispatched
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-600 font-medium text-white hover:bg-green-600/80">
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-destructive font-medium text-white hover:bg-destructive/80">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Create Trip Form Panel (Left) */}
      <div className="lg:col-span-1">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Create Trip Task</CardTitle>
            <CardDescription>
              Assign available vehicle and driver resources for transport.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateTrip}>
            <CardContent className="space-y-4">
              {createError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="source">Source Location</Label>
                <Input
                  disabled={!canEdit}
                  id="source"
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Gandhinagar Depot"
                  required
                  value={source}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  disabled={!canEdit}
                  id="destination"
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Ahmedabad Hub"
                  required
                  value={destination}
                />
              </div>

              <div className="space-y-2">
                <Label>Select Vehicle (Available Only)</Label>
                <Select
                  disabled={!canEdit}
                  onValueChange={setSelectedVehicleId}
                  value={selectedVehicleId}
                >
                  <SelectTrigger className="w-full border-input bg-transparent">
                    <SelectValue>
                      {availableVehicles.find((v) => v.id === selectedVehicleId)
                        ? `${availableVehicles.find((v) => v.id === selectedVehicleId).name} (${availableVehicles.find((v) => v.id === selectedVehicleId).regNo})`
                        : "Choose vehicle..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableVehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} ({v.regNo}) — Cap: {v.capacityKg} kg
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Driver (Available & Active Only)</Label>
                <Select
                  disabled={!canEdit}
                  onValueChange={setSelectedDriverId}
                  value={selectedDriverId}
                >
                  <SelectTrigger className="w-full border-input bg-transparent">
                    <SelectValue>
                      {availableDrivers.find((d) => d.id === selectedDriverId)
                        ? `${availableDrivers.find((d) => d.id === selectedDriverId).name} (${availableDrivers.find((d) => d.id === selectedDriverId).licenseCategory.toUpperCase()})`
                        : "Choose driver..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} ({d.licenseCategory.toUpperCase()}) — Score:{" "}
                        {d.safetyScore}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo Weight (kg)</Label>
                  <Input
                    disabled={!canEdit}
                    id="cargo"
                    onChange={(e) => setCargoWeightKg(e.target.value)}
                    placeholder="e.g. 450"
                    required
                    type="number"
                    value={cargoWeightKg}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distance">Planned Dist. (km)</Label>
                  <Input
                    disabled={!canEdit}
                    id="distance"
                    onChange={(e) => setPlannedDistanceKm(e.target.value)}
                    placeholder="e.g. 38"
                    required
                    type="number"
                    value={plannedDistanceKm}
                  />
                </div>
              </div>

              {/* Cargo capacity weight warning */}
              {cargoWarning && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 font-semibold text-destructive text-xs">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{cargoWarning}</span>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full font-semibold"
                disabled={!canEdit || isOverweight}
                type="submit"
              >
                Create Draft Trip
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Live Board (Right) */}
      <div className="space-y-4 lg:col-span-2">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Live Board</CardTitle>
            <CardDescription>
              Monitor active transport tasks and dispatch status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tripsList.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No trips scheduled. Complete the form to dispatch resources.
              </div>
            ) : (
              <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
                {tripsList.map((t) => (
                  <div
                    className="flex flex-col justify-between gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm md:flex-row md:items-center"
                    key={t.id}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-primary tracking-wide">
                          {t.code}
                        </span>
                        {getStatusBadge(t.status)}
                      </div>
                      <div className="flex items-center gap-1 font-medium text-sm">
                        <span>{t.source}</span>
                        <span className="text-muted-foreground">→</span>
                        <span>{t.destination}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground text-xs">
                        <div>
                          Vehicle:{" "}
                          <span className="font-semibold text-foreground">
                            {t.vehicle?.name || "--"}
                          </span>
                        </div>
                        <div>
                          Driver:{" "}
                          <span className="font-semibold text-foreground">
                            {t.driver?.name || "--"}
                          </span>
                        </div>
                        <div>
                          Cargo Weight:{" "}
                          <span className="font-semibold text-foreground">
                            {Math.round(t.cargoWeightKg)} kg
                          </span>
                        </div>
                        <div>
                          Distance:{" "}
                          <span className="font-semibold text-foreground">
                            {Math.round(t.plannedDistanceKm)} km
                          </span>
                        </div>
                      </div>
                      {t.status === "cancelled" && t.cancelReason && (
                        <div className="mt-2 rounded border border-destructive/10 bg-destructive/5 p-2 text-destructive text-xs">
                          <span className="font-bold">Reason:</span>{" "}
                          {t.cancelReason}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {canEdit && (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {t.status === "draft" && (
                          <Button
                            className="flex items-center gap-1.5 bg-sky-500 font-semibold text-white hover:bg-sky-500/80"
                            onClick={() => handleDispatch(t.id)}
                            size="sm"
                          >
                            <Play className="h-3.5 w-3.5" />
                            Dispatch
                          </Button>
                        )}
                        {t.status === "dispatched" && (
                          <>
                            <Button
                              className="flex items-center gap-1.5 bg-green-600 font-semibold text-white hover:bg-green-600/80"
                              onClick={() => openCompleteDialog(t)}
                              size="sm"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Complete
                            </Button>
                            <Button
                              className="flex items-center gap-1.5 font-semibold"
                              onClick={() => openCancelDialog(t)}
                              size="sm"
                              variant="destructive"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Complete Trip Dialog Modal */}
      {completingTrip && (
        <Dialog onOpenChange={setIsCompleteOpen} open={isCompleteOpen}>
          <DialogContent className="w-full max-w-md border border-border">
            <form onSubmit={handleCompleteSubmit}>
              <DialogHeader>
                <DialogTitle>Complete Trip {completingTrip.code}</DialogTitle>
                <DialogDescription>
                  Enter final odometer, revenue, fuel log, and miscellaneous
                  tolls.
                </DialogDescription>
              </DialogHeader>

              {completeError && (
                <Alert className="my-2" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{completeError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="final-odometer">Final Odometer (km)</Label>
                    <Input
                      id="final-odometer"
                      onChange={(e) => setFinalOdometer(e.target.value)}
                      placeholder={`Min: ${completingTrip.vehicle?.odometerKm}`}
                      required
                      type="number"
                      value={finalOdometer}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="revenue">Trip Revenue (INR)</Label>
                    <Input
                      id="revenue"
                      onChange={(e) => setRevenue(e.target.value)}
                      placeholder="e.g. 15000"
                      required
                      type="number"
                      value={revenue}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="mb-2 font-bold text-primary text-sm">
                    Fuel Logs (Optional)
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1 space-y-1.5">
                      <Label className="text-xs" htmlFor="fuel-liters">
                        Liters
                      </Label>
                      <Input
                        id="fuel-liters"
                        onChange={(e) => setLiters(e.target.value)}
                        placeholder="Liters"
                        type="number"
                        value={liters}
                      />
                    </div>
                    <div className="col-span-1 space-y-1.5">
                      <Label className="text-xs" htmlFor="fuel-cost">
                        Total Cost (INR)
                      </Label>
                      <Input
                        id="fuel-cost"
                        onChange={(e) => setFuelCost(e.target.value)}
                        placeholder="Cost"
                        type="number"
                        value={fuelCost}
                      />
                    </div>
                    <div className="col-span-1 space-y-1.5">
                      <Label className="text-xs" htmlFor="fuel-date">
                        Date
                      </Label>
                      <Input
                        id="fuel-date"
                        onChange={(e) => setFuelDate(e.target.value)}
                        type="date"
                        value={fuelDate}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="mb-2 font-bold text-primary text-sm">
                    Expenses Logs (Optional)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs" htmlFor="toll-amount">
                        Tolls Cost (INR)
                      </Label>
                      <Input
                        id="toll-amount"
                        onChange={(e) => setTollAmount(e.target.value)}
                        placeholder="Tolls"
                        type="number"
                        value={tollAmount}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs" htmlFor="other-amount">
                        Other Cost (INR)
                      </Label>
                      <Input
                        id="other-amount"
                        onChange={(e) => setOtherAmount(e.target.value)}
                        placeholder="Other misc"
                        type="number"
                        value={otherAmount}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setIsCompleteOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-green-600 font-semibold text-white hover:bg-green-600/80"
                  type="submit"
                >
                  Submit & Complete
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Cancel Trip Dialog Modal */}
      {cancellingTrip && (
        <Dialog onOpenChange={setIsCancelOpen} open={isCancelOpen}>
          <DialogContent className="w-full max-w-md border border-border">
            <form onSubmit={handleCancelSubmit}>
              <DialogHeader>
                <DialogTitle>Cancel Trip {cancellingTrip.code}</DialogTitle>
                <DialogDescription>
                  Explain why this dispatch is being cancelled. Links resources
                  back to available.
                </DialogDescription>
              </DialogHeader>

              {cancelError && (
                <Alert className="my-2" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{cancelError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cancel-reason">Cancellation Reason</Label>
                  <Input
                    id="cancel-reason"
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Vehicle went to shop or cargo cancelled"
                    required
                    value={cancelReason}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setIsCancelOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Back
                </Button>
                <Button
                  className="font-semibold"
                  type="submit"
                  variant="destructive"
                >
                  Confirm Cancellation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
