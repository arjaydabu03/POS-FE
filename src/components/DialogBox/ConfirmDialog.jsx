// components/ConfirmDialog/ConfirmDialog.jsx
//
// A reusable confirmation dialog wrapping shadcn/ui's AlertDialog primitives.
// Use it anywhere you need a "Are you sure?" step — archive/restore, delete,
// save changes, sign out, etc. — without re-writing the same markup each time.
//
// ─── Basic usage ────────────────────────────────────────────────
//
//   const [target, setTarget] = useState(null);
//
//   <ConfirmDialog
//     open={!!target}
//     onOpenChange={(open) => !open && setTarget(null)}
//     title="Archive this user?"
//     description={`${target?.first_name} will lose access until restored.`}
//     confirmLabel="Archive"
//     onConfirm={async () => {
//       await archiveUser(target.id);
//       setTarget(null);
//     }}
//   />
//
// ─── Destructive action (red confirm button) ───────────────────
//
//   <ConfirmDialog
//     open={deleteTarget !== null}
//     onOpenChange={(open) => !open && setDeleteTarget(null)}
//     title="Delete this record?"
//     description="This action cannot be undone."
//     confirmLabel="Delete"
//     variant="destructive"
//     isLoading={isDeleting}
//     onConfirm={confirmDelete}
//   />
//
// ─── Trigger-based usage (no external open state) ──────────────
//
//   <ConfirmDialog
//     trigger={<Button variant="outline">Sign out</Button>}
//     title="Sign out?"
//     description="You'll need to log in again to continue."
//     onConfirm={handleSignOut}
//   />

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ConfirmDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  onConfirm,
  isLoading = false,
  loadingLabel,
  variant = "default",
  disableConfirm = false,
}) {
  const isControlled = open !== undefined;

  // Fallback local state so ConfirmDialog also works uncontrolled, driven
  // purely by `trigger`, for simple call sites that don't need to manage
  // open state themselves.
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const handleConfirm = async () => {
    await onConfirm?.();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <AlertDialogTrigger render={trigger} />}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="h-16">
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || disableConfirm}
            className={cn(
              variant === "destructive" &&
                buttonVariants({ variant: "destructive" }),
            )}
          >
            {isLoading ? (loadingLabel ?? `${confirmLabel}...`) : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
