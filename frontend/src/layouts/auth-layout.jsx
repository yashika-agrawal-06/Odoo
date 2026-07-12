import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <main className="grid min-h-svh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </main>
  );
}
