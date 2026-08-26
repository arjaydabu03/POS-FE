import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../Api/store";

const schema = yup
  .object({
    username: yup.string().required("Username is required"),
    password: yup.string().required("Password is required"),
  })
  .required()
  .typeError();

// Route for each permission tag — same tags/paths used to filter nav
// links in Sidebar.jsx.
const PERMISSION_ROUTES = {
  dashboard: "/dashboard",
  cashier: "/cashier",
  user: "/user",
  products: "/products",
  receiving: "/receiving",
  category: "/category",
  uom: "/uom",
  supplier: "/supplier",
  miscellaneous: "/miscellaneous",
  "miscellaneous issue": "/miscellaneous_issue",
  "move order": "/move_order",
  "inventory mrp": "/mrp",
};

// `res.data.permission` is a comma-separated list of permission tags
// (e.g. "user, dashboard, cashier"), not a single value — same shape
// Sidebar.jsx reads from localStorage and normalizes. Duplicated here
// since Login runs before Sidebar mounts.
function normalizePermissions(permission) {
  if (!permission) return [];
  if (Array.isArray(permission)) {
    return permission.map((p) => p.trim()).filter(Boolean);
  }
  return permission
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

// Picks where to land the user after login: prefer /dashboard if they
// have that permission, otherwise send them to the first page in their
// permission list that actually has a route. Falls back to /login (no
// usable permissions) rather than a page they can't see in the sidebar.
function resolveLandingRoute(rawPermission) {
  const permissions = normalizePermissions(rawPermission);

  if (permissions.includes("dashboard")) return "/dashboard";

  const firstRoutable = permissions.find((p) => PERMISSION_ROUTES[p]);
  return firstRoutable ? PERMISSION_ROUTES[firstRoutable] : "/login";
}

export function Login() {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    severity: "success",
    message: "",
  });
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  useEffect(() => {
    if (alertState.isOpen) {
      const timer = setTimeout(
        () => setAlertState((prev) => ({ ...prev, isOpen: false })),
        60000,
      );
      return () => clearTimeout(timer);
    }
  }, [alertState.isOpen]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (values) => {
    try {
      const res = await login(values).unwrap();
      setAlertState({
        isOpen: true,
        severity: "success",
        message: res.message,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", res.data.permission);

      // Navigate to the best page for this account's permission list.
      const destination = resolveLandingRoute(res.data.permission);

      navigate(destination);
    } catch (error) {
      setAlertState({
        isOpen: true,
        severity: "error",
        message: error?.data?.message ?? "Login failed. Please try again.",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      {alertState.isOpen && (
        <div className="fixed top-8 right-4 w-full max-w-sm">
          <Alert
            className={
              alertState.severity === "error" ? "bg-red-300" : "bg-green-300"
            }
            variant={
              alertState.severity === "error" ? "destructive" : "default"
            }
          >
            {alertState.severity === "error" ? (
              <XCircleIcon className="flex items-center" />
            ) : (
              <CheckCircle2Icon className="flex items-center" />
            )}
            <AlertDescription>{alertState.message}</AlertDescription>
          </Alert>
        </div>
      )}

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your username & password below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  {...register("username")}
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                />
                {errors.username && (
                  <p className="text-sm text-destructive">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  {...register("password")}
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>
            <CardFooter className="flex-col gap-2 px-0 pt-6">
              <Button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-900"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;
