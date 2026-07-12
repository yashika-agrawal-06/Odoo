import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center px-4 text-center">
      <div>
        <p className="font-medium text-muted-foreground text-sm">404</p>
        <h1 className="mt-2 font-bold text-3xl">Page not found</h1>
        <Button className="mt-6" render={<Link to="/" />}>
          Return to login
        </Button>
      </div>
    </main>
  );
}
