import {
  Compass,
  FileSpreadsheet,
  Route,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

export default function Dashboard() {
  const [regions, setRegions] = useState([]);
  const [vehicleType, setVehicleType] = useState("all");
  const [regionId, setRegionId] = useState("all");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kpis: {
      activeTrips: 0,
      activeVehicles: 0,
      availableVehicles: 0,
      driversOnDuty: 0,
      fleetUtilization: 0,
      pendingTrips: 0,
      vehiclesInMaintenance: 0,
    },
    recentTrips: [],
    vehicleStatusBreakdown: {
      available: 0,
      inShop: 0,
      onTrip: 0,
      retired: 0,
    },
  });

  // Load regions
  useEffect(() => {
    async function loadRegions() {
      try {
        const res = await fetch("http://localhost:8000/api/vehicles/regions", {
          credentials: "include",
        });
        if (res.ok) {
          const regionsData = await res.json();
          setRegions(regionsData);
        }
      } catch (err) {
        console.error("Failed to load regions:", err);
      }
    }
    loadRegions();
  }, []);

  // Fetch Dashboard Stats
  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const url = new URL("http://localhost:8000/api/analytics/dashboard");
        if (vehicleType !== "all") {
          url.searchParams.append("type", vehicleType);
        }
        if (regionId !== "all") {
          url.searchParams.append("regionId", regionId);
        }

        const res = await fetch(url.toString(), {
          credentials: "include",
        });
        if (res.ok) {
          const stats = await res.json();
          setData(stats);
        }
      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [vehicleType, regionId]);

  // Compute status breakdown percentages
  const { available, onTrip, inShop, retired } = data.vehicleStatusBreakdown;
  const totalVehicles = available + onTrip + inShop + retired;
  const getPercent = (count) =>
    totalVehicles > 0 ? (count / totalVehicles) * 100 : 0;

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "dispatched":
        return <Badge variant="outline">Dispatched</Badge>;
      case "on_trip":
      case "on trip":
        return (
          <Badge className="border-0 bg-chart-2 text-white hover:bg-chart-2/80">
            On Trip
          </Badge>
        );
      case "completed":
        return (
          <Badge className="border-0 bg-chart-1 text-white hover:bg-chart-1/80">
            Completed
          </Badge>
        );
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex min-w-[150px] flex-col gap-1.5">
          <label className="font-semibold text-muted-foreground text-xs">
            Vehicle Type
          </label>
          <Select onValueChange={setVehicleType} value={vehicleType}>
            <SelectTrigger className="w-full border-input bg-transparent">
              <SelectValue>
                {vehicleType === "all"
                  ? "All Types"
                  : vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}
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
        </div>

        <div className="flex min-w-[200px] flex-col gap-1.5">
          <label className="font-semibold text-muted-foreground text-xs">
            Region / Depot
          </label>
          <Select onValueChange={setRegionId} value={regionId}>
            <SelectTrigger className="w-full border-input bg-transparent">
              <SelectValue>
                {regionId === "all"
                  ? "All Regions"
                  : regions.find((r) => r.id === regionId)?.name ||
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

        {loading && (
          <div className="mt-4 ml-auto flex items-center gap-2 text-muted-foreground text-sm sm:mt-0">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
              Active Vehicles
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{data.kpis.activeVehicles}</div>
            <p className="text-muted-foreground text-xs">Currently on trip</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
              Available Vehicles
            </CardTitle>
            <Compass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {data.kpis.availableVehicles}
            </div>
            <p className="text-muted-foreground text-xs">Ready for dispatch</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
              Vehicles In Shop
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {data.kpis.vehiclesInMaintenance}
            </div>
            <p className="text-muted-foreground text-xs">Under maintenance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
              Fleet Utilization
            </CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {data.kpis.fleetUtilization}%
            </div>
            <p className="text-muted-foreground text-xs">
              Active capacity ratio
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-bold text-muted-foreground text-sm uppercase tracking-wider">
              Active Trips
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Route className="h-8 w-8 text-muted-foreground" />
            <div>
              <div className="font-bold text-xl">{data.kpis.activeTrips}</div>
              <p className="text-muted-foreground text-xs">
                In-progress dispatches
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-bold text-muted-foreground text-sm uppercase tracking-wider">
              Pending Trips
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Route className="h-8 w-8 text-muted-foreground" />
            <div>
              <div className="font-bold text-xl">{data.kpis.pendingTrips}</div>
              <p className="text-muted-foreground text-xs">
                Trips saved as draft
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-bold text-muted-foreground text-sm uppercase tracking-wider">
              Drivers On Duty
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <div className="font-bold text-xl">{data.kpis.driversOnDuty}</div>
              <p className="text-muted-foreground text-xs">
                Drivers currently assigned
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent Trips + Vehicle Status distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Trips */}
        <Card className="border shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Trips</CardTitle>
            <CardDescription>
              Latest registered transport tasks and current status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentTrips.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No trips registered yet. Go to Trip Dispatcher to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip Code</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ETA / Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentTrips.map((trip) => {
                    let eta = "--";
                    if (trip.status === "dispatched") {
                      // Estimate ETA based on 60km/h average speed
                      const hours =
                        Number.parseFloat(trip.plannedDistanceKm) / 60;
                      if (hours < 1) {
                        eta = `${Math.round(hours * 60)} min`;
                      } else {
                        const h = Math.floor(hours);
                        const m = Math.round((hours - h) * 60);
                        eta = `${h}h ${m}m`;
                      }
                    } else if (trip.status === "draft") {
                      eta = "Awaiting dispatch";
                    } else if (trip.status === "completed") {
                      eta = "Finished";
                    } else if (trip.status === "cancelled") {
                      eta = "Cancelled";
                    }

                    return (
                      <TableRow key={trip.id}>
                        <TableCell className="font-semibold">
                          {trip.code}
                        </TableCell>
                        <TableCell>{trip.vehicle?.name || "--"}</TableCell>
                        <TableCell>{trip.driver?.name || "--"}</TableCell>
                        <TableCell>{getStatusBadge(trip.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {eta}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Status distribution */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              Vehicle Status Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of active vehicle fleet status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="inline-block h-3.5 w-3.5 rounded-full bg-chart-1" />
                  Available ({available})
                </span>
                <span className="text-muted-foreground">
                  {Math.round(getPercent(available))}%
                </span>
              </div>
              <Progress
                className="h-2 bg-muted [&>div]:bg-chart-1"
                value={getPercent(available)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="inline-block h-3.5 w-3.5 rounded-full bg-chart-2" />
                  On Trip ({onTrip})
                </span>
                <span className="text-muted-foreground">
                  {Math.round(getPercent(onTrip))}%
                </span>
              </div>
              <Progress
                className="h-2 bg-muted [&>div]:bg-chart-2"
                value={getPercent(onTrip)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="inline-block h-3.5 w-3.5 rounded-full bg-chart-3" />
                  In Shop ({inShop})
                </span>
                <span className="text-muted-foreground">
                  {Math.round(getPercent(inShop))}%
                </span>
              </div>
              <Progress
                className="h-2 bg-muted [&>div]:bg-chart-3"
                value={getPercent(inShop)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="inline-block h-3.5 w-3.5 rounded-full bg-chart-4" />
                  Retired ({retired})
                </span>
                <span className="text-muted-foreground">
                  {Math.round(getPercent(retired))}%
                </span>
              </div>
              <Progress
                className="h-2 bg-muted [&>div]:bg-chart-4"
                value={getPercent(retired)}
              />
            </div>

            <div className="mt-6 border-t pt-4 text-center text-muted-foreground text-xs">
              Total Managed Vehicles:{" "}
              <span className="font-semibold text-foreground">
                {totalVehicles}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
