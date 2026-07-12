import { Check, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePermissions } from "../context/PermissionsContext.jsx";

export default function Settings() {
  const { refreshPermissions } = usePermissions();
  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadMatrix = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("http://localhost:8000/api/settings/rbac", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setMatrix(data);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to load permissions grid");
      }
    } catch (err) {
      setErrorMsg("Network request failed. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, []);

  const handleLevelChange = (roleSlug, resource, newLevel) => {
    setMatrix((prev) =>
      prev.map((row) => {
        if (row.slug === roleSlug) {
          return {
            ...row,
            permissions: {
              ...row.permissions,
              [resource]: newLevel,
            },
          };
        }
        return row;
      })
    );
    setSuccess(false);
  };

  const handleToggleSettingsFlag = (roleSlug, val) => {
    setMatrix((prev) =>
      prev.map((row) => {
        if (row.slug === roleSlug) {
          return {
            ...row,
            canManageSettings: val,
          };
        }
        return row;
      })
    );
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccess(false);

    try {
      const res = await fetch("http://localhost:8000/api/settings/rbac", {
        body: JSON.stringify(matrix),
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });

      if (res.ok) {
        setSuccess(true);
        // Refresh local role authorization cache
        await refreshPermissions();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to save permissions configuration");
      }
    } catch (err) {
      setErrorMsg("Network request failed. Unable to save matrix settings.");
    } finally {
      setSaving(false);
    }
  };

  const resourcesList = [
    { name: "Fleet + Maintenance", slug: "fleet" },
    { name: "Drivers & Safety", slug: "drivers" },
    { name: "Trips Dispatcher", slug: "trips" },
    { name: "Fuel & Expenses", slug: "fuel_expenses" },
    { name: "Reports & Analytics", slug: "analytics" },
  ];

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Role-Based Access Control (RBAC) Settings Matrix
          </CardTitle>
          <CardDescription>
            Configure access permissions for resources by system role. In-memory
            cache is automatically invalidated when changes are saved.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {errorMsg && (
            <div className="px-6 py-2">
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            </div>
          )}

          {success && (
            <div className="px-6 py-2">
              <Alert className="flex items-center gap-2 border-green-600/30 bg-green-500/5 text-green-600">
                <Check className="h-4 w-4 shrink-0 text-green-600" />
                <div>
                  <AlertTitle className="font-semibold">Success</AlertTitle>
                  <AlertDescription>
                    Permissions matrix updated and local session policies
                    refreshed.
                  </AlertDescription>
                </div>
              </Alert>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground text-sm">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Loading matrix mappings...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Role Profile</TableHead>
                  {resourcesList.map((res) => (
                    <TableHead
                      className="min-w-[120px] text-center"
                      key={res.slug}
                    >
                      {res.name}
                    </TableHead>
                  ))}
                  <TableHead className="w-[150px] text-center">
                    Settings Module
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrix.map((row) => (
                  <TableRow key={row.roleId}>
                    <TableCell className="font-semibold text-sm">
                      {row.name}
                      <span className="block font-mono font-normal text-[10px] text-muted-foreground">
                        ({row.slug})
                      </span>
                    </TableCell>

                    {resourcesList.map((res) => {
                      const hasAccess =
                        (row.permissions[res.slug] || "none") !== "none";
                      return (
                        <TableCell className="py-4 text-center" key={res.slug}>
                          <div className="flex items-center justify-center gap-2">
                            {hasAccess ? (
                              <Check className="h-4 w-4 shrink-0 font-bold text-green-600" />
                            ) : (
                              <X className="h-4 w-4 shrink-0 font-bold text-destructive" />
                            )}
                            <Switch
                              checked={hasAccess}
                              onCheckedChange={(checked) =>
                                handleLevelChange(
                                  row.slug,
                                  res.slug,
                                  checked ? "full" : "none"
                                )
                              }
                            />
                          </div>
                        </TableCell>
                      );
                    })}

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {row.canManageSettings ? (
                          <Check className="h-4 w-4 shrink-0 font-bold text-green-600" />
                        ) : (
                          <X className="h-4 w-4 shrink-0 font-bold text-destructive" />
                        )}
                        <Switch
                          checked={!!row.canManageSettings}
                          onCheckedChange={(checked) =>
                            handleToggleSettingsFlag(row.slug, checked)
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
          <span className="text-muted-foreground text-xs">
            *Warning: Granting Settings access allows a role to redefine matrix
            permissions.
          </span>
          <Button
            className="font-semibold"
            disabled={saving || loading || matrix.length === 0}
            onClick={handleSave}
          >
            {saving ? "Saving Matrix..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
