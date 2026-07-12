import { Activity, Download } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    fleetOverview: {
      fuelEfficiency: 0,
      operationalCost: 0,
      totalDistance: 0,
      totalFuelCost: 0,
      totalFuelLiters: 0,
      totalMaintenanceCost: 0,
      totalOtherExpenses: 0,
      totalRevenue: 0,
      totalTolls: 0,
    },
    monthlyData: [],
    vehicleMetrics: [],
  });

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/analytics/reports", {
        credentials: "include",
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error("Failed to load analytics reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleExportCSV = () => {
    if (data.vehicleMetrics.length === 0) {
      return;
    }

    // Build headers
    const headers = [
      "Registration Number",
      "Model Name",
      "Vehicle Type",
      "Status",
      "Total Distance (km)",
      "Total Revenue (INR)",
      "Fuel Refills (INR)",
      "Maintenance (INR)",
      "Tolls & Travel (INR)",
      "Operational Cost (INR)",
      "Fuel Efficiency (km/L)",
      "Vehicle ROI (%)",
    ];

    // Build rows
    const rows = data.vehicleMetrics.map((v) => [
      v.regNo,
      v.name,
      v.type.toUpperCase(),
      v.status.toUpperCase(),
      v.totalDistance,
      v.totalRevenue,
      v.totalFuelCost,
      v.totalMaintCost,
      (
        Number.parseFloat(v.totalTolls) + Number.parseFloat(v.totalOther)
      ).toFixed(2),
      v.operationalCost,
      v.fuelEfficiency.toFixed(2),
      (v.roi * 100).toFixed(1),
    ]);

    // Format CSV
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    // Download trigger
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `transitops_fleet_report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCost = (val) =>
    new Intl.NumberFormat("en-IN", {
      currency: "INR",
      maximumFractionDigits: 0,
      style: "currency",
    }).format(Number.parseFloat(val || 0));

  const { fleetOverview } = data;

  return (
    <div className="space-y-6">
      {/* Exporter header */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-1.5 font-semibold text-muted-foreground text-sm">
          <Activity className="h-4 w-4 text-primary" />
          <span>Operational Insights & Fleet Profitability Analytics</span>
        </div>
        <Button
          className="font-semibold"
          disabled={data.vehicleMetrics.length === 0}
          onClick={handleExportCSV}
        >
          <Download className="mr-1.5 h-4 w-4" />
          Export CSV Report
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground text-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Processing database records...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
                  Total Route Revenue
                </CardDescription>
                <CardTitle className="font-bold text-2xl text-chart-1">
                  {formatCost(fleetOverview.totalRevenue)}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
                  Total Fuel Costs
                </CardDescription>
                <CardTitle className="font-bold text-2xl text-chart-3">
                  {formatCost(fleetOverview.totalFuelCost)}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
                  Total Maintenance
                </CardDescription>
                <CardTitle className="font-bold text-2xl text-chart-4">
                  {formatCost(fleetOverview.totalMaintenanceCost)}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
                  Operational Cost
                </CardDescription>
                <CardTitle className="font-bold text-2xl text-foreground">
                  {formatCost(fleetOverview.operationalCost)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Chart 1: Revenue vs Operational Cost */}
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="font-semibold text-base">
                  Monthly Revenue vs Operational Costs
                </CardTitle>
                <CardDescription>
                  Visual comparison of fleet yields and expenses.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart
                    data={data.monthlyData}
                    margin={{ bottom: 0, left: -20, right: 10, top: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      axisLine={false}
                      dataKey="name"
                      fontSize={11}
                      stroke="#888888"
                      tickLine={false}
                    />
                    <YAxis
                      axisLine={false}
                      fontSize={11}
                      stroke="#888888"
                      tickLine={false}
                    />
                    <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />
                    <Legend
                      height={36}
                      verticalAlign="top"
                      wrapperStyle={{ fontSize: 12 }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="var(--chart-1)"
                      name="Revenue"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="operationalCost"
                      fill="var(--chart-2)"
                      name="Operational Cost"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 2: Cost breakdown Fuel vs Maint */}
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="font-semibold text-base">
                  Expense Type Breakdown
                </CardTitle>
                <CardDescription>
                  Comparison of direct fuel refills vs maintenance repair costs.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart
                    data={data.monthlyData}
                    margin={{ bottom: 0, left: -20, right: 10, top: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      axisLine={false}
                      dataKey="name"
                      fontSize={11}
                      stroke="#888888"
                      tickLine={false}
                    />
                    <YAxis
                      axisLine={false}
                      fontSize={11}
                      stroke="#888888"
                      tickLine={false}
                    />
                    <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />
                    <Legend
                      height={36}
                      verticalAlign="top"
                      wrapperStyle={{ fontSize: 12 }}
                    />
                    <Bar
                      dataKey="fuelCost"
                      fill="var(--chart-3)"
                      name="Fuel Costs"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="maintenanceCost"
                      fill="var(--chart-4)"
                      name="Maintenance Costs"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed ROI Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Fleet ROI & Yield Metrics
              </CardTitle>
              <CardDescription>
                Odometer stats, operational costs, and ROI per vehicle.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle Name</TableHead>
                    <TableHead>Distance Run</TableHead>
                    <TableHead>Maintenance</TableHead>
                    <TableHead>Fuel refills</TableHead>
                    <TableHead>Operational Cost</TableHead>
                    <TableHead>Fuel Efficiency</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Vehicle ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.vehicleMetrics.map((v) => {
                    const roiPercent = v.roi * 100;
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-semibold">
                          {v.name} ({v.regNo})
                        </TableCell>
                        <TableCell>{v.totalDistance} km</TableCell>
                        <TableCell>{formatCost(v.totalMaintCost)}</TableCell>
                        <TableCell>{formatCost(v.totalFuelCost)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatCost(v.operationalCost)}
                        </TableCell>
                        <TableCell>
                          {v.fuelEfficiency > 0
                            ? `${v.fuelEfficiency.toFixed(2)} km/L`
                            : "--"}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCost(v.totalRevenue)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-bold ${roiPercent >= 0 ? "text-green-600" : "text-destructive"}`}
                          >
                            {roiPercent >= 0 ? "+" : ""}
                            {roiPercent.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
