import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { useLogoutMutation } from "../../Api/store"; // adjust to your actual api slice path

export default function AppBar({ onMenuClick }) {
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();
  const [alertState, setAlertState] = useState({
    isOpen: false,
    severity: "success",
    message: "",
  });

  useEffect(() => {
    if (alertState.isOpen) {
      const timer = setTimeout(
        () => setAlertState((prev) => ({ ...prev, isOpen: false })),
        3000,
      );
      return () => clearTimeout(timer);
    }
  }, [alertState.isOpen]);

  const onLogout = async () => {
    try {
      const res = await logout().unwrap();
      setAlertState({
        isOpen: true,
        severity: "success",
        message: res.message,
      });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.log(error);
      setAlertState({
        isOpen: true,
        severity: "error",
        message: error?.data?.message ?? "Logout failed. Please try again.",
      });
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-stone-100 px-4 shadow-sm">
      <div className="flex w-full justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger
            nativeButton={false}
            render={
              <Avatar>
                <AvatarFallback className="bg-sky-500 text-white">
                  A
                </AvatarFallback>
              </Avatar>
            }
          />
          <DropdownMenuContent className="w-40" align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuItem>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>

              <DropdownMenuItem>
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onLogout}>
                Log out
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {alertState.isOpen && (
        <div className="fixed top-8 right-4 w-full max-w-sm">
          <Alert
            variant={
              alertState.severity === "error" ? "destructive" : "default"
            }
          >
            {alertState.severity === "error" ? (
              <XCircleIcon />
            ) : (
              <CheckCircle2Icon />
            )}
            <AlertDescription>{alertState.message}</AlertDescription>
          </Alert>
        </div>
      )}
    </header>
  );
}
