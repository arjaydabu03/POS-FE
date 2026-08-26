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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Plus,
  UserPen,
  Archive,
  ArchiveRestore,
  Hamburger,
  X,
  Search as SearchIcon,
  EyeIcon,
} from "lucide-react";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";

import {
  useMiscellaneousIssueQuery,
  useMrpQuery,
  useCreateMiscellaneousIssueMutation,
  useUpdateMiscellaneousIssueMutation,
  useDeleteRestoreMiscellaneousIssueMutation,
} from "../Api/store";
import ReusableDialog from "../components/DialogBox/DialogBox";
import ConfirmDialog from "../components/DialogBox/ConfirmDialog";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { Card } from "@/components/ui/card";

// A single blank line item used both to seed the form and to append new rows.

const EMPTY_FORM = {
  issue_date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
  transaction_type: "",
  remarks: "",
  miscellaneous_issue_items: [],
};
const TRANSACTION_TYPES = ["Reject", "Return", "Adjustment"];

function MiscellaneousIssue() {
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

  const { data, isLoading, isError, error } = useMiscellaneousIssueQuery({
    status: archivedChecked ? "inactive" : "active",
    page,
    per_page: 10,
    search: debouncedSearch || undefined,
  });

  // Item catalog used to populate the item picker in the form.
  const { data: productsData, isFetching: isProductsFetching } = useMrpQuery({
    status: "active",
    pagination: "none",
  });
  const products = productsData?.data ?? [];

  const STATUS_STYLES = {
    Active: "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15",
    Inactive: "bg-zinc-500/15 text-zinc-600 hover:bg-zinc-500/15",
  };

  //Create starts here
  const [createMiscellaneousIssue, { isLoading: isCreating }] =
    useCreateMiscellaneousIssueMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    control: createControl,
    reset: resetCreate,
    setValue: setValueCreate,
    setError: setCreateError,
    formState: { errors: createErrors },
  } = useForm({
    defaultValues: EMPTY_FORM,
    mode: "onSubmit",
  });
  const {
    fields: createFields,
    append: appendCreateLine,
    remove: removeCreateLine,
  } = useFieldArray({
    control: createControl,
    name: "miscellaneous_issue_items",
  });

  const handleCreateOpenChange = (open) => {
    setCreateOpen(open);
    if (!open) resetCreate(EMPTY_FORM);
  };

  const oncreateMiscellaneousIssue = async (values) => {
    if (
      !values.miscellaneous_issue_items ||
      values.miscellaneous_issue_items.length === 0
    ) {
      setAlertState({
        isOpen: true,
        severity: "error",
        message: "Select at least one item.",
      });
      return;
    }
    try {
      await createMiscellaneousIssue({
        issue_date: values.issue_date.trim(),
        transaction_type: values.transaction_type.trim(),
        remarks: values.remarks.trim(),
        miscellaneous_issue_items: values.miscellaneous_issue_items.map(
          (item) => ({
            item_code: item.item_code.trim(),
            item_description: item.item_description.trim(),
            category: item.category.trim(),
            unit_of_measurement: item.unit_of_measurement.trim(),
            quantity: item.quantity,
          }),
        ),
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
      const message = firstError
        ? Object.values(firstError)[0]?.[0]
        : "Something went wrong while creating this move order.";

      setCreateError("root", { message });
    }
  };

  //----archive and restore
  const handleArchiveRestore = async (move_order) => {
    try {
      if (move_order.deleted_at === null) {
        await deleteRestoreMiscellaneousIssue(move_order.id).unwrap();
        setAlertState({
          isOpen: true,
          severity: "success",
          message: "Successfully archived",
        });
      } else {
        await deleteRestoreMiscellaneousIssue(move_order.id).unwrap();
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

  const [updateMiscellaneousIssue, { isLoading: isUpdating }] =
    useUpdateMiscellaneousIssueMutation();
  const [deleteRestoreMiscellaneousIssue, { isLoading: isArchivingRestore }] =
    useDeleteRestoreMiscellaneousIssueMutation();
  // 👇 Pagination — adjust to match your actual response shape if it differs.
  const pagination = data?.data;
  const MiscellaneousIssue = pagination?.data ?? [];
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
    setValue: setValueEdit,
    setError: setEditError,
    formState: { errors: editErrors },
  } = useForm({
    defaultValues: EMPTY_FORM,
    mode: "onSubmit",
  });
  const {
    fields: editFields,
    append: appendEditLine,
    remove: removeEditLine,
  } = useFieldArray({
    control: editControl,
    name: "miscellaneous_issue_items",
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editingMiscellaneousIssue, setEditingMiscellaneousIssue] =
    useState(null);

  const openEditDialog = (p) => {
    setEditingMiscellaneousIssue(p);
    resetEdit({
      issue_date: p.issue_date ?? "",
      transaction_type: p.transaction_type ?? "",
      remarks: p.remarks ?? "",
      miscellaneous_issue_items: (p.issue_items ?? []).map((item) => ({
        id: item.id ?? "",
        item_code: item.item_code ?? "",
        item_description: item.item_description ?? "",
        category: item.category ?? "",
        unit_of_measurement: item.unit_of_measurement ?? "",
        quantity: item.quantity ?? "",
      })),
    });
    setEditOpen(true);
  };

  const handleEditOpenChange = (open) => {
    setEditOpen(open);
    if (!open) {
      setEditingMiscellaneousIssue(null);
      resetEdit(EMPTY_FORM);
    }
  };

  const onEditMiscellaneousIssue = async (values) => {
    try {
      const payload = {
        id: editingMiscellaneousIssue.id,
        issue_date: values.issue_date.trim(),
        transaction_type: values.transaction_type.trim(),
        remarks: values.remarks.trim(),
        miscellaneous_issue_items: values.miscellaneous_issue_items.map(
          (item) => ({
            id: item.id,
            item_code: item.item_code.trim(),
            item_description: item.item_description.trim(),
            category: item.category.trim(),
            unit_of_measurement: item.unit_of_measurement.trim(),
            quantity: item.quantity,
          }),
        ),
      };

      await updateMiscellaneousIssue(payload).unwrap();
      setAlertState({
        isOpen: true,
        severity: "success",
        message: "Successfully Edited",
      });

      handleEditOpenChange(false);
    } catch (err) {
      console.log(err);
      const firstError = err?.data?.errors?.[0];
      const message =
        firstError?.detail ??
        firstError?.title ??
        "Something went wrong while updating this Miscellaneous Issue.";
      setEditError("root", { message });
    }
  };

  // react-hook-form validates first; only on success do we stage the values
  // and open the "Save changes?" confirmation dialog.
  const stageEditMiscellaneousIssue = (values) => {
    if (
      !values.miscellaneous_issue_items ||
      values.miscellaneous_issue_items.length === 0
    ) {
      setAlertState({
        isOpen: true,
        severity: "error",
        message: "Select at least one item.",
      });
      return;
    }
    setPendingEdit(values);
  };

  // Called from the confirm dialog's "Confirm" button.
  const confirmEditMiscellaneousIssue = async () => {
    if (!pendingEdit) return;
    await onEditMiscellaneousIssue(pendingEdit);
    setPendingEdit(null);
  };

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingMiscellaneousIssue, setViewingMiscellaneousIssue] =
    useState(null);

  const openViewDialog = (p) => {
    setViewingMiscellaneousIssue(p);
    setViewOpen(true);
  };

  const handleViewOpenChange = (open) => {
    setViewOpen(open);
    if (!open) setViewingMiscellaneousIssue(null);
  };

  return (
    <div className="flex flex-col h-full p-6 ">
      {alertState.isOpen && (
        <div className="fixed top-4 right-4 w-full max-w-sm z-100">
          <Alert
            className={
              alertState.severity === "error" ? "bg-red-300" : "bg-green-300"
            }
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
            Miscellaneous Issue
          </h1>
          <p className="text-sm text-zinc-500">Manage Miscellaneous Issue.</p>
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
          <Button
            className="bg-sky-500 hover:bg-sky-900"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-10" />
            Create
          </Button>
        </div>
      </div>
      {/* TABLE START HERE */}
      <div className="w-full rounded-md border border-zinc-200">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="bg-sky-500 hover:bg-sky-500 ">
              <TableHead className="text-white text-center w-[10%]">
                ID
              </TableHead>
              <TableHead className="text-white ">ISSUE DATE</TableHead>

              <TableHead className="text-white">TRANSCATION TYPE</TableHead>
              <TableHead className="text-white text-center ">REMARKS</TableHead>
              <TableHead className="text-white text-center ">
                NO OF ITEMS
              </TableHead>
              <TableHead className="text-center text-white ">STATUS</TableHead>
              <TableHead className="text-center text-white ">ACTION</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
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
                  colSpan={7}
                  className="py-16 text-center text-md text-black h-100"
                >
                  {error?.data?.errors?.[0]?.title ??
                    "Failed to load Miscellaneous Issue."}
                </TableCell>
              </TableRow>
            ) : MiscellaneousIssue.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-sm text-zinc-500 py-6 h-100"
                >
                  <div className="flex flex-col items-center justify-center text-md text-zinc-500 h-full">
                    <Spinner className="size-20" />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              MiscellaneousIssue.map((p) => (
                <TableRow key={p.id}>
                  <TableCell
                    className="font-medium truncate text-center"
                    title={p.id}
                  >
                    {p.id}
                  </TableCell>
                  <TableCell
                    className="font-medium truncate"
                    title={p.issue_date}
                  >
                    {p.issue_date}
                  </TableCell>
                  <TableCell
                    className="font-medium truncate"
                    title={p.transaction_type}
                  >
                    {p.transaction_type}
                  </TableCell>
                  <TableCell
                    className="font-medium truncate text-center"
                    title={p.remarks ?? "—"}
                  >
                    {p.remarks === null ? "—" : p.remarks}
                  </TableCell>
                  <TableCell
                    className="font-medium truncate text-center"
                    title={p.issue_items.length}
                  >
                    {p.issue_items.length}
                  </TableCell>

                  <TableCell className="text-center ">
                    <Badge
                      className={
                        STATUS_STYLES[
                          p.deleted_at === null ? "Active" : "Inactive"
                        ]
                      }
                      variant="secondary"
                    >
                      {p.deleted_at === null ? "Active" : "Inactive"}
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
                          <DropdownMenuItem onClick={() => openViewDialog(p)}>
                            View
                            <DropdownMenuShortcut>
                              <EyeIcon />
                            </DropdownMenuShortcut>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(p)}>
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
                              setArchiveTarget(p);
                            }}
                          >
                            {p.deleted_at === null ? "Archive" : "Restore"}
                            <DropdownMenuShortcut>
                              {p.deleted_at === null ? (
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

              {getPageNumbers(currentPage, lastPage).map((p, idx) =>
                p === "..." ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === currentPage}
                      onClick={() => goTo(p)}
                      className="cursor-pointer"
                    >
                      {p}
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
        title="Create Miscellaneous Issue"
        description="Add a new Miscellaneous Issue."
        onSubmit={handleCreateSubmit(oncreateMiscellaneousIssue)}
        confirmLabel="Create"
        isLoading={isCreating}
        error={createErrors.root?.message}
        size="6xl"
      >
        <MiscellaneousIssueFormFields
          register={registerCreate}
          control={createControl}
          setValue={setValueCreate}
          errors={createErrors}
          products={products}
          isProductsFetching={isProductsFetching}
          fields={createFields}
          append={appendCreateLine}
          remove={removeCreateLine}
        />
      </ReusableDialog>

      {/* edit dialog starts here */}
      <ReusableDialog
        open={editOpen}
        onOpenChange={handleEditOpenChange}
        title="Edit Miscellaneous Issue"
        description="Update this  details."
        onSubmit={handleEditSubmit(stageEditMiscellaneousIssue)}
        confirmLabel="Save changes"
        isLoading={isUpdating}
        error={editErrors.root?.message}
        size="6xl"
      >
        <MiscellaneousIssueFormFields
          register={registerEdit}
          control={editControl}
          setValue={setValueEdit}
          errors={editErrors}
          products={products}
          isProductsFetching={isProductsFetching}
          fields={editFields}
          append={appendEditLine}
          remove={removeEditLine}
          isEdit
        />
      </ReusableDialog>
      {/* view dialog starts here */}
      <ReusableDialog
        open={viewOpen}
        onOpenChange={handleViewOpenChange}
        title="Miscellaneous Issue Details"
        description="Read-only view of this record."
        onSubmit={() => handleViewOpenChange(false)}
        confirmLabel="Close"
        size="6xl"
      >
        {viewingMiscellaneousIssue && (
          <div className="flex flex-col gap-4 ">
            <Card className=" w-full p-4 ">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-zinc-500 text-xs">Issue Date</Label>
                  <p className="text-sm font-medium">
                    {viewingMiscellaneousIssue.issue_date}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-zinc-500 text-xs">
                    Transaction type
                  </Label>
                  <p className="text-sm font-medium">
                    {viewingMiscellaneousIssue.transaction_type}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-zinc-500 text-xs">Status</Label>
                  <Badge
                    className={
                      STATUS_STYLES[
                        viewingMiscellaneousIssue.deleted_at === null
                          ? "Active"
                          : "Inactive"
                      ]
                    }
                    variant="secondary"
                  >
                    {viewingMiscellaneousIssue.deleted_at === null
                      ? "Active"
                      : "Inactive"}
                  </Badge>
                </div>
              </div>
              {viewingMiscellaneousIssue.remarks && (
                <div className="flex flex-col gap-1 mt-4">
                  <Label className="text-zinc-500 text-xs">Remarks</Label>
                  <p className="text-sm font-medium whitespace-pre-wrap">
                    {viewingMiscellaneousIssue.remarks}
                  </p>
                </div>
              )}
            </Card>

            <Card className="w-full p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-sky-500 hover:bg-sky-500">
                    <TableHead className="text-white text-center">
                      Item Code
                    </TableHead>
                    <TableHead className="text-white text-center">
                      Item Description
                    </TableHead>
                    <TableHead className="text-white text-center">
                      Category
                    </TableHead>
                    <TableHead className="text-white text-center">
                      UOM
                    </TableHead>
                    <TableHead className="text-white text-center">
                      Qty
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingMiscellaneousIssue.issue_items?.length ? (
                    viewingMiscellaneousIssue.issue_items.map((item, id) => (
                      <TableRow key={id} className="text-center">
                        <TableCell className="text-center">
                          {item.item_code}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.item_description}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.category}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.unit_of_measurement}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantity}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-sm text-zinc-500 py-6"
                      >
                        No items.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </ReusableDialog>

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title={
          archiveTarget?.deleted_at === null
            ? "Archive this account?"
            : "Restore this account?"
        }
        description={
          archiveTarget?.deleted_at === null
            ? `This account will lose access until restored.`
            : `This account will regain access to the system.`
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
        description={<>This will update Miscellaneous Issue details</>}
        confirmLabel="Save changes"
        isLoading={isUpdating}
        loadingLabel="Saving..."
        onConfirm={confirmEditMiscellaneousIssue}
      />
    </div>
  );
}

//forms
function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-600 mt-1">{message}</p>;
}

function MiscellaneousIssueFormFields({
  register,
  errors,
  control,
  setValue,
  products = [],
  isProductsFetching,
  fields = [],
  append,
  remove,
}) {
  // Watch every row's item_code/quantity so the checkbox state and quantity
  // inputs in the items table stay in sync with the field array.
  const watchedItems =
    useWatch({ control, name: "miscellaneous_issue_items" }) ?? [];

  const [itemSearch, setItemSearch] = useState("");
  const filteredProducts = itemSearch.trim()
    ? products.filter((p) => {
        const q = itemSearch.trim().toLowerCase();
        return (
          p.item_code?.toLowerCase().includes(q) ||
          p.item_description?.toLowerCase().includes(q)
        );
      })
    : products;

  // index in the field array for a given item_code, or -1 if not selected
  const indexOf = (item_code) =>
    watchedItems.findIndex((item) => item?.item_code === item_code);

  const allSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => indexOf(p.item_code) !== -1);

  const toggleProduct = (p, checked) => {
    const idx = indexOf(p.item_code);
    if (checked) {
      if (idx !== -1) return; // already selected
      append({
        item_code: p.item_code,
        item_description: p.item_description ?? "",
        category: p.category ?? "",
        unit_of_measurement: p.unit_of_measurement ?? "",
        quantity: "",
      });
    } else {
      if (idx === -1) return;
      remove(idx);
    }
  };

  const toggleAll = (checked) => {
    if (checked) {
      const toAdd = filteredProducts.filter((p) => indexOf(p.item_code) === -1);
      if (toAdd.length === 0) return;
      append(
        toAdd.map((p) => ({
          item_code: p.item_code,
          item_description: p.item_description ?? "",
          category: p.category ?? "",
          unit_of_measurement: p.unit_of_measurement ?? "",
          quantity: "",
        })),
      );
    } else {
      const codesToRemove = new Set(filteredProducts.map((p) => p.item_code));
      const indicesToRemove = watchedItems
        .map((item, i) => (codesToRemove.has(item?.item_code) ? i : -1))
        .filter((i) => i !== -1);
      if (indicesToRemove.length === 0) return;
      remove(indicesToRemove);
    }
  };

  return (
    <>
      <div className="flex flex-row gap-2">
        <div className="flex flex-col gap-2 flex-1">
          <Label htmlFor="issue_date">Miscellaneous Issue Date</Label>
          <Controller
            name="issue_date"
            control={control}
            rules={{ required: "Miscellaneous Issue date is required." }}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      id="issue_date"
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value
                        ? format(new Date(field.value), "PPP")
                        : "Pick a date"}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) =>
                      field.onChange(
                        date ? format(date, "yyyy-MM-dd HH:mm:ss") : "",
                      )
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          <FieldError message={errors.issue_date?.message} />
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <Label htmlFor="transaction_type">Transaction Type</Label>
          <Controller
            name="transaction_type"
            control={control}
            rules={{ required: "Transaction type is required." }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="transaction_type" className="w-full">
                  <SelectValue placeholder="Select a transaction type" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError message={errors.transaction_type?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea
          id="remarks"
          placeholder="Optional notes about this remarks"
          {...register("remarks")}
        />
        <FieldError message={errors.remarks?.message} />
      </div>

      {/* Items card — matches the ITEMS selection table design */}
      <Card className="w-full mt-4 py-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-zinc-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Items
            </span>
          </div>
          <div className="relative flex items-center">
            <SearchIcon className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-zinc-400" />
            <Input
              placeholder="Search items..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              className="h-8 w-48 pl-7 text-xs"
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-sky-500 hover:bg-sky-500">
                <TableHead className="w-10 text-white">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(val) => toggleAll(!!val)}
                    className="border-white data-[state=checked]:bg-white data-[state=checked]:text-white"
                  />
                </TableHead>
                <TableHead className="text-white">Item Code</TableHead>
                <TableHead className="text-white">Item Description</TableHead>
                <TableHead className="text-white">Category</TableHead>
                <TableHead className="text-white">Uom</TableHead>
                <TableHead className="w-24 text-center text-white">
                  SOH
                </TableHead>
                <TableHead className="w-32 text-center text-white">
                  Quantity
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-6 text-center text-sm text-zinc-500"
                  >
                    {isProductsFetching
                      ? "Loading items..."
                      : "No items found."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p) => {
                  const idx = indexOf(p.item_code);
                  const checked = idx !== -1;
                  // Numeric SOH used for the max-quantity check; null when
                  // the product has no usable SOH value (no cap applied).
                  const sohValue =
                    typeof p.soh === "number"
                      ? p.soh
                      : p.soh != null && !Number.isNaN(Number(p.soh))
                        ? Number(p.soh)
                        : null;
                  const soh = sohValue ?? "—";

                  return (
                    <TableRow key={p.id ?? p.item_code}>
                      <TableCell>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(val) => toggleProduct(p, !!val)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">
                        {p.item_code}
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.item_description}
                      </TableCell>
                      <TableCell className="text-sm">{p.category}</TableCell>
                      <TableCell className="text-sm">
                        {p.unit_of_measurement}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {soh}
                      </TableCell>
                      <TableCell className="text-center">
                        {checked ? (
                          <>
                            <Input
                              type="number"
                              placeholder="0"
                              min={0}
                              max={sohValue ?? undefined}
                              className={cn(
                                "mx-auto h-8 w-20 text-center",
                                "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                errors.miscellaneous_issue_items?.[idx]
                                  ?.quantity &&
                                  "border-red-500 focus-visible:ring-red-500",
                              )}
                              {...register(
                                `miscellaneous_issue_items.${idx}.quantity`,
                                {
                                  required: "Required.",
                                  validate: (value) => {
                                    if (sohValue === null) return true;
                                    if (Number(value) > sohValue) {
                                      return `Max ${sohValue}`;
                                    }
                                    if (Number(value) <= 0) {
                                      return "Must be > 0";
                                    }
                                    return true;
                                  },
                                  onChange: (e) => {
                                    if (
                                      sohValue !== null &&
                                      Number(e.target.value) > sohValue
                                    ) {
                                      e.target.value = String(sohValue);
                                    }
                                  },
                                },
                              )}
                            />
                            <FieldError
                              message={
                                errors.miscellaneous_issue_items?.[idx]
                                  ?.quantity?.message
                              }
                            />
                          </>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      <FieldError
        message={
          errors.miscellaneous_issue_items?.message ??
          errors.miscellaneous_issue_items?.root?.message
        }
      />
    </>
  );
}

export default MiscellaneousIssue;
