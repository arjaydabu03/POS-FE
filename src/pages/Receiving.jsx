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
  Trash2,
  UserPen,
  Archive,
  ArchiveRestore,
  Hamburger,
  Check,
  ChevronDown,
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useReceivingQuery,
  useSupplierQuery,
  useProductsQuery,
  useCreateReceivingMutation,
  useUpdateReceivingMutation,
  useDeleteRestoreReceivingMutation,
} from "../Api/store";

import ReusableDialog from "../components/DialogBox/DialogBox";
import ConfirmDialog from "../components/DialogBox/ConfirmDialog";

import {
  useForm,
  useFieldArray,
  useWatch,
  Controller,
} from "react-hook-form";

import { Card } from "@/components/ui/card";

// ============================================================
// EMPTY VALUES
// ============================================================

const EMPTY_LINE_ITEM = {
  item_code: "",
  item_description: "",
  category: "",
  unit_of_measurement: "",
  quantity_received: "",
};

const EMPTY_FORM = {
  receiving_date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
  supplier_name: "",
  receiving_items: [{ ...EMPTY_LINE_ITEM }],
};

// ============================================================
// RECEIVING
// ============================================================

function Receiving() {
  // ==========================================================
  // ARCHIVE / SEARCH / TABLE PAGINATION
  // ==========================================================

  const [archivedChecked, setArchivedChecked] = useState(false);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useReceivingQuery({
    status: archivedChecked ? "inactive" : "active",
    page,
    per_page: 10,
    search: debouncedSearch || undefined,
  });

  // ==========================================================
  // STATUS STYLES
  // ==========================================================

  const STATUS_STYLES = {
    Active:
      "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15",

    Inactive:
      "bg-zinc-500/15 text-zinc-600 hover:bg-zinc-500/15",
  };

  // ==========================================================
  // CREATE
  // ==========================================================

  const [createProduct, { isLoading: isCreating }] =
    useCreateReceivingMutation();

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
    name: "receiving_items",
  });

  const handleCreateOpenChange = (open) => {
    setCreateOpen(open);

    if (!open) {
      resetCreate(EMPTY_FORM);
    }
  };

  const onCreateProduct = async (values) => {
    try {
      await createProduct({
        receiving_date: values.receiving_date.trim(),

        supplier_name: values.supplier_name.trim(),

        receiving_items: values.receiving_items.map((item) => ({
          item_code: item.item_code.trim(),

          item_description: item.item_description.trim(),

          category: item.category.trim(),

          unit_of_measurement: item.unit_of_measurement.trim(),

          quantity_received: item.quantity_received,
        })),
      }).unwrap();

      setAlertState({
        isOpen: true,
        severity: "success",
        message: "Successfully created",
      });

      handleCreateOpenChange(false);
      setPage(1);
    } catch (err) {
      const firstError = err?.data?.errors?.item_code;

      const message =
        firstError?.[0] ??
        firstError?.[1] ??
        "Something went wrong while creating this product.";

      setCreateError("root", {
        message,
      });
    }
  };

  // ==========================================================
  // ARCHIVE / RESTORE
  // ==========================================================

  const handleArchiveRestore = async (product) => {
    try {
      if (product.deleted_at === null) {
        await deleteRestoreProduct(product.id).unwrap();

        setAlertState({
          isOpen: true,
          severity: "success",
          message: "Successfully archived",
        });
      } else {
        await deleteRestoreProduct(product.id).unwrap();

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
        message:
          err?.data?.errors?.[0]?.detail ?? "Archive failed.",
      });
    }
  };

  const [archiveTarget, setArchiveTarget] = useState(null);

  const [pendingEdit, setPendingEdit] = useState(null);

  const confirmArchiveRestore = async () => {
    if (!archiveTarget) return;

    await handleArchiveRestore(archiveTarget);

    setArchiveTarget(null);
  };

  // ==========================================================
  // ALERT
  // ==========================================================

  const [alertState, setAlertState] = useState({
    isOpen: false,
    severity: "success",
    message: "",
  });

  useEffect(() => {
    if (alertState.isOpen) {
      const timer = setTimeout(() => {
        setAlertState((prev) => ({
          ...prev,
          isOpen: false,
        }));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [alertState.isOpen]);

  // ==========================================================
  // MUTATIONS
  // ==========================================================

  const [updateProduct, { isLoading: isUpdating }] =
    useUpdateReceivingMutation();

  const [
    deleteRestoreProduct,
    { isLoading: isArchivingRestore },
  ] = useDeleteRestoreReceivingMutation();

  // ==========================================================
  // TABLE PAGINATION
  // ==========================================================

  const pagination = data?.data;

  const Receiving = pagination?.data ?? [];

  const currentPage = pagination?.current_page ?? 1;

  const lastPage = pagination?.last_page ?? 1;

  const perPage = pagination?.per_page ?? 10;

  const total = pagination?.total ?? 0;

  const goTo = (p) => {
    setPage(Math.min(Math.max(p, 1), lastPage));
  };

  function getPageNumbers(current, last) {
    if (last <= 3) {
      return Array.from(
        { length: last },
        (_, i) => i + 1,
      );
    }

    if (current === 1 || current === last) {
      return [1, "...", last];
    }

    return [1, "...", current, "...", last];
  }

  // ==========================================================
  // EDIT
  // ==========================================================

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
    name: "receiving_items",
  });

  const [editOpen, setEditOpen] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);

  const openEditDialog = (p) => {
    setEditingProduct(p);

    resetEdit({
      receiving_date: p.receiving_date ?? "",

      supplier_name: p.supplier_name ?? "",

      receiving_items:
        p.receiving_items &&
        p.receiving_items.length > 0
          ? p.receiving_items.map((item) => ({
              item_code: item.item_code ?? "",

              item_description:
                item.item_description ?? "",

              category: item.category ?? "",

              unit_of_measurement:
                item.unit_of_measurement ?? "",

              quantity_received:
                item.quantity_received ?? "",
            }))
          : [
              {
                ...EMPTY_LINE_ITEM,
              },
            ],
    });

    setEditOpen(true);
  };

  const handleEditOpenChange = (open) => {
    setEditOpen(open);

    if (!open) {
      setEditingProduct(null);
      resetEdit(EMPTY_FORM);
    }
  };

  const onEditProduct = async (values) => {
    try {
      const payload = {
        id: editingProduct.id,

        receiving_date: values.receiving_date.trim(),

        supplier_name: values.supplier_name.trim(),

        receiving_items: values.receiving_items.map(
          (item) => ({
            item_code: item.item_code.trim(),

            item_description:
              item.item_description.trim(),

            category: item.category.trim(),

            unit_of_measurement:
              item.unit_of_measurement.trim(),

            quantity_received:
              item.quantity_received,
          }),
        ),
      };

      await updateProduct(payload).unwrap();

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
        "Something went wrong while updating this Product.";

      setEditError("root", {
        message,
      });
    }
  };

  const stageEditProduct = (values) => {
    setPendingEdit(values);
  };

  const confirmEditProduct = async () => {
    if (!pendingEdit) return;

    await onEditProduct(pendingEdit);

    setPendingEdit(null);
  };

  // ==========================================================
  // VIEW
  // ==========================================================

  const [viewOpen, setViewOpen] = useState(false);

  const [viewingProduct, setViewingProduct] =
    useState(null);

  const openViewDialog = (p) => {
    setViewingProduct(p);
    setViewOpen(true);
  };

  const handleViewOpenChange = (open) => {
    setViewOpen(open);

    if (!open) {
      setViewingProduct(null);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="flex flex-col h-full p-6">

      {/* ALERT */}

      {alertState.isOpen && (
        <div className="fixed top-4 right-4 w-full max-w-sm z-50">
          <Alert
            className="bg-green-200"
            variant={
              alertState.severity === "error"
                ? "destructive"
                : "default"
            }
          >
            {alertState.severity === "error" ? (
              <XCircleIcon className="text-red-500" />
            ) : (
              <CheckCircle2Icon />
            )}

            <AlertDescription>
              {alertState.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* HEADER */}

      <div className="flex">
        <div className="flex flex-col mb-2">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Receiving
          </h1>

          <p className="text-sm text-zinc-500">
            Manage Receiving.
          </p>
        </div>

        <div className="flex items-center space-x-2 ml-auto mb-2 mt-2 text-sm gap-2">

          {/* SEARCH */}

          <div className="relative flex items-center">
            <SearchIcon className="pointer-events-none absolute left-2.5 h-4 w-4 text-zinc-400" />

            <Input
              id="search"
              placeholder="Search"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-56 pl-8 pr-8"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 flex h-4 w-4 items-center justify-center text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* ARCHIVE */}

          <Switch
            id="archive-mode"
            checked={archivedChecked}
            disabled={isLoading}
            onCheckedChange={(val) => {
              setArchivedChecked(val);
              setPage(1);
            }}
          />

          <Label htmlFor="archive-mode">
            Archive
          </Label>

          {/* CREATE */}

          <Button
            className="bg-sky-500 hover:bg-sky-900"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-10" />
            Create
          </Button>
        </div>
      </div>

      {/* =====================================================
          TABLE
      ====================================================== */}

      <div className="w-full rounded-md border border-zinc-200">
        <Table className="table-fixed">

          <TableHeader>
            <TableRow className="bg-sky-500 hover:bg-sky-500">

              <TableHead className="text-white text-center w-[10%]">
                ID
              </TableHead>

              <TableHead className="text-white">
                RECEIVING DATE
              </TableHead>

              <TableHead className="text-white">
                SUPPLIER NAME
              </TableHead>

              <TableHead className="text-white text-center">
                NO OF ITEMS
              </TableHead>

              <TableHead className="text-center text-white">
                STATUS
              </TableHead>

              <TableHead className="text-center text-white">
                ACTION
              </TableHead>

            </TableRow>
          </TableHeader>

          <TableBody>

            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-16 text-center h-100"
                >
                  <div className="flex items-center justify-center h-full">
                    <Spinner className="size-20" />
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-16 text-center h-100"
                >
                  {error?.data?.errors?.[0]?.title ??
                    "Failed to load Receiving."}
                </TableCell>
              </TableRow>
            ) : Receiving.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-6 h-100"
                >
                  No receiving records found.
                </TableCell>
              </TableRow>
            ) : (
              Receiving.map((p) => (
                <TableRow key={p.id}>

                  <TableCell className="font-medium truncate text-center">
                    {p.id}
                  </TableCell>

                  <TableCell className="font-medium truncate">
                    {p.receiving_date}
                  </TableCell>

                  <TableCell className="font-medium truncate">
                    {p.supplier_name}
                  </TableCell>

                  <TableCell className="font-medium truncate text-center">
                    {p.receiving_items?.length ?? 0}
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge
                      className={
                        STATUS_STYLES[
                          p.deleted_at === null
                            ? "Active"
                            : "Inactive"
                        ]
                      }
                      variant="secondary"
                    >
                      {p.deleted_at === null
                        ? "Active"
                        : "Inactive"}
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

                      <DropdownMenuContent
                        className="w-30"
                        align="start"
                      >

                        <DropdownMenuGroup>

                          <DropdownMenuItem
                            onClick={() =>
                              openViewDialog(p)
                            }
                          >
                            View

                            <DropdownMenuShortcut>
                              <EyeIcon />
                            </DropdownMenuShortcut>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              openEditDialog(p)
                            }
                          >
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
                              e.preventDefault();
                              setArchiveTarget(p);
                            }}
                          >
                            {p.deleted_at === null
                              ? "Archive"
                              : "Restore"}

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

      {/* =====================================================
          TABLE PAGINATION
      ====================================================== */}

      {!isError && (
        <div className="mt-auto flex items-center justify-between mb-12">

          <p className="text-sm text-zinc-500">
            Showing{" "}
            {total === 0
              ? 0
              : (currentPage - 1) * perPage + 1}
            –
            {Math.min(
              currentPage * perPage,
              total,
            )}{" "}
            of {total}
          </p>

          <Pagination className="mx-0 w-auto pt-2">

            <PaginationContent>

              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    goTo(currentPage - 1)
                  }
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {getPageNumbers(
                currentPage,
                lastPage,
              ).map((p, idx) =>
                p === "..." ? (
                  <PaginationItem
                    key={`ellipsis-${idx}`}
                  >
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={
                        p === currentPage
                      }
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
                  onClick={() =>
                    goTo(currentPage + 1)
                  }
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

      {/* =====================================================
          CREATE
      ====================================================== */}

      <ReusableDialog
        open={createOpen}
        onOpenChange={handleCreateOpenChange}
        title="Create Receiving"
        description="Add a new product."
        onSubmit={handleCreateSubmit(onCreateProduct)}
        confirmLabel="Create"
        isLoading={isCreating}
        error={createErrors.root?.message}
        size="6xl"
      >
        <ProductFormFields
          register={registerCreate}
          control={createControl}
          setValue={setValueCreate}
          errors={createErrors}
          fields={createFields}
          append={appendCreateLine}
          remove={removeCreateLine}
        />
      </ReusableDialog>

      {/* =====================================================
          EDIT
      ====================================================== */}

      <ReusableDialog
        open={editOpen}
        onOpenChange={handleEditOpenChange}
        title="Edit product"
        description="Update this product's details."
        onSubmit={handleEditSubmit(
          stageEditProduct,
        )}
        confirmLabel="Save changes"
        isLoading={isUpdating}
        error={editErrors.root?.message}
        size="6xl"
      >
        <ProductFormFields
          register={registerEdit}
          control={editControl}
          setValue={setValueEdit}
          errors={editErrors}
          fields={editFields}
          append={appendEditLine}
          remove={removeEditLine}
        />
      </ReusableDialog>

      {/* =====================================================
          VIEW
      ====================================================== */}

      <ReusableDialog
        open={viewOpen}
        onOpenChange={handleViewOpenChange}
        title="Receiving Details"
        description="Read-only view of this receiving record."
        onSubmit={() =>
          handleViewOpenChange(false)
        }
        confirmLabel="Close"
        size="6xl"
      >
        {viewingProduct && (
          <div className="flex flex-col gap-4">

            <Card className="w-full p-4">

              <div className="grid grid-cols-3 gap-4">

                <div className="flex flex-col gap-1">
                  <Label className="text-zinc-500 text-xs">
                    Receiving Date
                  </Label>

                  <p className="text-sm font-medium">
                    {viewingProduct.receiving_date}
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="text-zinc-500 text-xs">
                    Supplier Name
                  </Label>

                  <p className="text-sm font-medium">
                    {viewingProduct.supplier_name}
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="text-zinc-500 text-xs">
                    Status
                  </Label>

                  <Badge
                    className={
                      STATUS_STYLES[
                        viewingProduct.deleted_at ===
                        null
                          ? "Active"
                          : "Inactive"
                      ]
                    }
                    variant="secondary"
                  >
                    {viewingProduct.deleted_at ===
                    null
                      ? "Active"
                      : "Inactive"}
                  </Badge>
                </div>

              </div>

            </Card>

            <Card className="w-full p-0 overflow-hidden">

              <Table>

                <TableHeader>
                  <TableRow className="bg-sky-500 hover:bg-sky-500">

                    <TableHead className="text-white text-center">
                      Item Code
                    </TableHead>

                    <TableHead className="text-white text-center">
                      Description
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

                  {viewingProduct.receiving_items
                    ?.length ? (
                    viewingProduct.receiving_items.map(
                      (item, id) => (
                        <TableRow
                          key={id}
                          className="text-center"
                        >
                          <TableCell>
                            {item.item_code}
                          </TableCell>

                          <TableCell>
                            {item.item_description}
                          </TableCell>

                          <TableCell>
                            {item.category}
                          </TableCell>

                          <TableCell>
                            {item.unit_of_measurement}
                          </TableCell>

                          <TableCell>
                            {item.quantity_received}
                          </TableCell>
                        </TableRow>
                      ),
                    )
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
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

      {/* =====================================================
          ARCHIVE CONFIRMATION
      ====================================================== */}

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) =>
          !open && setArchiveTarget(null)
        }
        title={
          archiveTarget?.deleted_at === null
            ? "Archive this account?"
            : "Restore this account?"
        }
        description={
          archiveTarget?.deleted_at === null
            ? "This account will lose access until restored."
            : "This account will regain access to the system."
        }
        confirmLabel={
          archiveTarget?.deleted_at === null
            ? "Archive"
            : "Restore"
        }
        isLoading={isArchivingRestore}
        loadingLabel="Working..."
        variant={
          archiveTarget?.deleted_at === null
            ? "destructive"
            : "default"
        }
        onConfirm={confirmArchiveRestore}
      />

      {/* =====================================================
          EDIT CONFIRMATION
      ====================================================== */}

      <ConfirmDialog
        open={!!pendingEdit}
        onOpenChange={(open) =>
          !open && setPendingEdit(null)
        }
        title="Save changes?"
        description={
          <>This will update receiving details</>
        }
        confirmLabel="Save changes"
        isLoading={isUpdating}
        loadingLabel="Saving..."
        onConfirm={confirmEditProduct}
      />

    </div>
  );
}

// ============================================================
// FIELD ERROR
// ============================================================

function FieldError({ message }) {
  if (!message) return null;

  return (
    <p className="text-xs text-red-600 mt-1">
      {message}
    </p>
  );
}

// ============================================================
// ITEM CODE COMBOBOX
// PAGINATION ONLY HERE
// ============================================================

function ItemCodeCombobox({
  index,
  selectField,
  setValue,
  watchedItems,
  errorMessage,
}) {
  const [open, setOpen] = useState(false);

  const [searchText, setSearchText] =
    useState("");

  const [debouncedSearchText, setDebouncedSearchText] =
    useState("");

  // ==========================================================
  // ITEM PAGINATION
  // ==========================================================

  const [itemPage, setItemPage] = useState(1);

  const ITEM_PER_PAGE = 25;

  // ==========================================================
  // SEARCH DEBOUNCE
  // ==========================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(
        searchText.trim(),
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  // ==========================================================
  // RESET ITEM PAGE WHEN SEARCH CHANGES
  // ==========================================================

  useEffect(() => {
    setItemPage(1);
  }, [debouncedSearchText]);

  // ==========================================================
  // FETCH PRODUCTS
  // ==========================================================

  const {
    data: productsData,
    isFetching,
  } = useProductsQuery(
    {
      status: "active",

      search:
        debouncedSearchText || undefined,

      page: itemPage,

      per_page: ITEM_PER_PAGE,
    },
    {
      skip: !open,
    },
  );

  // ==========================================================
  // EXTRACT PAGINATION RESPONSE
  // ==========================================================

  const productPagination =
    productsData?.data?.data
      ? productsData.data
      : productsData?.data;

  const products = Array.isArray(
    productPagination?.data,
  )
    ? productPagination.data
    : Array.isArray(productsData?.data)
      ? productsData.data
      : [];

  const itemCurrentPage =
    productPagination?.current_page ?? 1;

  const itemLastPage =
    productPagination?.last_page ?? 1;

  const itemTotal =
    productPagination?.total ?? 0;

  const itemPerPage =
    productPagination?.per_page ??
    ITEM_PER_PAGE;

  // ==========================================================
  // ITEM PAGE NAVIGATION
  // ==========================================================

  const goToItemPage = (nextPage) => {
    const safePage = Math.min(
      Math.max(nextPage, 1),
      itemLastPage,
    );

    setItemPage(safePage);
  };

  // ==========================================================
  // PAGE NUMBER GENERATOR
  // ==========================================================

  function getItemPageNumbers(current, last) {
    if (last <= 5) {
      return Array.from(
        { length: last },
        (_, i) => i + 1,
      );
    }

    if (current <= 3) {
      return [1, 2, 3, "...", last];
    }

    if (current >= last - 2) {
      return [
        1,
        "...",
        last - 2,
        last - 1,
        last,
      ];
    }

    return [
      1,
      "...",
      current,
      "...",
      last,
    ];
  }

  // ==========================================================
  // SELECTED ITEMS FROM OTHER ROWS
  // ==========================================================

  const selectedElsewhere = new Set(
    watchedItems
      .filter((_, i) => i !== index)
      .map((item) => item?.item_code)
      .filter(Boolean),
  );

  const currentDescription =
    watchedItems[index]?.item_description;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="w-full">

      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);

          if (nextOpen) {
            setItemPage(1);
          }
        }}
      >

        {/* ==================================================
            TRIGGER
        =================================================== */}

        <PopoverTrigger
          render={
            <Button
              id={`item_code_${index}`}
              type="button"
              variant="outline"
              role="combobox"
              className="w-full justify-between font-normal"
            >
              <span className="truncate">

                {selectField.value
                  ? `${selectField.value}${
                      currentDescription
                        ? ` — ${currentDescription}`
                        : ""
                    }`
                  : "Select item"}

              </span>

              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />

            </Button>
          }
        />

        {/* ==================================================
            POPOVER
        =================================================== */}

        <PopoverContent
          className="w-[--radix-popover-trigger-width] min-w-112.5 p-0"
          align="start"
        >

          <Command shouldFilter={false}>

            {/* SEARCH */}

            <CommandInput
              placeholder="Search item code or name..."
              value={searchText}
              onValueChange={setSearchText}
            />

            {/* ITEM LIST */}

            <CommandList className="max-h-64 overflow-y-auto">

              <CommandEmpty>
                {isFetching
                  ? "Searching..."
                  : "No items found."}
              </CommandEmpty>

              <CommandGroup>

                {products.map((p) => {
                  const isTaken =
                    selectedElsewhere.has(
                      p.item_code,
                    );

                  return (
                    <CommandItem
                      key={p.id}
                      value={p.item_code}
                      disabled={isTaken}
                      className={cn(
                        isTaken && "opacity-40",
                      )}
                      onSelect={() => {
                        if (isTaken) {
                          return;
                        }

                        selectField.onChange(
                          p.item_code,
                        );

                        setValue(
                          `receiving_items.${index}.item_description`,
                          p.item_description ??
                            "",
                          {
                            shouldValidate: true,
                          },
                        );

                        setValue(
                          `receiving_items.${index}.category`,
                          p.category ?? "",
                          {
                            shouldValidate: true,
                          },
                        );

                        setValue(
                          `receiving_items.${index}.unit_of_measurement`,
                          p.unit_of_measurement ??
                            "",
                          {
                            shouldValidate: true,
                          },
                        );

                        setOpen(false);
                      }}
                    >

                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",

                          p.item_code ===
                            selectField.value
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />

                      <span className="truncate">
                        {p.item_code} —{" "}
                        {p.item_description}
                      </span>

                      {isTaken && (
                        <span className="ml-auto text-xs text-zinc-400">
                          Already added
                        </span>
                      )}

                    </CommandItem>
                  );
                })}

              </CommandGroup>

            </CommandList>

          </Command>

          {/* =================================================
              ITEM PAGINATION
          ================================================= */}

          {!isFetching && itemLastPage > 1 && (
            <div className="border-t bg-zinc-50 px-3 py-2">

              <div className="flex items-center justify-between gap-3">

                {/* RESULTS */}

                <p className="whitespace-nowrap text-xs text-zinc-500">

                  Showing{" "}

                  <span className="font-medium text-zinc-700">
                    {(itemCurrentPage - 1) *
                      itemPerPage +
                      1}
                  </span>

                  {" "}to{" "}

                  <span className="font-medium text-zinc-700">
                    {Math.min(
                      itemCurrentPage *
                        itemPerPage,
                      itemTotal,
                    )}
                  </span>

                  {" "}of{" "}

                  <span className="font-medium text-zinc-700">
                    {itemTotal}
                  </span>

                  {" "}items

                </p>

                {/* PAGINATION */}

                <Pagination className="mx-0 w-auto">

                  <PaginationContent className="gap-1">

                    {/* PREVIOUS */}

                    <PaginationItem>

                      <PaginationPrevious
                        size="sm"
                        onClick={() =>
                          goToItemPage(
                            itemCurrentPage - 1,
                          )
                        }
                        className={cn(
                          "h-7 px-2",

                          itemCurrentPage === 1
                            ? "pointer-events-none opacity-40"
                            : "cursor-pointer",
                        )}
                      />

                    </PaginationItem>

                    {/* PAGE NUMBERS */}

                    {getItemPageNumbers(
                      itemCurrentPage,
                      itemLastPage,
                    ).map(
                      (pageNumber, pageIndex) =>
                        pageNumber === "..." ? (
                          <PaginationItem
                            key={`item-ellipsis-${pageIndex}`}
                          >
                            <PaginationEllipsis className="h-7 w-7" />
                          </PaginationItem>
                        ) : (
                          <PaginationItem
                            key={`item-page-${pageNumber}`}
                          >
                            <PaginationLink
                              size="sm"
                              isActive={
                                pageNumber ===
                                itemCurrentPage
                              }
                              onClick={() =>
                                goToItemPage(
                                  pageNumber,
                                )
                              }
                              className="h-7 w-7 cursor-pointer p-0"
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                    )}

                    {/* NEXT */}

                    <PaginationItem>

                      <PaginationNext
                        size="sm"
                        onClick={() =>
                          goToItemPage(
                            itemCurrentPage + 1,
                          )
                        }
                        className={cn(
                          "h-7 px-2",

                          itemCurrentPage ===
                            itemLastPage
                            ? "pointer-events-none opacity-40"
                            : "cursor-pointer",
                        )}
                      />

                    </PaginationItem>

                  </PaginationContent>

                </Pagination>

              </div>

            </div>
          )}

        </PopoverContent>

      </Popover>

      {/* ERROR */}

      <FieldError
        message={errorMessage}
      />

    </div>
  );
}

// ============================================================
// PRODUCT FORM
// ============================================================

function ProductFormFields({
  register,
  errors,
  control,
  setValue,
  fields = [],
  append,
  remove,
}) {
  const { data: SupplierData } =
    useSupplierQuery({
      status: "active",
      pagination: "none",
    });

  const watchedItems =
    useWatch({
      control,
      name: "receiving_items",
    }) ?? [];

  const suppliers =
    SupplierData?.data ?? [];

  return (
    <>

      {/* =====================================================
          RECEIVING HEADER
      ====================================================== */}

      <div className="flex flex-row gap-2">

        {/* RECEIVING DATE */}

        <div className="flex flex-col gap-2 flex-1">

          <Label htmlFor="receiving_date">
            Receiving Date
          </Label>

          <Controller
            name="receiving_date"
            control={control}
            rules={{
              required:
                "Receiving date is required.",
            }}
            render={({ field }) => (
              <Popover>

                <PopoverTrigger
                  render={
                    <Button
                      id="receiving_date"
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value &&
                          "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />

                      {field.value
                        ? format(
                            new Date(
                              field.value,
                            ),
                            "PPP",
                          )
                        : "Pick a date"}

                    </Button>
                  }
                />

                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                >

                  <Calendar
                    mode="single"
                    selected={
                      field.value
                        ? new Date(
                            field.value,
                          )
                        : undefined
                    }
                    onSelect={(date) =>
                      field.onChange(
                        date
                          ? format(
                              date,
                              "yyyy-MM-dd HH:mm:ss",
                            )
                          : "",
                      )
                    }
                    initialFocus
                  />

                </PopoverContent>

              </Popover>
            )}
          />

          <FieldError
            message={
              errors.receiving_date?.message
            }
          />

        </div>

        {/* SUPPLIER */}

        <div className="flex flex-col gap-2 flex-1">

          <Label htmlFor="supplier_name">
            Supplier
          </Label>

          <Controller
            name="supplier_name"
            control={control}
            rules={{
              required:
                "Supplier name is required.",
            }}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >

                <SelectTrigger
                  id="supplier_name"
                  className="w-full"
                >
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>

                <SelectContent>

                  {suppliers.map(
                    (supplier) => (
                      <SelectItem
                        key={supplier.id}
                        value={supplier.name}
                      >
                        {supplier.name}
                      </SelectItem>
                    ),
                  )}

                </SelectContent>

              </Select>
            )}
          />

          <FieldError
            message={
              errors.supplier_name?.message
            }
          />

        </div>

      </div>

      {/* =====================================================
          ITEMS
      ====================================================== */}

      <Card className="w-full p-4 flex flex-col gap-3 max-h-120 overflow-y-auto">

        {fields.map(
          (field, index) => (
            <div
              key={field.id}
              className="flex flex-row gap-2 w-full items-start border-b border-zinc-100 pb-3 last:border-b-0 last:pb-0"
            >

              {/* ITEM CODE */}

              <div className="flex flex-col gap-2 flex-1">

                <Label
                  htmlFor={`item_code_${index}`}
                >
                  Item code
                </Label>

                <Controller
                  name={`receiving_items.${index}.item_code`}
                  control={control}
                  rules={{
                    required:
                      "Item code is required.",
                  }}
                  render={({
                    field: selectField,
                  }) => (
                    <ItemCodeCombobox
                      index={index}
                      selectField={selectField}
                      setValue={setValue}
                      watchedItems={
                        watchedItems
                      }
                      errorMessage={
                        errors
                          .receiving_items?.[
                          index
                        ]?.item_code?.message
                      }
                    />
                  )}
                />

              </div>

              {/* DESCRIPTION */}

              <div className="flex flex-col gap-2 flex-1">

                <Label
                  htmlFor={`item_description_${index}`}
                >
                  Item description
                </Label>

                <Input
                  id={`item_description_${index}`}
                  disabled
                  placeholder="e.g. OISHI"
                  {...register(
                    `receiving_items.${index}.item_description`,
                    {
                      required:
                        "Item name is required.",
                    },
                  )}
                />

                <FieldError
                  message={
                    errors
                      .receiving_items?.[
                      index
                    ]?.item_description
                      ?.message
                  }
                />

              </div>

              {/* CATEGORY */}

              <div className="flex flex-col gap-2 flex-1">

                <Label
                  htmlFor={`category_${index}`}
                >
                  Category
                </Label>

                <Input
                  id={`category_${index}`}
                  disabled
                  placeholder="e.g. Foods, services"
                  {...register(
                    `receiving_items.${index}.category`,
                    {
                      required:
                        "Category is required.",
                    },
                  )}
                />

                <FieldError
                  message={
                    errors
                      .receiving_items?.[
                      index
                    ]?.category?.message
                  }
                />

              </div>

              {/* UOM */}

              <div className="flex flex-col gap-2 flex-1">

                <Label
                  htmlFor={`unit_of_measurement_${index}`}
                >
                  UOM
                </Label>

                <Input
                  id={`unit_of_measurement_${index}`}
                  disabled
                  placeholder="e.g. PC, BOX"
                  {...register(
                    `receiving_items.${index}.unit_of_measurement`,
                    {
                      required:
                        "UOM is required.",
                    },
                  )}
                />

                <FieldError
                  message={
                    errors
                      .receiving_items?.[
                      index
                    ]?.unit_of_measurement
                      ?.message
                  }
                />

              </div>

              {/* QUANTITY */}

              <div className="flex flex-col gap-2 w-28">

                <Label
                  htmlFor={`quantity_received_${index}`}
                >
                  Quantity
                </Label>

                <Input
                  id={`quantity_received_${index}`}
                  placeholder="e.g. 10"
                  type="number"
                  {...register(
                    `receiving_items.${index}.quantity_received`,
                    {
                      required:
                        "Quantity is required.",
                    },
                  )}
                />

                <FieldError
                  message={
                    errors
                      .receiving_items?.[
                      index
                    ]?.quantity_received
                      ?.message
                  }
                />

              </div>

              {/* REMOVE */}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={fields.length === 1}
                onClick={() => remove(index)}
                className="mt-5.5 text-zinc-400 hover:text-red-600 disabled:opacity-30"
                aria-label="Remove line"
              >
                <Trash2 />
              </Button>

            </div>
          ),
        )}

        {/* ADD LINE */}

        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            append({
              ...EMPTY_LINE_ITEM,
            })
          }
          className="self-start rounded-full bg-slate-200 px-5 text-slate-500 hover:bg-slate-300"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Line
        </Button>

      </Card>

    </>
  );
}

export default Receiving;