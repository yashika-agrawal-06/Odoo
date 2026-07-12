import { DollarSign, Fuel, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "../context/PermissionsContext.jsx";

export default function Finance() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("fuel_expenses", "full");

  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenseLogs, setExpenseLogs] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [tripsList, setTripsList] = useState([]);
  const [loadingFuel, setLoadingFuel] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  // Fuel Dialog
  const [isFuelOpen, setIsFuelOpen] = useState(false);
  const [fuelVehicleId, setFuelVehicleId] = useState("");
  const [fuelTripId, setFuelTripId] = useState("");
  const [fuelDate, setFuelDate] = useState("");
  const [liters, setLiters] = useState("");
  const [fuelCost, setFuelCost] = useState("");
  const [fuelError, setFuelError] = useState(null);

  // Expense Dialog
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [expVehicleId, setExpVehicleId] = useState("");
  const [expTripId, setExpTripId] = useState("");
  const [tollAmount, setTollAmount] = useState("");
  const [otherAmount, setOtherAmount] = useState("");
  const [expError, setExpError] = useState(null);

  const loadData = async () => {
    // Vehicles list
    try {
      const vRes = await fetch("http://localhost:8000/api/vehicles", {
        credentials: "include",
      });
      if (vRes.ok) {
        const vData = await vRes.json();
        setVehiclesList(vData);
      }

      const tRes = await fetch("http://localhost:8000/api/trips", {
        credentials: "include",
      });
      if (tRes.ok) {
        const tData = await tRes.json();
        setTripsList(tData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadFuel = async () => {
    setLoadingFuel(true);
    try {
      const res = await fetch("http://localhost:8000/api/finance/fuel", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setFuelLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFuel(false);
    }
  };

  const loadExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const res = await fetch("http://localhost:8000/api/finance/expenses", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setExpenseLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    loadData();
    loadFuel();
    loadExpenses();
  }, []);

  // Handlers for Fuel Dialog
  const openFuelDialog = () => {
    setFuelVehicleId(vehiclesList.length > 0 ? vehiclesList[0].id : "");
    setFuelTripId("");
    setFuelDate(new Date().toISOString().split("T")[0]);
    setLiters("");
    setFuelCost("");
    setFuelError(null);
    setIsFuelOpen(true);
  };

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    setFuelError(null);

    try {
      const res = await fetch("http://localhost:8000/api/finance/fuel", {
        body: JSON.stringify({
          cost: fuelCost,
          date: fuelDate,
          liters,
          tripId: fuelTripId || null,
          vehicleId: fuelVehicleId,
        }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (res.ok) {
        setIsFuelOpen(false);
        loadFuel();
      } else {
        const err = await res.json();
        setFuelError(err.error || "Failed to log fuel entry");
      }
    } catch (err) {
      setFuelError("Network request failed");
    }
  };

  const handleDeleteFuel = async (id) => {
    if (!window.confirm("Delete this fuel log?")) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/finance/fuel/${id}`, {
        credentials: "include",
        method: "DELETE",
      });
      if (res.ok) {
        loadFuel();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Expense Dialog
  const openExpenseDialog = () => {
    setExpVehicleId(vehiclesList.length > 0 ? vehiclesList[0].id : "");
    setExpTripId("");
    setTollAmount("");
    setOtherAmount("");
    setExpError(null);
    setIsExpenseOpen(true);
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setExpError(null);

    try {
      const res = await fetch("http://localhost:8000/api/finance/expenses", {
        body: JSON.stringify({
          otherAmount: otherAmount || "0.00",
          tollAmount: tollAmount || "0.00",
          tripId: expTripId || null,
          vehicleId: expVehicleId,
        }),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (res.ok) {
        setIsExpenseOpen(false);
        loadExpenses();
      } else {
        const err = await res.json();
        setExpError(err.error || "Failed to log expense");
      }
    } catch (err) {
      setExpError("Network request failed");
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Delete this expense log?")) {
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:8000/api/finance/expenses/${id}`,
        {
          credentials: "include",
          method: "DELETE",
        }
      );
      if (res.ok) {
        loadExpenses();
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
      <Tabs className="w-full" defaultValue="fuel">
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-card px-4 py-2 shadow-sm">
          <TabsList className="h-9">
            <TabsTrigger
              className="flex h-7 items-center gap-1.5 font-semibold text-xs"
              value="fuel"
            >
              <Fuel className="h-3.5 w-3.5" />
              Fuel Refills
            </TabsTrigger>
            <TabsTrigger
              className="flex h-7 items-center gap-1.5 font-semibold text-xs"
              value="expenses"
            >
              <DollarSign className="h-3.5 w-3.5" />
              Tolls & Travel Expenses
            </TabsTrigger>
          </TabsList>

          <TabsContent className="mt-0" value="fuel">
            {canEdit && (
              <Button
                className="font-semibold"
                onClick={openFuelDialog}
                size="sm"
              >
                <Plus className="mr-1 h-4 w-4" /> Log Fuel
              </Button>
            )}
          </TabsContent>

          <TabsContent className="mt-0" value="expenses">
            {canEdit && (
              <Button
                className="font-semibold"
                onClick={openExpenseDialog}
                size="sm"
              >
                <Plus className="mr-1 h-4 w-4" /> Log Expense
              </Button>
            )}
          </TabsContent>
        </div>

        {/* Tab 1: Fuel Logs Content */}
        <TabsContent className="mt-0" value="fuel">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Fuel Transaction Logs</CardTitle>
              <CardDescription>
                Refill liters and costs mapped to vehicle fleet.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingFuel ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground text-sm">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span>Loading records...</span>
                </div>
              ) : fuelLogs.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No fuel logs registered.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Linked Trip</TableHead>
                      <TableHead>Refill Date</TableHead>
                      <TableHead>Liters</TableHead>
                      <TableHead>Total Cost</TableHead>
                      {canEdit && (
                        <TableHead className="text-right">Action</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fuelLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-semibold">
                          {log.vehicle?.name || "--"} (
                          {log.vehicle?.regNo || "--"})
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-primary text-sm">
                          {log.trip?.code || "Manual Refill"}
                        </TableCell>
                        <TableCell>
                          {new Date(log.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {Number.parseFloat(log.liters).toFixed(2)} L
                        </TableCell>
                        <TableCell>{formatCost(log.cost)}</TableCell>
                        {canEdit && (
                          <TableCell className="h-12 text-right">
                            <Button
                              className="group h-8 w-8 hover:bg-destructive/10"
                              onClick={() => handleDeleteFuel(log.id)}
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
        </TabsContent>

        {/* Tab 2: Expenses Logs Content */}
        <TabsContent className="mt-0" value="expenses">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                Miscellaneous Travel Expenses
              </CardTitle>
              <CardDescription>
                Records of tolls and other travel expenses per route.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingExpenses ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground text-sm">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span>Loading records...</span>
                </div>
              ) : expenseLogs.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No travel expenses logged.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Linked Trip</TableHead>
                      <TableHead>Toll Amount</TableHead>
                      <TableHead>Other misc</TableHead>
                      <TableHead>Total Cost</TableHead>
                      {canEdit && (
                        <TableHead className="text-right">Action</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseLogs.map((log) => {
                      const total =
                        Number.parseFloat(log.tollAmount) +
                        Number.parseFloat(log.otherAmount);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-semibold">
                            {log.vehicle?.name || "--"} (
                            {log.vehicle?.regNo || "--"})
                          </TableCell>
                          <TableCell className="font-mono font-semibold text-primary text-sm">
                            {log.trip?.code || "Manual Log"}
                          </TableCell>
                          <TableCell>{formatCost(log.tollAmount)}</TableCell>
                          <TableCell>{formatCost(log.otherAmount)}</TableCell>
                          <TableCell className="font-bold text-foreground">
                            {formatCost(total)}
                          </TableCell>
                          {canEdit && (
                            <TableCell className="h-12 text-right">
                              <Button
                                className="group h-8 w-8 hover:bg-destructive/10"
                                onClick={() => handleDeleteExpense(log.id)}
                                size="icon"
                                variant="ghost"
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive" />
                              </Button>
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
        </TabsContent>
      </Tabs>

      {/* Log Fuel Dialog */}
      <Dialog onOpenChange={setIsFuelOpen} open={isFuelOpen}>
        <DialogContent className="w-full max-w-md border border-border">
          <form onSubmit={handleFuelSubmit}>
            <DialogHeader>
              <DialogTitle>Log Fuel Transaction</DialogTitle>
              <DialogDescription>
                Input refill details for the vehicle.
              </DialogDescription>
            </DialogHeader>

            {fuelError && (
              <Alert className="my-2" variant="destructive">
                <AlertDescription>{fuelError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Vehicle</Label>
                <Select onValueChange={setFuelVehicleId} value={fuelVehicleId}>
                  <SelectTrigger className="w-full border-input bg-transparent">
                    <SelectValue>
                      {vehiclesList.find((v) => v.id === fuelVehicleId)
                        ? `${vehiclesList.find((v) => v.id === fuelVehicleId).name} (${vehiclesList.find((v) => v.id === fuelVehicleId).regNo})`
                        : "Select vehicle..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {vehiclesList.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} ({v.regNo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Trip (Optional)</Label>
                <Select
                  onValueChange={(val) =>
                    setFuelTripId(val === "none" ? "" : val)
                  }
                  value={fuelTripId || "none"}
                >
                  <SelectTrigger className="w-full border-input bg-transparent">
                    <SelectValue>
                      {tripsList.find((t) => t.id === fuelTripId)
                        ? `${tripsList.find((t) => t.id === fuelTripId).code} — ${tripsList.find((t) => t.id === fuelTripId).source} to ${tripsList.find((t) => t.id === fuelTripId).destination}`
                        : "Manual Entry (No active trip)"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      Manual Entry (No active trip)
                    </SelectItem>
                    {tripsList.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.code} — {t.source} to {t.destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-1.5">
                  <Label htmlFor="liters-input">Liters</Label>
                  <Input
                    id="liters-input"
                    onChange={(e) => setLiters(e.target.value)}
                    placeholder="Liters"
                    required
                    step="0.01"
                    type="number"
                    value={liters}
                  />
                </div>
                <div className="col-span-1 space-y-1.5">
                  <Label htmlFor="cost-input">Total Cost (INR)</Label>
                  <Input
                    id="cost-input"
                    onChange={(e) => setFuelCost(e.target.value)}
                    placeholder="Cost"
                    required
                    type="number"
                    value={fuelCost}
                  />
                </div>
                <div className="col-span-1 space-y-1.5">
                  <Label htmlFor="refill-date">Refill Date</Label>
                  <Input
                    id="refill-date"
                    onChange={(e) => setFuelDate(e.target.value)}
                    required
                    type="date"
                    value={fuelDate}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setIsFuelOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button className="font-semibold" type="submit">
                Log Refill
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log Expense Dialog */}
      <Dialog onOpenChange={setIsExpenseOpen} open={isExpenseOpen}>
        <DialogContent className="w-full max-w-md border border-border">
          <form onSubmit={handleExpenseSubmit}>
            <DialogHeader>
              <DialogTitle>Log Miscellaneous Expense</DialogTitle>
              <DialogDescription>
                Input tolls or other miscellaneous transit costs.
              </DialogDescription>
            </DialogHeader>

            {expError && (
              <Alert className="my-2" variant="destructive">
                <AlertDescription>{expError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Vehicle</Label>
                <Select onValueChange={setExpVehicleId} value={expVehicleId}>
                  <SelectTrigger className="w-full border-input bg-transparent">
                    <SelectValue>
                      {vehiclesList.find((v) => v.id === expVehicleId)
                        ? `${vehiclesList.find((v) => v.id === expVehicleId).name} (${vehiclesList.find((v) => v.id === expVehicleId).regNo})`
                        : "Select vehicle..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {vehiclesList.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} ({v.regNo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Trip (Optional)</Label>
                <Select
                  onValueChange={(val) =>
                    setExpTripId(val === "none" ? "" : val)
                  }
                  value={expTripId || "none"}
                >
                  <SelectTrigger className="w-full border-input bg-transparent">
                    <SelectValue>
                      {tripsList.find((t) => t.id === expTripId)
                        ? `${tripsList.find((t) => t.id === expTripId).code} — ${tripsList.find((t) => t.id === expTripId).source} to ${tripsList.find((t) => t.id === expTripId).destination}`
                        : "Manual Entry (No active trip)"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      Manual Entry (No active trip)
                    </SelectItem>
                    {tripsList.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.code} — {t.source} to {t.destination}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="toll-input">Tolls Cost (INR)</Label>
                  <Input
                    id="toll-input"
                    onChange={(e) => setTollAmount(e.target.value)}
                    placeholder="Toll cost"
                    type="number"
                    value={tollAmount}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="other-input">Other Cost (INR)</Label>
                  <Input
                    id="other-input"
                    onChange={(e) => setOtherAmount(e.target.value)}
                    placeholder="Other cost"
                    type="number"
                    value={otherAmount}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setIsExpenseOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button className="font-semibold" type="submit">
                Log Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
