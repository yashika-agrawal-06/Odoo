import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/context/PermissionsContext";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function LoginForm({ className, ...props }) {
  const navigate = useNavigate();
  const { user, refreshPermissions } = usePermissions();

  const [activeTab, setActiveTab] = useState("login");

  // Sign In State
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState(null);
  const [signInLoading, setSignInLoading] = useState(false);

  // Sign Up State
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpRole, setSignUpRole] = useState("");
  const [signUpError, setSignUpError] = useState(null);
  const [signUpLoading, setSignUpLoading] = useState(false);

  const [rolesList, setRolesList] = useState([]);

  // Redirect if logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Load roles
  useEffect(() => {
    async function loadRoles() {
      try {
        const res = await fetch("http://localhost:8000/api/settings/roles");
        if (res.ok) {
          const data = await res.json();
          setRolesList(data);
          if (data.length > 0) {
            const dispatcher = data.find((r) => r.slug === "dispatcher");
            setSignUpRole(dispatcher ? dispatcher.id : data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadRoles();
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInError(null);
    setSignInLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email: signInEmail,
        password: signInPassword,
      });

      if (error) {
        setSignInError(error.message || "Invalid credentials");
      } else {
        await refreshPermissions();
        navigate("/dashboard");
      }
    } catch (err) {
      setSignInError("Connection failed");
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setSignUpError(null);
    setSignUpLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        email: signUpEmail,
        name: signUpName,
        password: signUpPassword,
        roleId: signUpRole || undefined,
      });

      if (error) {
        setSignUpError(error.message || "Sign up failed");
      } else {
        await refreshPermissions();
        navigate("/dashboard");
      }
    } catch (err) {
      setSignUpError("Connection failed");
    } finally {
      setSignUpLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="mb-6 grid h-10 w-full grid-cols-2 rounded-md bg-muted p-1">
          <TabsTrigger className="font-semibold text-xs" value="login">
            Sign In
          </TabsTrigger>
          <TabsTrigger className="font-semibold text-xs" value="register">
            Sign Up
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-0" value="login">
          <form className="flex flex-col gap-6" onSubmit={handleSignIn}>
            <FieldGroup>
              <div className="mb-2 flex flex-col items-center gap-1 text-center">
                <h1 className="font-bold text-2xl">Login to your account</h1>
                <p className="text-balance text-muted-foreground text-sm">
                  Enter your email below to login to your account
                </p>
              </div>

              {signInError && (
                <Alert className="py-2" variant="destructive">
                  <AlertDescription className="text-xs">
                    {signInError}
                  </AlertDescription>
                </Alert>
              )}

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="m@example.com"
                  required
                  type="email"
                  value={signInEmail}
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    className="ml-auto text-muted-foreground text-sm underline-offset-4 hover:underline"
                    href="#"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  onChange={(e) => setSignInPassword(e.target.value)}
                  required
                  type="password"
                  value={signInPassword}
                />
              </Field>

              <Field>
                <Button
                  className="w-full font-semibold"
                  disabled={signInLoading}
                  type="submit"
                >
                  {signInLoading ? "Logging in..." : "Login"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </TabsContent>

        <TabsContent className="mt-0" value="register">
          <form className="flex flex-col gap-6" onSubmit={handleSignUp}>
            <FieldGroup>
              <div className="mb-2 flex flex-col items-center gap-1 text-center">
                <h1 className="font-bold text-2xl">Create an account</h1>
                <p className="text-balance text-muted-foreground text-sm">
                  Register below to access TransitOps
                </p>
              </div>

              {signUpError && (
                <Alert className="py-2" variant="destructive">
                  <AlertDescription className="text-xs">
                    {signUpError}
                  </AlertDescription>
                </Alert>
              )}

              <Field>
                <FieldLabel htmlFor="reg-name">Full Name</FieldLabel>
                <Input
                  id="reg-name"
                  onChange={(e) => setSignUpName(e.target.value)}
                  placeholder="Alex Smith"
                  required
                  type="text"
                  value={signUpName}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="reg-email">Email</FieldLabel>
                <Input
                  id="reg-email"
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="m@example.com"
                  required
                  type="email"
                  value={signUpEmail}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="reg-password">Password</FieldLabel>
                <Input
                  id="reg-password"
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  required
                  type="password"
                  value={signUpPassword}
                />
              </Field>

              <Field className="rounded-lg border border-border bg-card p-3 text-card-foreground">
                <FieldLabel className="mb-1 font-semibold text-primary">
                  Assign Account Role
                </FieldLabel>
                <Select onValueChange={setSignUpRole} value={signUpRole}>
                  <SelectTrigger className="w-full border-input bg-transparent">
                    <SelectValue>
                      {rolesList.find((r) => r.id === signUpRole)?.name ||
                        "Select a role..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {rolesList.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="mt-1.5 block text-[10px] text-muted-foreground leading-normal">
                  *Demo mode role assignment. In production, roles are managed
                  by system administrators.
                </span>
              </Field>

              <Field>
                <Button
                  className="w-full font-semibold"
                  disabled={signUpLoading}
                  type="submit"
                >
                  {signUpLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
