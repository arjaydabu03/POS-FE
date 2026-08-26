import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const SIZE_CLASSES = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
  "6xl": "sm:max-w-6xl",
};

/**
 * ReusableDialog
 *
 * A generic dialog wrapper for forms, confirmations, or any modal content.
 * Handles title/description, sizing, optional form submission, and a
 * standard Cancel/Confirm footer (or a fully custom one).
 *
 * ── Basic usage ──────────────────────────────────────────────
 * <ReusableDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Create user"
 *   description="Add a new account and grant it access to this system."
 *   onSubmit={handleSubmit}
 *   confirmLabel="Create user"
 *   isLoading={isCreating}
 *   error={formError}
 * >
 *   <div className="flex flex-col gap-2">
 *     <Label htmlFor="name">Name</Label>
 *     <Input id="name" value={name} onChange={...} />
 *   </div>
 * </ReusableDialog>
 *
 * ── Confirmation dialog (no form) ───────────────────────────
 * <ReusableDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Archive user?"
 *   description="This can be undone later from the Archive view."
 *   confirmLabel="Archive"
 *   confirmVariant="destructive"
 *   onConfirm={handleArchive}
 *   isLoading={isArchiving}
 * />
 *
 * ── Fully custom footer ──────────────────────────────────────
 * <ReusableDialog open={open} onOpenChange={setOpen} title="Details" footer={<MyCustomFooter />}>
 *   ...content...
 * </ReusableDialog>
 */
function ReusableDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",

  // Form mode: wraps children in a <form> and calls onSubmit on submit
  onSubmit,

  // Non-form mode: confirm button calls onConfirm directly (e.g. for
  // confirmation dialogs with no fields)
  onConfirm,

  // Footer button config (ignored if `footer` is provided)
  cancelLabel = "Cancel",
  confirmLabel = "Save",
  confirmVariant = "default",
  hideCancel = false,
  isLoading = false,
  disabled = false,

  // Fully custom footer — if provided, all footer button props above are ignored
  footer,

  // Optional error message rendered above the footer
  error,

  className = "",
}) {
  const handleOpenChange = (next) => {
    if (isLoading) return; // prevent closing mid-submit
    onOpenChange?.(next);
  };

  const handleCancel = () => handleOpenChange(false);

  const handleConfirmClick = (e) => {
    if (onSubmit) return; // form's onSubmit will handle it
    e.preventDefault();
    onConfirm?.();
  };

  const footerContent = footer ?? (
    <DialogFooter className="">
      {!hideCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
          className=" hover:bg-red-500"
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        type={onSubmit ? "submit" : "button"}
        variant={confirmVariant}
        onClick={handleConfirmClick}
        disabled={isLoading || disabled}
        className="bg-sky-500 hover:bg-sky-900"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {confirmLabel}
      </Button>
    </DialogFooter>
  );

  const body = (
    <>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {footerContent}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`${SIZE_CLASSES[size] ?? SIZE_CLASSES.md} ${className}`}
      >
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}

        {onSubmit ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(e);
            }}
            className="flex flex-col gap-4"
          >
            {body}
          </form>
        ) : (
          <div className="flex flex-col gap-4">{body}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ReusableDialog;
