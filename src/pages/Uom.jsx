import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Plus,
  UserPen,
  Archive,
  ArchiveRestore,
  Hamburger,
  Check,
  ChevronsUpDown,
  X,
  Search as SearchIcon,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import {
  useUomQuery,
  useCreateUomMutation,
  useUpdateUomMutation,
  useDeleteRestoreUomMutation,
} from "../Api/store";
import ReusableDialog from "../components/DialogBox/DialogBox";
import ConfirmDialog from "../components/DialogBox/ConfirmDialog";
import { useForm, Controller } from "react-hook-form";

function Uom() {
  //mutations

  //archived status
  const [archivedChecked, setArchivedChecked] = useState(false);
  const [page, setPage] = useState(1);

  //for search
  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Jump back to page 1 whenever the debounced search term changes —
  // otherwise you could be stuck on an empty page 3 after narrowing
  // the result set down.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, isError, error } = useUomQuery({
    status: archivedChecked ? "inactive" : "active",
    page,
    per_page: 10,
    search: debouncedSearch || undefined,
  });
  const STATUS_STYLES = {
    Active: "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15",
    Inactive: "bg-zinc-500/15 text-zinc-600 hover:bg-zinc-500/15",
  };

  //Create starts here
  const [createUom, { isLoading: isCreating }] = useCreateUomMutation();
  const EMPTY_FORM = {
    code: "",
    name: "",
  };
  const [createOpen, setCreateOpen] = useState(false);
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    control: createControl,
    reset: resetCreate,
    setError: setCreateError,
    formState: { errors: createErrors },
  } = useForm({
    defaultValues: EMPTY_FORM,
    mode: "onSubmit",
  });
  const handleCreateOpenChange = (open) => {
    setCreateOpen(open);
    if (!open) resetCreate(EMPTY_FORM);
  };

  const onCreateUom = async (values) => {
    try {
      await createUom({
        code: values.code.trim(),
        name: values.name.trim(),
      }).unwrap();

      setAlertState({
        isOpen: true,
        severity: "success",
        message: "Successfully created",
      });

      handleCreateOpenChange(false);
      setPage(1);
    } catch (err) {
      const firstError = err?.data?.errors;
      const message =
        firstError?.[0] ??
        firstError?.[1] ??
        "Something went wrong while creating this uom.";
      setCreateError("root", { message });
    }
  };

  //----archive and restore
  const handleArchiveRestore = async (uom) => {
    try {
      if (uom.deleted_at === null) {
        await deleteRestoreUom(uom.id).unwrap();
        setAlertState({
          isOpen: true,
          severity: "success",
          message: "Successfully archived",
        });
      } else {
        await deleteRestoreUom(uom.id).unwrap();
        setAlertState({
          isOpen: true,
          severity: "success",
          message: "Successfully restored",
        });
      }
    } catch (err) {
      setAlertState({
        isOpen: true,
        severity: "error",
        message: err?.data?.errors?.[0]?.detail ?? "Archive failed.",
      });
    }
  };
  // ── Confirmation dialog state ───────────────────────────────
  // archiveTarget: the user row pending archive/restore confirmation
  const [archiveTarget, setArchiveTarget] = useState(null);
  // pendingEdit: the validated form values waiting on "Save changes?" confirmation
  const [pendingEdit, setPendingEdit] = useState(null);

  // Called from the confirm dialog's "Confirm" button.
  const confirmArchiveRestore = async () => {
    if (!archiveTarget) return;
    await handleArchiveRestore(archiveTarget);
    setArchiveTarget(null);
  };

  //alert dialog
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

  //mutations

  const [updateUom, { isLoading: isUpdating }] = useUpdateUomMutation();
  const [deleteRestoreUom, { isLoading: isArchivingRestore }] =
    useDeleteRestoreUomMutation();
  // 👇 Pagination — adjust to match your actual response shape if it differs.
  const pagination = data?.data;
  const uom = pagination?.data ?? [];
  const currentPage = pagination?.current_page ?? 1;
  const lastPage = pagination?.last_page ?? 1;
  const perPage = pagination?.per_page ?? 6;
  const total = pagination?.total ?? 0;
  const goTo = (p) => setPage(Math.min(Math.max(p, 1), lastPage));
  function getPageNumbers(current, last) {
    if (last <= 3) {
      return Array.from({ length: last }, (_, i) => i + 1);
    }
    if (current === 1 || current === last) {
      return [1, "...", last];
    }
    return [1, "..", current, "...", last];
  }

  // ── Edit form ────────────────────────────────────────────────
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    control: editControl,
    reset: resetEdit,
    setError: setEditError,
    formState: { errors: editErrors },
  } = useForm({
    defaultValues: EMPTY_FORM,
    mode: "onSubmit",
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editingUom, setEditingUom] = useState(null);

  const openEditDialog = (c) => {
    setEditingUom(c);
    resetEdit({
      code: c.code ?? "",
      name: c.name ?? "",
    });
    setEditOpen(true);
  };

  const handleEditOpenChange = (open) => {
    setEditOpen(open);
    if (!open) {
      setEditingUom(null);
      resetEdit(EMPTY_FORM);
    }
  };

  const onEditUom = async (values) => {
    try {
      const payload = {
        id: editingUom.id,
        code: values.code.trim(),
        name: values.name.trim(),
      };

      await updateUom(payload).unwrap();
      setAlertState({
        isOpen: true,
        severity: "success",
        message: "Successfully Edited",
      });

      handleEditOpenChange(false);
    } catch (err) {
      const firstError = err?.data?.errors?.[0];
      const message =
        firstError?.detail ??
        firstError?.title ??
        "Something went wrong while updating this Uom.";
      setEditError("root", { message });
    }
  };

  // react-hook-form validates first; only on success do we stage the values
  // and open the "Save changes?" confirmation dialog.
  const stageEditUom = (values) => {
    setPendingEdit(values);
  };

  // Called from the confirm dialog's "Confirm" button.
  const confirmEditUom = async () => {
    if (!pendingEdit) return;
    await onEditUom(pendingEdit);
    setPendingEdit(null);
  };

  return (
    <div className="flex flex-col h-full p-6 ">
      {alertState.isOpen && (
        <div className="fixed top-4 right-4 w-full max-w-sm">
          <Alert
            className=" bg-green-200"
            variant={
              alertState.severity === "error" ? "destructive" : "default"
            }
          >
            {alertState.severity === "error" ? (
              <XCircleIcon className="flex items-center text-red-500" />
            ) : (
              <CheckCircle2Icon className="flex items-center" />
            )}
            <AlertDescription>{alertState.message}</AlertDescription>
          </Alert>
        </div>
      )}
      {/* header starts here */}
      <div className="flex">
        <div className="flex flex-col mb-2">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 ">
            Unit of Measurement
          </h1>
          <p className="text-sm text-zinc-500">Manage unit of measurements.</p>
        </div>
        <div className="flex items-center space-x-2 ml-auto mb-2 mt-2 text-sm gap-2">
          <div className="relative flex items-center">
            <SearchIcon className="pointer-events-none absolute left-2.5 h-4 w-4 text-zinc-400" />
            <Input
              id="search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 pl-8 pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 flex h-4 w-4 items-center justify-center text-zinc-400 hover:text-zinc-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Switch
            id="archive-mode"
            checked={archivedChecked}
            disabled={isLoading}
            onCheckedChange={(val) => {
              setArchivedChecked(val);
              setPage(1);
            }}
          />
          <Label htmlFor="archive-mode">Archive</Label>
          <Button className="bg-sky-500 hover:bg-sky-900" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-10" />
            Create
          </Button>
        </div>
      </div>
      {/* TABLE START HERE */}
      <div className="rounded-md border border-zinc-200">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="bg-sky-500 hover:bg-sky-500 ">
              <TableHead className="text-center text-white w-[10%]">
                ID
              </TableHead>
              <TableHead className="text-center text-white w-[10%]">
                CODE
              </TableHead>
              <TableHead className="text-center text-white w-[10%]">
                NAME
              </TableHead>

              <TableHead className="text-center text-white w-[13%]">
                STATUS
              </TableHead>
              <TableHead className="text-center text-white w-[10%]">
                ACTION
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-16 text-center text-xl text-black h-100"
                >
                  <div className="flex flex-col items-center justify-center text-md text-zinc-500 h-full">
                    <Spinner className="size-20" />
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-16 text-center text-md text-black h-100"
                >
                  {error?.data?.errors?.[0]?.title ??
                    "Failed to load unit of measurement."}
                </TableCell>
              </TableRow>
            ) : uom.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-sm text-zinc-500 py-6"
                >
                  No units of measurement found.
                </TableCell>
              </TableRow>
            ) : (
              uom.map((u) => (
                <TableRow key={u.id}>
                  <TableCell
                    className="font-medium truncate text-center"
                    title={u.id}
                  >
                    {u.id}
                  </TableCell>
                  <TableCell
                    className="font-medium truncate text-center"
                    title={u.code}
                  >
                    {u.code}
                  </TableCell>
                  <TableCell
                    className="font-medium truncate text-center"
                    title={u.name}
                  >
                    {u.name}
                  </TableCell>

                  <TableCell className="text-center ">
                    <Badge
                      className={
                        STATUS_STYLES[
                          u.deleted_at === null ? "Active" : "Inactive"
                        ]
                      }
                      variant="secondary"
                    >
                      {u.deleted_at === null ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="outline">
                            <Hamburger />
                          </Button>
                        }
                      />
                      <DropdownMenuContent className="w-30" align="start">
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => openEditDialog(u)}>
                            Edit
                            <DropdownMenuShortcut>
                              <UserPen />
                            </DropdownMenuShortcut>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            onClick={(e) => {
                              // prevent the menu's default close/select
                              // behavior from racing the AlertDialog opening
                              e.preventDefault();
                              setArchiveTarget(u);
                            }}
                          >
                            {u.deleted_at === null ? "Archive" : "Restore"}
                            <DropdownMenuShortcut>
                              {u.deleted_at === null ? (
                                <Archive />
                              ) : (
                                <ArchiveRestore />
                              )}
                            </DropdownMenuShortcut>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* pagination starts here */}
      {!isError && (
        <div className="mt-auto flex items-center justify-between mb-12  ">
          <p className="text-sm text-zinc-500">
            Showing {total === 0 ? 0 : (currentPage - 1) * perPage + 1}–
            {Math.min(currentPage * perPage, total)} of {total}
          </p>

          <Pagination className="mx-0 w-auto pt-2 ">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => goTo(currentPage - 1)}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {getPageNumbers(currentPage, lastPage).map((c, idx) =>
                c === "..." ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={c}>
                    <PaginationLink
                      isActive={c === currentPage}
                      onClick={() => goTo(c)}
                      className="cursor-pointer"
                    >
                      {c}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => goTo(currentPage + 1)}
                  className={
                    currentPage === lastPage
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* create dialog starts here */}

      <ReusableDialog
        open={createOpen}
        onOpenChange={handleCreateOpenChange}
        title="Create Unit of Measurement"
        description="Add a new unit of measurement."
        onSubmit={handleCreateSubmit(onCreateUom)}
        confirmLabel="Create"
        isLoading={isCreating}
        error={createErrors.root?.message}
        size="lg"
      >
        <UomFormFields
          register={registerCreate}
          control={createControl}
          errors={createErrors}
        />
      </ReusableDialog>

      {/* edit dialog starts here */}
      <ReusableDialog
        open={editOpen}
        onOpenChange={handleEditOpenChange}
        title="Edit Unit of Measurement"
        description="Update this unit of measurement's details."
        onSubmit={handleEditSubmit(stageEditUom)}
        confirmLabel="Save changes"
        isLoading={isUpdating}
        error={editErrors.root?.message}
        size="lg"
      >
        <UomFormFields
          register={registerEdit}
          control={editControl}
          errors={editErrors}
          isEdit
        />
      </ReusableDialog>

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title={
          archiveTarget?.deleted_at === null
            ? "Archive this unit of measurement?"
            : "Restore this unit of measurement?"
        }
        description={
          archiveTarget?.deleted_at === null
            ? `This unit of measurement will lose access until restored.`
            : `This unit of measurement will regain access to the system.`
        }
        confirmLabel={
          archiveTarget?.deleted_at === null ? "Archive" : "Restore"
        }
        isLoading={isArchivingRestore}
        loadingLabel="Working..."
        variant={archiveTarget?.deleted_at === null ? "destructive" : "default"}
        onConfirm={confirmArchiveRestore}
      />

      {/* edit confirmation */}
      <ConfirmDialog
        open={!!pendingEdit}
        onOpenChange={(open) => !open && setPendingEdit(null)}
        title="Save changes?"
        description={<>This will update unit of measurement details</>}
        confirmLabel="Save changes"
        isLoading={isUpdating}
        loadingLabel="Saving..."
        onConfirm={confirmEditUom}
      />
    </div>
  );
}

//forms
function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-600 mt-1">{message}</p>;
}

function UomFormFields({ register, errors }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          placeholder="e.g. PCS, BOX, LTR"
          {...register("code", { required: "Code is required." })}
        />
        <FieldError message={errors.code?.message} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="e.g. PIECE, BOX, LITER"
          {...register("name", { required: "Name is required." })}
        />
        <FieldError message={errors.name?.message} />
      </div>
    </>
  );
}

export default Uom;
