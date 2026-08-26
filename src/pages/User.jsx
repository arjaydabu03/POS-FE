import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "@/components/ui/popover";

import {
  Plus,
  UserPen,
  Archive,
  ArchiveRestore,
  Hamburger,
  X,
  Eye,
  Search as SearchIcon,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import ReusableDialog from "../components/DialogBox/DialogBox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";

import ConfirmDialog from "../components/DialogBox/ConfirmDialog";
// NOTE: `useCreateUserMutation` / `useUpdateUserMutation` are assumed to live
// alongside `useUserQuery` in your Api/store slice, following the same
// RTK-Query-style pattern. Rename these imports to match whatever your
// store actually exports.
import {
  useUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteRestoreUserMutation,
} from "../Api/store";

const STATUS_STYLES = {
  Active: "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15",
  Inactive: "bg-zinc-500/15 text-zinc-600 hover:bg-zinc-500/15",
};

// NOTE: adjust to match the roles/groupings your backend actually returns.
// If roles are fetched dynamically, swap this for a query hook instead.
const PERMISSION_GROUPS = [
  {
    group: "Masterlist",
    options: [
      { id: 1, label: "dashboard" },
      { id: 2, label: "user" },
      { id: 5, label: "category" },
      { id: 6, label: "uom" },
      { id: 7, label: "supplier" },
      { id: 3, label: "products" },
    ],
  },
  {
    group: "Inventory",
    options: [
      { id: 4, label: "receiving" },
      { id: 8, label: "miscellaneous" },
      { id: 9, label: "miscellaneous issue" },
      { id: 10, label: "move order" },
      { id: 11, label: "inventory mrp" },
    ],
  },
  {
    group: "Cashier",
    options: [{ id: 12, label: "cashier" }],
  },
];

const EMPTY_FORM = {
  first_name: "",
  middle_name: "",
  last_name: "",
  address: "",
  contact_no: "",
  permission: [],
  username: "",
  password: "",
};

function getPageNumbers(current, last) {
  if (last <= 3) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }
  if (current === 1 || current === last) {
    return [1, "...", last];
  }
  return [1, "..", current, "...", last];
}

// Small helper so every field renders its error message the same way.
function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-600 mt-1">{message}</p>;
}

// Grouped checkbox list: permissions rendered under their group heading
// (e.g. Masterlist / Inventory), each with its own "select all in group"
// checkbox, plus one master "select all" spanning every group.
function PermissionCheckboxGroup({ value = [], onChange, groups }) {
  const allLabels = groups.flatMap((g) => g.options.map((o) => o.label));

  const toggleOption = (label, checked) => {
    if (checked) {
      if (value.includes(label)) return;
      onChange([...value, label]);
    } else {
      onChange(value.filter((v) => v !== label));
    }
  };

  const toggleAll = (checked) => {
    onChange(checked ? allLabels : []);
  };

  const allSelected = allLabels.every((l) => value.includes(l));
  const allPartial = !allSelected && allLabels.some((l) => value.includes(l));

  return (
    <div className="flex flex-col gap-4 rounded-md border border-zinc-200 p-4">
      {/* Just the master toggle */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
        <Checkbox
          id="permission-select-all"
          checked={allSelected ? true : allPartial ? "indeterminate" : false}
          onCheckedChange={(val) => toggleAll(!!val)}
        />
        <Label
          htmlFor="permission-select-all"
          className="text-sm font-semibold cursor-pointer"
        >
          Select all
        </Label>
      </div>

      {/* Options for each group, grouped under a plain label (no toggle) */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {groups.map(({ group, options }) => (
          <div key={group} className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {group}
            </span>
            {options.map((perm) => (
              <div key={perm.id} className="flex items-center gap-2">
                <Checkbox
                  id={`permission-${perm.id}`}
                  checked={value.includes(perm.label)}
                  onCheckedChange={(val) => toggleOption(perm.label, !!val)}
                />
                <Label
                  htmlFor={`permission-${perm.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {perm.label.toUpperCase()}
                </Label>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Shared field markup for both the Create and Edit dialogs, so the two
// forms can't drift out of sync. `isEdit` relaxes the password requirement
// (leave blank to keep the current password) and label wording.
function UserFormFields({ register, control, errors, isEdit = false }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="first_name">First name</Label>
        <Input
          id="first_name"
          placeholder="e.g. Juan"
          {...register("first_name", { required: "First name is required." })}
        />
        <FieldError message={errors.first_name?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="middle_name">Middle name</Label>
        <Input
          id="middle_name"
          placeholder="e.g. Letter (ABC) or complete (Di magiba)"
          {...register("middle_name", {
            required: "Middle name is required.",
          })}
        />
        <FieldError message={errors.middle_name?.message} />
      </div>
      <div className="flex flex-row gap-2">
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="last_name">Last name</Label>
          <Input
            id="last_name"
            placeholder="e.g. Dela Cruz"
            {...register("last_name", { required: "Last name is required." })}
          />
          <FieldError message={errors.last_name?.message} />
        </div>
        <div className="flex flex-col gap-2 ">
          <Label htmlFor="suffix">Suffix</Label>
          <Input
            id="suffix"
            placeholder="e.g. Jr, Sr, II"
            {...register("suffix")}
          />
          <FieldError message={errors.suffix?.message} />
        </div>
      </div>
      <div className="flex flex-row gap-2">
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="e.g. Brgy. Poblacion, San Fernando"
            {...register("address", { required: "Address is required." })}
          />
          <FieldError message={errors.address?.message} />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="contact_no">Mobile No.</Label>
          <Input
            id="contact_no"
            placeholder="09xxxxxxxxx"
            type="tel"
            inputMode="numeric"
            maxLength={11}
            {...register("contact_no", {
              required: "Mobile number is required.",
              pattern: {
                value: /^09\d{9}$/,
                message: "Enter a valid 11-digit mobile number.",
              },
              maxLength: {
                value: 11,
                message: "Mobile number must be 11 digits.",
              },
              onChange: (e) => {
                e.target.value = e.target.value.replace(/\D/g, "").slice(0, 11);
              },
            })}
          />
          <FieldError message={errors.contact_no?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Permission</Label>
        <Controller
          name="permission"
          control={control}
          rules={{
            validate: (value) =>
              (value && value.length > 0) || "Select at least one permission.",
          }}
          render={({ field }) => (
            <PermissionCheckboxGroup
              value={field.value}
              onChange={field.onChange}
              groups={PERMISSION_GROUPS}
            />
          )}
        />
        <FieldError message={errors.permission?.message} />
      </div>
      <div className="flex flex-row gap-2">
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="Username"
            autoComplete="off"
            {...register("username", { required: "Username is required." })}
          />
          <FieldError message={errors.username?.message} />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            placeholder="Password"
            type="password"
            {...register("password", { required: "Password is required." })}
          />
          <FieldError message={errors.password?.message} />
        </div>
      </div>
    </>
  );
}

function User() {
  const [archivedChecked, setArchivedChecked] = useState(false);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // ── Confirmation dialog state ───────────────────────────────
  // archiveTarget: the user row pending archive/restore confirmation
  const [archiveTarget, setArchiveTarget] = useState(null);
  // pendingEdit: the validated form values waiting on "Save changes?" confirmation
  const [pendingEdit, setPendingEdit] = useState(null);

  // ── Search ───────────────────────────────────────────────────
  // `search` updates on every keystroke (controls the input itself).
  // `debouncedSearch` only updates 400ms after typing stops — that's the
  // value that actually goes into useUserQuery's `search` param, so we
  // don't fire a request on every keystroke.
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

  const { data, isLoading, isError, error } = useUserQuery({
    status: archivedChecked ? "inactive" : "active",
    page,
    per_page: 10,
    search: debouncedSearch || undefined, // omit the param entirely when empty
  });

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteRestoreUser, { isLoading: isArchivingRestore }] =
    useDeleteRestoreUserMutation();

  // 👇 Pagination — adjust to match your actual response shape if it differs.
  const pagination = data?.data;
  const users = pagination?.data ?? [];
  const currentPage = pagination?.current_page ?? 1;
  const lastPage = pagination?.last_page ?? 1;
  const perPage = pagination?.per_page ?? 6;
  const total = pagination?.total ?? 0;

  const goTo = (p) => setPage(Math.min(Math.max(p, 1), lastPage));

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

  //----archive and restore
  const handleArchiveRestore = async (user) => {
    try {
      if (user.deleted_at === null) {
        await deleteRestoreUser(user.id).unwrap();
        setAlertState({
          isOpen: true,
          severity: "success",
          message: "Successfully archived",
        });
      } else {
        await deleteRestoreUser(user.id).unwrap();
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

  // Called from the confirm dialog's "Confirm" button.
  const confirmArchiveRestore = async () => {
    if (!archiveTarget) return;
    await handleArchiveRestore(archiveTarget);
    setArchiveTarget(null);
  };

  // ── Create form ──────────────────────────────────────────────
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

  const onCreateUser = async (values) => {
    try {
      await createUser({
        first_name: values.first_name.trim(),
        middle_name: values.middle_name.trim(),
        last_name: values.last_name.trim(),
        suffix: values.suffix.trim(),
        address: values.address.trim(),
        contact_no: values.contact_no.trim(),
        permission: values.permission,
        username: values.username.trim(),
        password: values.password,
      }).unwrap();
      setAlertState({
        isOpen: true,
        severity: "success",
        message: "Successfully created",
      });
      handleCreateOpenChange(false);
      setPage(1);
    } catch (err) {
      const firstError = err?.data?.errors?.[0];
      const message =
        firstError?.detail ??
        firstError?.title ??
        "Something went wrong while creating this user.";
      setCreateError("root", { message });
    }
  };

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

  const openEditDialog = (u) => {
    setEditingUser(u);
    resetEdit({
      first_name: u.first_name ?? "",
      middle_name: u.middle_name ?? "",
      last_name: u.last_name ?? "",
      suffix: u.suffix ?? "",
      address: u.address ?? "",
      contact_no: u.contact_no ?? "",
      permission: u.permission
        ? u.permission
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean)
        : [],
      username: u.username ?? "",
      password: "",
    });
    setEditOpen(true);
  };

  const handleEditOpenChange = (open) => {
    setEditOpen(open);
    if (!open) {
      setEditingUser(null);
      resetEdit(EMPTY_FORM);
    }
  };

  const onEditUser = async (values) => {
    try {
      const payload = {
        id: editingUser.id,
        first_name: values.first_name.trim(),
        middle_name: values.middle_name.trim(),
        last_name: values.last_name.trim(),
        suffix: values.suffix.trim(),
        address: values.address.trim(),
        contact_no: values.contact_no.trim(),
        permission: values.permission,
        username: values.username.trim(),
      };

      // Only send a password if the user actually typed a new one — trim
      // first so a stray space (or an autofilled/whitespace-only value)
      // doesn't get treated as an intentional password change.
      const trimmedPassword = values.password?.trim();
      if (trimmedPassword) {
        payload.password = trimmedPassword;
      }

      await updateUser(payload).unwrap();
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
        "Something went wrong while updating this user.";
      setEditError("root", { message });
    }
  };

  // react-hook-form validates first; only on success do we stage the values
  // and open the "Save changes?" confirmation dialog.
  const stageEditUser = (values) => {
    setPendingEdit(values);
  };

  // Called from the confirm dialog's "Confirm" button.
  const confirmEditUser = async () => {
    if (!pendingEdit) return;
    await onEditUser(pendingEdit);
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

      <div className="flex">
        <div className="flex flex-col mb-2">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 ">
            Users
          </h1>
          <p className="text-sm text-zinc-500">
            Manage who has access to this system.
          </p>
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

      <div className="rounded-md border border-zinc-200">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="bg-sky-500 hover:bg-sky-500 ">
              <TableHead className="text-white  text-center w-[5%]">
                ID
              </TableHead>
              <TableHead className="text-white">ACCOUNT NAME</TableHead>

              <TableHead className="text-white text-center">ADDRESS</TableHead>
              <TableHead className="text-white text-center ">
                CONTACT NO
              </TableHead>
              <TableHead className="text-white text-center">
                PERMISSION
              </TableHead>
              <TableHead className="text-center text-white">STATUS</TableHead>
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
                  {error?.data?.errors?.[0]?.title ?? "Failed to load users."}
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-sm text-zinc-500 py-6"
                >
                  {debouncedSearch
                    ? `No users match "${debouncedSearch}".`
                    : "No users found."}
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="truncate text-center" title={u.id}>
                    {u.id}
                  </TableCell>
                  <TableCell
                    className="font-medium truncate"
                    title={`${u.first_name} ${u.middle_name} ${u.last_name} ${u.suffix || ""}`}
                  >
                    {`${u.first_name} ${u.middle_name} ${u.last_name} ${u.suffix || ""}`}
                  </TableCell>

                  <TableCell className="truncate text-center" title={u.address}>
                    {u.address}
                  </TableCell>
                  <TableCell
                    className="text-center truncate"
                    title={u.contact_no}
                  >
                    {u.contact_no}
                  </TableCell>
                  <TableCell
                    className="truncate text-center"
                    title={u.permission}
                  >
                    <Popover>
                      <PopoverTrigger render={<Button variant="outline" />}>
                        <Eye />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto">
                        <div className=" grid grid-cols-1 gap-1">
                          {u.permission ? (
                            u.permission
                              .split(",")
                              .map((perm) => perm.trim().toUpperCase())
                              .sort((a, b) => a.localeCompare(b))
                              .map((perm) => <Badge key={perm}>{perm}</Badge>)
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No permissions
                            </span>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
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

      {/* create user dialog — react-hook-form + per-field helper text */}
      <ReusableDialog
        open={createOpen}
        onOpenChange={handleCreateOpenChange}
        title="Create user"
        description="Add a new account and grant it access to this system."
        onSubmit={handleCreateSubmit(onCreateUser)}
        confirmLabel="Create"
        isLoading={isCreating}
        error={createErrors.root?.message}
        size="xl"
      >
        <UserFormFields
          register={registerCreate}
          control={createControl}
          errors={createErrors}
        />
      </ReusableDialog>

      {/* edit user dialog — same fields, pre-filled, password optional.
          Submitting here only validates + stages values; the actual save
          happens after the "Save changes?" AlertDialog is confirmed. */}
      <ReusableDialog
        open={editOpen}
        onOpenChange={handleEditOpenChange}
        title="Edit user"
        description="Update this account's details."
        onSubmit={handleEditSubmit(stageEditUser)}
        confirmLabel="Save changes"
        isLoading={isUpdating}
        error={editErrors.root?.message}
        size="xl"
      >
        <UserFormFields
          register={registerEdit}
          control={editControl}
          errors={editErrors}
          isEdit
        />
      </ReusableDialog>

      {/* archive/restore confirmation */}
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
        description={<>This will update account details</>}
        confirmLabel="Save changes"
        isLoading={isUpdating}
        loadingLabel="Saving..."
        onConfirm={confirmEditUser}
      />
    </div>
  );
}

export default User;
