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
  CalendarIcon,
} from "lucide-react";

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

import { Textarea } from "@/components/ui/textarea";

import {
  useMiscellaneousQuery,
  useProductsQuery,
  useCreateMiscellaneousMutation,
  useUpdateMiscellaneousMutation,
  useDeleteRestoreMiscellaneousMutation,
} from "../Api/store";

import ReusableDialog from "../components/DialogBox/DialogBox";
import ConfirmDialog from "../components/DialogBox/ConfirmDialog";

import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";

import { Card } from "@/components/ui/card";

/* =========================================================
   CONSTANTS
========================================================= */

const TRANSACTION_TYPES = ["Purchase", "Return", "Adjustment"];

const EMPTY_LINE_ITEM = {
  item_code: "",
  item_description: "",
  category: "",
  unit_of_measurement: "",
  quantity: "",
};

const EMPTY_FORM = {
  transaction_date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
  transaction_type: "",
  remarks: "",
  misc_items: [EMPTY_LINE_ITEM],
};

/* =========================================================
   PAGINATION HELPER
========================================================= */

function getPageNumbers(currentPage, lastPage) {
  if (lastPage <= 1) {
    return [1];
  }

  if (lastPage <= 5) {
    return Array.from({ length: lastPage }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "...", lastPage];
  }

  if (currentPage >= lastPage - 2) {
    return [1, "...", lastPage - 2, lastPage - 1, lastPage];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    lastPage,
  ];
}

/* =========================================================
   FIELD ERROR
========================================================= */

function FieldError({ message }) {
  if (!message) return null;

  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

/* =========================================================
   ITEM CODE COMBOBOX
========================================================= */

function ItemCodeCombobox({
  index,
  fieldPrefix,
  selectField,
  setValue,
  watchedItems,
  errorMessage,
}) {
  const [open, setOpen] = useState(false);

  const [searchText, setSearchText] = useState("");

  const [debouncedSearchText, setDebouncedSearchText] = useState("");

  const [itemPage, setItemPage] = useState(1);

  const ITEM_PER_PAGE = 10;

  /* -------------------------------------------------------
     Debounce search
  ------------------------------------------------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText.trim());
      setItemPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  /* -------------------------------------------------------
     Reset page when popover opens
  ------------------------------------------------------- */

  useEffect(() => {
    if (open) {
      setItemPage(1);
    }
  }, [open]);

  /* -------------------------------------------------------
     Products query
  ------------------------------------------------------- */

  const { data: productsData, isFetching } = useProductsQuery(
    {
      status: "active",
      search: debouncedSearchText || undefined,

      page: itemPage,

      per_page: ITEM_PER_PAGE,
    },
    {
      skip: !open,
    },
  );

  /* -------------------------------------------------------
     Extract pagination response
  ------------------------------------------------------- */

  const productsPagination = productsData?.data;

  const products = Array.isArray(productsPagination?.data)
    ? productsPagination.data
    : Array.isArray(productsData?.data)
      ? productsData.data
      : [];

  const productCurrentPage = productsPagination?.current_page ?? itemPage;

  const productLastPage = productsPagination?.last_page ?? 1;

  const productTotal = productsPagination?.total ?? products.length;

  const productPerPage = productsPagination?.per_page ?? ITEM_PER_PAGE;

  /* -------------------------------------------------------
     Selected elsewhere
  ------------------------------------------------------- */

  const selectedElsewhere = new Set(
    watchedItems
      .filter((_, i) => i !== index)
      .map((item) => item?.item_code)
      .filter(Boolean),
  );

  const currentDescription = watchedItems[index]?.item_description;

  /* -------------------------------------------------------
     Pagination functions
  ------------------------------------------------------- */

  const goToItemPage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), productLastPage);

    setItemPage(nextPage);
  };

  return (
    <div className="flex flex-col">
      <Popover open={open} onOpenChange={setOpen}>
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
                      currentDescription ? ` — ${currentDescription}` : ""
                    }`
                  : "Select item"}
              </span>

              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          }
        />

        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search item code or name..."
              value={searchText}
              onValueChange={setSearchText}
            />

            <CommandList className="max-h-64 overflow-y-auto">
              {isFetching ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner className="size-6" />
                </div>
              ) : products.length === 0 ? (
                <CommandEmpty>
                  {searchText ? "No items found." : "No items available."}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {products.map((p) => {
                    const isTaken = selectedElsewhere.has(p.item_code);

                    return (
                      <CommandItem
                        key={p.id}
                        value={p.item_code}
                        disabled={isTaken}
                        className={cn(
                          isTaken && "cursor-not-allowed opacity-40",
                        )}
                        onSelect={() => {
                          if (isTaken) return;

                          selectField.onChange(p.item_code);

                          setValue(
                            `${fieldPrefix}.${index}.item_description`,
                            p.item_description ?? "",
                            {
                              shouldValidate: true,
                            },
                          );

                          setValue(
                            `${fieldPrefix}.${index}.category`,
                            p.category ?? "",
                            {
                              shouldValidate: true,
                            },
                          );

                          setValue(
                            `${fieldPrefix}.${index}.unit_of_measurement`,
                            p.unit_of_measurement ?? "",
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
                            p.item_code === selectField.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />

                        <span className="truncate">
                          {p.item_code}
                          {" — "}
                          {p.item_description}

                          {isTaken && " (already added)"}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>

          {/* =================================================
              ITEM PAGINATION
          ================================================= */}

          {!isFetching && productLastPage > 1 && (
            <div className="border-t bg-white px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-zinc-500 whitespace-nowrap">
                  {productTotal === 0
                    ? "0 items"
                    : `${Math.min(
                        (productCurrentPage - 1) * productPerPage + 1,
                        productTotal,
                      )}–${Math.min(
                        productCurrentPage * productPerPage,
                        productTotal,
                      )} of ${productTotal}`}
                </span>

                <Pagination className="mx-0 w-auto">
                  <PaginationContent className="gap-1">
                    <PaginationItem>
                      <PaginationPrevious
                        size="sm"
                        onClick={() => goToItemPage(productCurrentPage - 1)}
                        className={cn(
                          "h-7 px-2",
                          productCurrentPage === 1
                            ? "pointer-events-none opacity-40"
                            : "cursor-pointer",
                        )}
                      />
                    </PaginationItem>

                    {getPageNumbers(productCurrentPage, productLastPage).map(
                      (pageNumber, idx) =>
                        pageNumber === "..." ? (
                          <PaginationItem key={`item-ellipsis-${idx}`}>
                            <PaginationEllipsis className="h-7 w-7" />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={`item-page-${pageNumber}`}>
                            <PaginationLink
                              size="sm"
                              isActive={pageNumber === productCurrentPage}
                              onClick={() => goToItemPage(pageNumber)}
                              className="h-7 w-7 cursor-pointer p-0"
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                    )}

                    <PaginationItem>
                      <PaginationNext
                        size="sm"
                        onClick={() => goToItemPage(productCurrentPage + 1)}
                        className={cn(
                          "h-7 px-2",
                          productCurrentPage === productLastPage
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

      <FieldError message={errorMessage} />
    </div>
  );
}

/* =========================================================
   MISCELLANEOUS FORM
========================================================= */

function MiscellaneousFormFields({
  register,
  errors,
  control,
  setValue,
  fields = [],
  append,
  remove,
}) {
  const watchedItems =
    useWatch({
      control,
      name: "misc_items",
    }) ?? [];

  return (
    <>
      {/* TRANSACTION DETAILS */}

      <div className="flex flex-row gap-2">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="transaction_date">Transaction Date</Label>

          <Controller
            name="transaction_date"
            control={control}
            rules={{
              required: "Transaction date is required.",
            }}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      id="transaction_date"
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

          <FieldError message={errors.transaction_date?.message} />
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="transaction_type">Transaction Type</Label>

          <Controller
            name="transaction_type"
            control={control}
            rules={{
              required: "Transaction type is required.",
            }}
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

      {/* REMARKS */}

      <div className="mt-4 flex flex-col gap-2">
        <Label htmlFor="remarks">Remarks</Label>

        <Textarea
          id="remarks"
          placeholder="Optional notes about this transaction"
          {...register("remarks")}
        />

        <FieldError message={errors.remarks?.message} />
      </div>

      {/* ITEMS */}

      <Card className="mt-4 flex max-h-120 w-full flex-col gap-3 overflow-y-auto p-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex w-full flex-row items-start gap-2 border-b border-zinc-100 pb-3 last:border-b-0 last:pb-0"
          >
            {/* ITEM CODE */}

            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor={`item_code_${index}`}>Item Code</Label>

              <Controller
                name={`misc_items.${index}.item_code`}
                control={control}
                rules={{
                  required: "Item code is required.",
                }}
                render={({ field: selectField }) => (
                  <ItemCodeCombobox
                    index={index}
                    fieldPrefix="misc_items"
                    selectField={selectField}
                    setValue={setValue}
                    watchedItems={watchedItems}
                    errorMessage={
                      errors.misc_items?.[index]?.item_code?.message
                    }
                  />
                )}
              />
            </div>

            {/* DESCRIPTION */}

            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor={`item_description_${index}`}>
                Item Description
              </Label>

              <Input
                id={`item_description_${index}`}
                disabled
                placeholder="e.g. OISHI"
                {...register(`misc_items.${index}.item_description`, {
                  required: "Item name is required.",
                })}
              />

              <FieldError
                message={errors.misc_items?.[index]?.item_description?.message}
              />
            </div>

            {/* CATEGORY */}

            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor={`category_${index}`}>Category</Label>

              <Input
                id={`category_${index}`}
                disabled
                placeholder="e.g. Foods"
                {...register(`misc_items.${index}.category`, {
                  required: "Category is required.",
                })}
              />

              <FieldError
                message={errors.misc_items?.[index]?.category?.message}
              />
            </div>

            {/* UOM */}

            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor={`unit_of_measurement_${index}`}>UOM</Label>

              <Input
                id={`unit_of_measurement_${index}`}
                disabled
                placeholder="e.g. PC, BOX"
                {...register(`misc_items.${index}.unit_of_measurement`, {
                  required: "UOM is required.",
                })}
              />

              <FieldError
                message={
                  errors.misc_items?.[index]?.unit_of_measurement?.message
                }
              />
            </div>

            {/* QUANTITY */}

            <div className="flex w-28 flex-col gap-2">
              <Label htmlFor={`quantity_${index}`}>Quantity</Label>

              <Input
                id={`quantity_${index}`}
                placeholder="e.g. 10"
                type="number"
                min="1"
                {...register(`misc_items.${index}.quantity`, {
                  required: "Quantity is required.",
                })}
              />

              <FieldError
                message={errors.misc_items?.[index]?.quantity?.message}
              />
            </div>

            {/* DELETE */}

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
        ))}

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

/* =========================================================
   MAIN COMPONENT
========================================================= */

function Miscellaneous() {
  /* =======================================================
     MAIN TABLE STATE
  ======================================================= */

  const [archivedChecked, setArchivedChecked] = useState(false);

  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const PER_PAGE = 10;

  /* -------------------------------------------------------
     Search debounce
  ------------------------------------------------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /* -------------------------------------------------------
     Reset table page when search changes
  ------------------------------------------------------- */

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  /* =======================================================
     QUERY
  ======================================================= */

  const { data, isLoading, isError, error } = useMiscellaneousQuery({
    status: archivedChecked ? "inactive" : "active",

    page,

    per_page: PER_PAGE,

    search: debouncedSearch || undefined,
  });

  /* =======================================================
     TABLE DATA
  ======================================================= */

  const pagination = data?.data;

  const Miscellaneous = pagination?.data ?? [];

  const currentPage = pagination?.current_page ?? page;

  const lastPage = pagination?.last_page ?? 1;

  const perPage = pagination?.per_page ?? PER_PAGE;

  const total = pagination?.total ?? 0;

  /* =======================================================
     MAIN PAGINATION
  ======================================================= */

  const goTo = (targetPage) => {
    const nextPage = Math.min(Math.max(targetPage, 1), lastPage);

    setPage(nextPage);
  };

  /* =======================================================
     STATUS
  ======================================================= */

  const STATUS_STYLES = {
    Active: "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15",

    Inactive: "bg-zinc-500/15 text-zinc-600 hover:bg-zinc-500/15",
  };

  /* =======================================================
     CREATE
  ======================================================= */

  const [createMiscellaneous, { isLoading: isCreating }] =
    useCreateMiscellaneousMutation();

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
    name: "misc_items",
  });

  const handleCreateOpenChange = (open) => {
    setCreateOpen(open);

    if (!open) {
      resetCreate(EMPTY_FORM);
    }
  };

  const onCreateMiscellaneous = async (values) => {
    try {
      await createMiscellaneous({
        transaction_date: values.transaction_date.trim(),

        transaction_type: values.transaction_type.trim(),

        remarks: values.remarks.trim(),

        misc_items: values.misc_items.map((item) => ({
          item_code: item.item_code.trim(),

          item_description: item.item_description.trim(),

          category: item.category.trim(),

          unit_of_measurement: item.unit_of_measurement.trim(),

          quantity: item.quantity,
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
        "Something went wrong while creating this miscellaneous.";

      setCreateError("root", {
        message,
      });
    }
  };

  /* =======================================================
     UPDATE
  ======================================================= */

  const [updateMiscellaneous, { isLoading: isUpdating }] =
    useUpdateMiscellaneousMutation();

  const [editOpen, setEditOpen] = useState(false);

  const [editingMiscellaneous, setEditingMiscellaneous] = useState(null);

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
    name: "misc_items",
  });

  const openEditDialog = (p) => {
    setEditingMiscellaneous(p);

    resetEdit({
      transaction_date: p.transaction_date ?? "",

      transaction_type: p.transaction_type ?? "",

      remarks: p.remarks ?? "",

      misc_items: p.misc_items?.length
        ? p.misc_items.map((item) => ({
            id: item.id ?? "",

            item_code: item.item_code ?? "",

            item_description: item.item_description ?? "",

            category: item.category ?? "",

            unit_of_measurement: item.unit_of_measurement ?? "",

            quantity: item.quantity ?? "",
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
      setEditingMiscellaneous(null);

      resetEdit(EMPTY_FORM);
    }
  };

  const onEditMiscellaneous = async (values) => {
    try {
      const payload = {
        id: editingMiscellaneous.id,

        transaction_date: values.transaction_date.trim(),

        transaction_type: values.transaction_type.trim(),

        remarks: values.remarks.trim(),

        misc_items: values.misc_items.map((item) => ({
          id: item.id,

          item_code: item.item_code.trim(),

          item_description: item.item_description.trim(),

          category: item.category.trim(),

          unit_of_measurement: item.unit_of_measurement.trim(),

          quantity: item.quantity,
        })),
      };

      await updateMiscellaneous(payload).unwrap();

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
        "Something went wrong while updating this Miscellaneous.";

      setEditError("root", {
        message,
      });
    }
  };

  /* =======================================================
     ARCHIVE / RESTORE
  ======================================================= */

  const [deleteRestoreMiscellaneous, { isLoading: isArchivingRestore }] =
    useDeleteRestoreMiscellaneousMutation();

  const [archiveTarget, setArchiveTarget] = useState(null);

  const handleArchiveRestore = async (miscellaneous) => {
    try {
      await deleteRestoreMiscellaneous(miscellaneous.id).unwrap();

      setAlertState({
        isOpen: true,
        severity: "success",
        message:
          miscellaneous.deleted_at === null
            ? "Successfully archived"
            : "Successfully restored",
      });
    } catch (err) {
      setAlertState({
        isOpen: true,
        severity: "error",
        message: err?.data?.errors?.[0]?.detail ?? "Archive failed.",
      });
    }
  };

  const confirmArchiveRestore = async () => {
    if (!archiveTarget) return;

    await handleArchiveRestore(archiveTarget);

    setArchiveTarget(null);
  };

  /* =======================================================
     EDIT CONFIRMATION
  ======================================================= */

  const [pendingEdit, setPendingEdit] = useState(null);

  const stageEditMiscellaneous = (values) => {
    setPendingEdit(values);
  };

  const confirmEditMiscellaneous = async () => {
    if (!pendingEdit) return;

    await onEditMiscellaneous(pendingEdit);

    setPendingEdit(null);
  };

  /* =======================================================
     ALERT
  ======================================================= */

  const [alertState, setAlertState] = useState({
    isOpen: false,
    severity: "success",
    message: "",
  });

  useEffect(() => {
    if (!alertState.isOpen) return;

    const timer = setTimeout(() => {
      setAlertState((prev) => ({
        ...prev,
        isOpen: false,
      }));
    }, 3000);

    return () => clearTimeout(timer);
  }, [alertState.isOpen]);

  /* =======================================================
     VIEW
  ======================================================= */

  const [viewOpen, setViewOpen] = useState(false);

  const [viewingMiscellaneous, setViewingMiscellaneous] = useState(null);

  const openViewDialog = (p) => {
    setViewingMiscellaneous(p);
    setViewOpen(true);
  };

  const handleViewOpenChange = (open) => {
    setViewOpen(open);

    if (!open) {
      setViewingMiscellaneous(null);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex h-full flex-col p-6">
      {/* =================================================
          ALERT
      ================================================= */}

      {alertState.isOpen && (
        <div className="fixed right-4 top-4 z-50 w-full max-w-sm">
          <Alert
            className="bg-green-200"
            variant={
              alertState.severity === "error" ? "destructive" : "default"
            }
          >
            {alertState.severity === "error" ? (
              <XCircleIcon className="text-red-500" />
            ) : (
              <CheckCircle2Icon />
            )}

            <AlertDescription>{alertState.message}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-2 flex">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Miscellaneous
          </h1>

          <p className="text-sm text-zinc-500">Manage Miscellaneous.</p>
        </div>

        <div className="ml-auto mt-2 flex items-center gap-2 text-sm">
          {/* SEARCH */}

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
            onCheckedChange={(value) => {
              setArchivedChecked(value);
              setPage(1);
            }}
          />

          <Label htmlFor="archive-mode">Archive</Label>

          {/* CREATE */}

          <Button
            className="bg-sky-500 hover:bg-sky-900"
            onClick={() => setCreateOpen(true)}
          >
            <Plus />
            Create
          </Button>
        </div>
      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="w-full rounded-md border border-zinc-200">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="bg-sky-500 hover:bg-sky-500">
              <TableHead className="w-[10%] text-center text-white">
                ID
              </TableHead>

              <TableHead className="text-white">TRANSACTION DATE</TableHead>

              <TableHead className="text-white">TRANSACTION TYPE</TableHead>

              <TableHead className="text-center text-white">REMARKS</TableHead>

              <TableHead className="text-center text-white">
                NO OF ITEMS
              </TableHead>

              <TableHead className="text-center text-white">STATUS</TableHead>

              <TableHead className="text-center text-white">ACTION</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-100 py-16 text-center">
                  <Spinner className="mx-auto size-16" />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-100 py-16 text-center text-black"
                >
                  {error?.data?.errors?.[0]?.title ??
                    "Failed to load Miscellaneous."}
                </TableCell>
              </TableRow>
            ) : Miscellaneous.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-100 py-16 text-center text-sm text-zinc-500"
                >
                  No miscellaneous records found.
                </TableCell>
              </TableRow>
            ) : (
              Miscellaneous.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-center font-medium">
                    {p.id}
                  </TableCell>

                  <TableCell className="truncate font-medium">
                    {p.transaction_date}
                  </TableCell>

                  <TableCell className="truncate font-medium">
                    {p.transaction_type}
                  </TableCell>

                  <TableCell className="truncate text-center font-medium">
                    {p.remarks ?? "—"}
                  </TableCell>

                  <TableCell className="text-center font-medium">
                    {p.misc_items?.length ?? 0}
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className={
                        STATUS_STYLES[
                          p.deleted_at === null ? "Active" : "Inactive"
                        ]
                      }
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

                      <DropdownMenuContent className="w-32" align="start">
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

                        <DropdownMenuItem
                          onClick={(e) => {
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* =================================================
          MAIN TABLE PAGINATION
      ================================================= */}

      {!isError && (
        <div className="mt-auto mb-12 flex items-center justify-between">
          {/* RESULTS */}

          <p className="text-sm text-zinc-500">
            Showing{" "}
            <span className="font-medium text-zinc-700">
              {total === 0 ? 0 : (currentPage - 1) * perPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-zinc-700">
              {Math.min(currentPage * perPage, total)}
            </span>{" "}
            of <span className="font-medium text-zinc-700">{total}</span>{" "}
            results
          </p>

          {/* PAGINATION */}

          {lastPage > 1 && (
            <Pagination className="mx-0 w-auto pt-2">
              <PaginationContent>
                {/* PREVIOUS */}

                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => goTo(currentPage - 1)}
                    className={cn(
                      currentPage === 1
                        ? "pointer-events-none opacity-40"
                        : "cursor-pointer",
                    )}
                  />
                </PaginationItem>

                {/* PAGE NUMBERS */}

                {getPageNumbers(currentPage, lastPage).map(
                  (pageNumber, index) =>
                    pageNumber === "..." ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={`page-${pageNumber}`}>
                        <PaginationLink
                          isActive={pageNumber === currentPage}
                          onClick={() => goTo(pageNumber)}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                )}

                {/* NEXT */}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => goTo(currentPage + 1)}
                    className={cn(
                      currentPage === lastPage
                        ? "pointer-events-none opacity-40"
                        : "cursor-pointer",
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {/* =================================================
          CREATE DIALOG
      ================================================= */}

      <ReusableDialog
        open={createOpen}
        onOpenChange={handleCreateOpenChange}
        title="Create Miscellaneous"
        description="Add a new Miscellaneous."
        onSubmit={handleCreateSubmit(onCreateMiscellaneous)}
        confirmLabel="Create"
        isLoading={isCreating}
        error={createErrors.root?.message}
        size="6xl"
      >
        <MiscellaneousFormFields
          register={registerCreate}
          control={createControl}
          setValue={setValueCreate}
          errors={createErrors}
          fields={createFields}
          append={appendCreateLine}
          remove={removeCreateLine}
        />
      </ReusableDialog>

      {/* =================================================
          EDIT DIALOG
      ================================================= */}

      <ReusableDialog
        open={editOpen}
        onOpenChange={handleEditOpenChange}
        title="Edit Miscellaneous"
        description="Update this details."
        onSubmit={handleEditSubmit(stageEditMiscellaneous)}
        confirmLabel="Save changes"
        isLoading={isUpdating}
        error={editErrors.root?.message}
        size="6xl"
      >
        <MiscellaneousFormFields
          register={registerEdit}
          control={editControl}
          setValue={setValueEdit}
          errors={editErrors}
          fields={editFields}
          append={appendEditLine}
          remove={removeEditLine}
        />
      </ReusableDialog>

      {/* =================================================
          VIEW DIALOG
      ================================================= */}

      <ReusableDialog
        open={viewOpen}
        onOpenChange={handleViewOpenChange}
        title="Miscellaneous Details"
        description="Read-only view of this record."
        onSubmit={() => handleViewOpenChange(false)}
        confirmLabel="Close"
        size="6xl"
      >
        {viewingMiscellaneous && (
          <div className="flex flex-col gap-4">
            <Card className="w-full p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-zinc-500">
                    Transaction Date
                  </Label>

                  <p className="text-sm font-medium">
                    {viewingMiscellaneous.transaction_date}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-zinc-500">
                    Transaction Type
                  </Label>

                  <p className="text-sm font-medium">
                    {viewingMiscellaneous.transaction_type}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-zinc-500">Status</Label>

                  <Badge
                    variant="secondary"
                    className={
                      STATUS_STYLES[
                        viewingMiscellaneous.deleted_at === null
                          ? "Active"
                          : "Inactive"
                      ]
                    }
                  >
                    {viewingMiscellaneous.deleted_at === null
                      ? "Active"
                      : "Inactive"}
                  </Badge>
                </div>
              </div>

              {viewingMiscellaneous.remarks && (
                <div className="mt-4">
                  <Label className="text-xs text-zinc-500">Remarks</Label>

                  <p className="whitespace-pre-wrap text-sm font-medium">
                    {viewingMiscellaneous.remarks}
                  </p>
                </div>
              )}
            </Card>

            <Card className="w-full overflow-hidden p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-sky-500 hover:bg-sky-500">
                    <TableHead className="text-center text-white">
                      Item Code
                    </TableHead>

                    <TableHead className="text-center text-white">
                      Description
                    </TableHead>

                    <TableHead className="text-center text-white">
                      Category
                    </TableHead>

                    <TableHead className="text-center text-white">
                      UOM
                    </TableHead>

                    <TableHead className="text-center text-white">
                      Qty
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {viewingMiscellaneous.misc_items?.length ? (
                    viewingMiscellaneous.misc_items.map((item) => (
                      <TableRow key={item.id}>
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
                        colSpan={5}
                        className="py-6 text-center text-sm text-zinc-500"
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

      {/* =================================================
          ARCHIVE CONFIRMATION
      ================================================= */}

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title={
          archiveTarget?.deleted_at === null
            ? "Archive this record?"
            : "Restore this record?"
        }
        description={
          archiveTarget?.deleted_at === null
            ? "This record will be archived until restored."
            : "This record will be restored."
        }
        confirmLabel={
          archiveTarget?.deleted_at === null ? "Archive" : "Restore"
        }
        isLoading={isArchivingRestore}
        loadingLabel="Working..."
        variant={archiveTarget?.deleted_at === null ? "destructive" : "default"}
        onConfirm={confirmArchiveRestore}
      />

      {/* =================================================
          EDIT CONFIRMATION
      ================================================= */}

      <ConfirmDialog
        open={!!pendingEdit}
        onOpenChange={(open) => !open && setPendingEdit(null)}
        title="Save changes?"
        description="This will update miscellaneous details."
        confirmLabel="Save changes"
        isLoading={isUpdating}
        loadingLabel="Saving..."
        onConfirm={confirmEditMiscellaneous}
      />
    </div>
  );
}

export default Miscellaneous;
