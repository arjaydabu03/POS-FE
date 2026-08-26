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
  ChevronDown,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import {
  useProductsQuery,
  useCategoryQuery,
  useUomQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteRestoreProductMutation,
} from "../Api/store";
import ReusableDialog from "../components/DialogBox/DialogBox";
import ConfirmDialog from "../components/DialogBox/ConfirmDialog";
import { useForm, Controller, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";

// Shared helper — mark_up is a percentage of price.
function computeSellingPrice(price, markUp) {
  const p = Number(price) || 0;
  const m = Number(markUp) || 0;
  return p + p * (m / 100);
}

function Products() {
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

  const { data, isLoading, isError, error } = useProductsQuery({
    status: archivedChecked ? "inactive" : "active",
    page,
    per_page: 10,
    search: debouncedSearch || undefined,
  });

  // Separate, unpaginated fetch so the category/UOM comboboxes can offer
  // every existing value — not just the ones on the current page.
  const { data: categoryData, isFetching: isCategoryFetching } =
    useCategoryQuery({
      status: "active",
      pagination: "none",
    });

  const { data: uomData, isFetching: isUomFetching } = useUomQuery({
    status: "active",
    pagination: "none",
  });

  const allCategories = categoryData?.data ?? [];
  const allUoms = uomData?.data ?? [];

  const categoryOptions = useMemo(
    () => Array.from(new Set(allCategories.map((c) => c.name).filter(Boolean))),
    [allCategories],
  );

  const uomOptions = useMemo(
    () => Array.from(new Set(allUoms.map((u) => u.code).filter(Boolean))),
    [allUoms],
  );

  const STATUS_STYLES = {
    Active: "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15",
    Inactive: "bg-zinc-500/15 text-zinc-600 hover:bg-zinc-500/15",
  };

  //Create starts here
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const EMPTY_FORM = {
    item_code: "",
    item_description: "",
    category: "",
    unit_of_measurement: "",
    price: "",
    mark_up: "",
  };
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
  const handleCreateOpenChange = (open) => {
    setCreateOpen(open);
    if (!open) resetCreate(EMPTY_FORM);
  };

  const onCreateProduct = async (values) => {
    try {
      const sellingPrice = computeSellingPrice(values.price, values.mark_up);

      await createProduct({
        item_code: values.item_code.trim(),
        item_description: values.item_description.trim(),
        category: values.category.trim(),
        unit_of_measurement: values.unit_of_measurement.trim(),
        // price is a Number (set via the price Controller's field.onChange),
        // not a string — calling .trim() on it threw a TypeError before.
        price: values.price,
        mark_up: values.mark_up,
        selling_price: sellingPrice,
      }).unwrap();

      setAlertState({
        isOpen: true,
        severity: "success",
        message: "Successfully created",
      });

      handleCreateOpenChange(false);
      setPage(1);
    } catch (err) {
      console.log(err?.data?.errors?.item_code);
      const firstError = err?.data?.errors?.item_code;
      const message =
        firstError?.[0] ??
        firstError?.[1] ??
        "Something went wrong while creating this product.";
      setCreateError("root", { message });
    }
  };

  //----archive and restore
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

  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteRestoreProduct, { isLoading: isArchivingRestore }] =
    useDeleteRestoreProductMutation();
  // 👇 Pagination — adjust to match your actual response shape if it differs.
  const pagination = data?.data;
  const products = pagination?.data ?? [];
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
    // Was "..", which the renderer below doesn't treat as an ellipsis
    // (it only checks for "...") — that showed a literal ".." page button.
    return [1, "...", current, "...", last];
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
  const [editOpen, setEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const openEditDialog = (p) => {
    setEditingProduct(p);
    resetEdit({
      item_code: p.item_code ?? "",
      item_description: p.item_description ?? "",
      category: p.category ?? "",
      unit_of_measurement: p.unit_of_measurement ?? "",
      price: p.price ?? "",
      mark_up: p.mark_up ?? "",
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
      const sellingPrice = computeSellingPrice(values.price, values.mark_up);

      const payload = {
        id: editingProduct.id,
        item_code: values.item_code.trim(),
        item_description: values.item_description.trim(),
        category: values.category.trim(),
        unit_of_measurement: values.unit_of_measurement.trim(),
        price: values.price,
        mark_up: values.mark_up,
        selling_price: sellingPrice,
      };

      await updateProduct(payload).unwrap();
      setAlertState({
        isOpen: true,
        severity: "success",
        message: "Successfully Updated",
      });

      handleEditOpenChange(false);
    } catch (err) {
      const firstError = err?.data?.errors?.[0];
      const message =
        firstError?.detail ??
        firstError?.title ??
        "Something went wrong while updating this Product.";
      setEditError("root", { message });
    }
  };

  // react-hook-form validates first; only on success do we stage the values
  // and open the "Save changes?" confirmation dialog.
  const stageEditProduct = (values) => {
    setPendingEdit(values);
  };

  // Called from the confirm dialog's "Confirm" button.
  const confirmEditProduct = async () => {
    if (!pendingEdit) return;
    await onEditProduct(pendingEdit);
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
            Products
          </h1>
          <p className="text-sm text-zinc-500">Manage products.</p>
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
      <div className="rounded-md border border-zinc-200">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="bg-sky-500 hover:bg-sky-500 ">
              <TableHead className="text-white w-[5%] text-center">
                ID
              </TableHead>
              <TableHead className="text-white w-[10%]">ITEM CODE</TableHead>

              <TableHead className="text-white w-[16%] text-center">
                ITEM DESCRIPTION
              </TableHead>
              <TableHead className="text-white text-center w-[12%]">
                CATEGORY
              </TableHead>
              <TableHead className="text-white w-[10%] text-center">
                UOM
              </TableHead>
              <TableHead className="text-white w-[10%] text-center">
                PRICE
              </TableHead>
              <TableHead className="text-white w-[9%] text-center">
                MARK UP
              </TableHead>
              <TableHead className="text-white w-[11%] text-center">
                SELLING PRICE
              </TableHead>
              <TableHead className="text-center text-white w-[9%]">
                STATUS
              </TableHead>
              <TableHead className="text-center text-white w-[8%]">
                ACTION
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={10}
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
                  colSpan={10}
                  className="py-16 text-center text-md text-black h-100"
                >
                  {error?.data?.errors?.[0]?.title ??
                    "Failed to load products."}
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center text-sm text-zinc-500 py-6"
                >
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => {
                const sellingPrice =
                  p.selling_price ?? computeSellingPrice(p.price, p.mark_up);
                return (
                  <TableRow key={p.id}>
                    <TableCell
                      className="font-medium truncate text-center"
                      title={p.id}
                    >
                      {p.id}
                    </TableCell>
                    <TableCell
                      className="font-medium truncate"
                      title={p.item_code}
                    >
                      {p.item_code}
                    </TableCell>

                    <TableCell
                      className="truncate text-center"
                      title={p.item_description}
                    >
                      {p.item_description}
                    </TableCell>
                    <TableCell
                      className="text-center truncate"
                      title={p.category}
                    >
                      {p.category}
                    </TableCell>
                    <TableCell
                      className="truncate text-center"
                      title={p.unit_of_measurement}
                    >
                      {p.unit_of_measurement}
                    </TableCell>
                    <TableCell className="truncate text-center" title={p.price}>
                      ₱{p.price}
                    </TableCell>
                    <TableCell
                      className="truncate text-center"
                      title={p.mark_up}
                    >
                      {p.mark_up}%
                    </TableCell>
                    <TableCell
                      className="truncate text-center"
                      title={sellingPrice}
                    >
                      ₱{p.selling_price}
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
                );
              })
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
        title="Create products"
        description="Add a new product."
        onSubmit={handleCreateSubmit(onCreateProduct)}
        confirmLabel="Create"
        isLoading={isCreating}
        error={createErrors.root?.message}
        size="xl"
      >
        <ProductFormFields
          register={registerCreate}
          control={createControl}
          setValue={setValueCreate}
          errors={createErrors}
          categoryOptions={categoryOptions}
          uomOptions={uomOptions}
        />
      </ReusableDialog>

      {/* edit dialog starts here */}
      <ReusableDialog
        open={editOpen}
        onOpenChange={handleEditOpenChange}
        title="Edit product"
        description="Update this product's details."
        onSubmit={handleEditSubmit(stageEditProduct)}
        confirmLabel="Save changes"
        isLoading={isUpdating}
        error={editErrors.root?.message}
        size="xl"
      >
        <ProductFormFields
          register={registerEdit}
          control={editControl}
          setValue={setValueEdit}
          errors={editErrors}
          categoryOptions={categoryOptions}
          uomOptions={uomOptions}
          isEdit
        />
      </ReusableDialog>

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title={
          archiveTarget?.deleted_at === null
            ? "Archive this product?"
            : "Restore this product?"
        }
        description={
          archiveTarget?.deleted_at === null
            ? `This product will lose access until restored.`
            : `This product will regain access to the system.`
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
        description={<>This will update account details</>}
        confirmLabel="Save changes"
        isLoading={isUpdating}
        loadingLabel="Saving..."
        onConfirm={confirmEditProduct}
      />
    </div>
  );
}

//forms
function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-600 mt-1">{message}</p>;
}

// Searchable combobox for a react-hook-form field, with support for typing
// a brand-new value that isn't in `options` yet (e.g. a new category).
function ComboboxField({
  id,
  label,
  placeholder,
  control,
  name,
  setValue,
  options,
  rules,
  error,
  isOpen,
  onOpenChange,
}) {
  // Search text is separate from the form value — so opening the combobox
  // (e.g. in edit mode) doesn't pre-filter the list down to just the
  // currently selected value.
  const [query, setQuery] = useState("");

  return (
    <div className="flex flex-col gap-2 w-full">
      <Label htmlFor={id}>{label}</Label>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => (
          <Popover
            open={isOpen}
            onOpenChange={(open) => {
              // Reset the search box every time it opens (or closes) so it
              // never shows a stale/prefilled value — applies to both
              // create and edit.
              setQuery("");
              onOpenChange(open);
            }}
          >
            <PopoverTrigger
              render={
                <Button
                  id={id}
                  type="button"
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">{field.value || placeholder}</span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              }
            />
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput
                  placeholder={`Search or type new ${label.toLowerCase()}...`}
                  value={query}
                  onValueChange={setQuery}
                />
                <CommandList className="max-h-60 overflow-y-auto">
                  <CommandEmpty className="px-2 py-3 text-sm text-zinc-500">
                    {query ? (
                      <button
                        type="button"
                        className="w-full text-left hover:text-zinc-900"
                        onClick={() => {
                          field.onChange(query);
                          setValue(name, query, { shouldValidate: true });
                          onOpenChange(false);
                        }}
                      >
                        No match — use "{query}"
                      </button>
                    ) : (
                      "No options yet."
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {options.map((opt) => (
                      <CommandItem
                        key={opt}
                        value={opt}
                        onSelect={() => {
                          field.onChange(opt);
                          setValue(name, opt, { shouldValidate: true });
                          onOpenChange(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            opt === field.value ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {opt}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      />
      <FieldError message={error} />
    </div>
  );
}

// Read-only field that mirrors price + mark_up in real time. Grayed out
// because it's derived, not user-editable — the source of truth is
// price and mark_up.
function SellingPriceField({ control }) {
  const price = useWatch({ control, name: "price" });
  const markUp = useWatch({ control, name: "mark_up" });

  const sellingPrice = useMemo(
    () => computeSellingPrice(price, markUp),
    [price, markUp],
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      <Label htmlFor="selling_price">Selling price</Label>
      <Input
        id="selling_price"
        value={sellingPrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
        disabled
        readOnly
        className="bg-zinc-100 text-zinc-400 cursor-not-allowed"
      />
    </div>
  );
}

function ProductFormFields({
  register,
  errors,
  control,
  setValue,
  categoryOptions = [],
  uomOptions = [],
}) {
  // Tracks which of this form's two comboboxes is open ("category" |
  // "unit_of_measurement" | null) so selecting an option can close it.
  const [openField, setOpenField] = useState(null);
  const [priceDisplay, setPriceDisplay] = useState("");
  const [priceFocused, setPriceFocused] = useState(false);
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="item_code">Item code</Label>
        <Input
          id="item_code"
          placeholder="e.g. 001"
          {...register("item_code", { required: "Item code is required." })}
        />
        <FieldError message={errors.item_code?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="item_description">Item description</Label>
        <Input
          id="item_description"
          placeholder="e.g. OISHI"
          {...register("item_description", {
            required: "Item description is required.",
          })}
        />
        <FieldError message={errors.item_description?.message} />
      </div>

      <div className="flex flex-row gap-2">
        <ComboboxField
          id="category"
          label="Category"
          placeholder="e.g. Foods, services"
          control={control}
          name="category"
          setValue={setValue}
          options={categoryOptions}
          rules={{ required: "Category is required." }}
          error={errors.category?.message}
          isOpen={openField === "category"}
          onOpenChange={(open) => setOpenField(open ? "category" : null)}
        />
        <ComboboxField
          id="unit_of_measurement"
          label="Unit of Measurement"
          placeholder="e.g. PC, BOX"
          control={control}
          name="unit_of_measurement"
          setValue={setValue}
          options={uomOptions}
          rules={{ required: "Unit of measurement is required." }}
          error={errors.unit_of_measurement?.message}
          isOpen={openField === "unit_of_measurement"}
          onOpenChange={(open) =>
            setOpenField(open ? "unit_of_measurement" : null)
          }
        />
      </div>

      <div className="flex flex-row gap-2">
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="price">Price</Label>
          <Controller
            name="price"
            control={control}
            rules={{
              required: "Price is required.",
              validate: (value) =>
                value === undefined ||
                value >= 0 ||
                "Price cannot be negative.",
            }}
            render={({ field }) => {
              const displayValue = priceFocused
                ? priceDisplay
                : field.value !== undefined && field.value !== null
                  ? field.value.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })
                  : "";

              return (
                <Input
                  id="price"
                  placeholder="e.g. 10,000.50"
                  inputMode="decimal"
                  value={displayValue}
                  onFocus={() => {
                    setPriceFocused(true);
                    // seed the editable buffer with the raw (unformatted) value
                    setPriceDisplay(
                      field.value !== undefined && field.value !== null
                        ? String(field.value)
                        : "",
                    );
                  }}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, "");
                    if (!/^\d*\.?\d*$/.test(raw)) return;
                    setPriceDisplay(raw);
                    field.onChange(raw === "" ? undefined : Number(raw));
                  }}
                  onBlur={() => {
                    field.onBlur();
                    setPriceFocused(false);
                  }}
                />
              );
            }}
          />
          <FieldError message={errors.price?.message} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="mark_up">Mark up (%)</Label>
          <Input
            id="mark_up"
            placeholder="e.g. 20"
            inputMode="decimal"
            {...register("mark_up", {
              required: "Mark up is required.",
              validate: (value) =>
                value === "" ||
                value === undefined ||
                Number(value) >= 0 ||
                "Mark up cannot be negative.",
            })}
          />
          <FieldError message={errors.mark_up?.message} />
        </div>

        <SellingPriceField control={control} />
      </div>
    </>
  );
}

export default Products;
