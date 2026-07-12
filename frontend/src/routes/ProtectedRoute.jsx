import { ShieldAlertIcon } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePermissions } from "../context/PermissionsContext.jsx";

export default function ProtectedRoute({ children, resource, level = "view" }) {
  const { user, loading, hasPermission } = usePermissions();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-muted-foreground text-sm">
            Verifying access...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate replace to="/" />;
  }

  if (resource && !hasPermission(resource, level)) {
    return (
      <div className="flex h-[70vh] items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader className="pb-2 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlertIcon className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              Your current role does not have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 text-center">
            <p className="mb-4 text-muted-foreground text-sm">
              Required permission:{" "}
              <span className="font-semibold">
                {resource} ({level})
              </span>
            </p>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              variant="outline"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}
