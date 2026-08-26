import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, X, RefreshCw } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import React, { useState, useEffect } from "react";

import { useMrpQuery } from "../Api/store";

function MrpDisplay() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Jump back to page 1 whenever the debounced search term changes —
  // otherwise you could be stuck on an empty page after narrowing results.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, isFetching, isError, error, refetch } = useMrpQuery({
    status: "active",
    page,
    per_page: 10,
    search: debouncedSearch || undefined,
  });

  // 👇 Pagination — adjust to match your actual response shape if it differs.
  const pagination = data?.data;
  const mrpItems = pagination?.data ?? [];
  const currentPage = pagination?.current_page ?? 1;
  const lastPage = pagination?.last_page ?? 1;
  const perPage = pagination?.per_page ?? 10;
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

  return (
    <div className="flex flex-col h-full p-6">
      {/* header starts here */}
      <div className="flex">
        <div className="flex flex-col mb-2">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            MRP Inventory
          </h1>
          <p className="text-sm text-zinc-500">
            Stock-on-hand across receipts, receiving, move orders, and issues.
          </p>
        </div>
        <div className="flex items-center space-x-2 ml-auto mb-2 mt-2 text-sm gap-2">
          <div className="relative flex items-center">
            <SearchIcon className="pointer-events-none absolute left-2.5 h-4 w-4 text-zinc-400" />
            <Input
              id="search"
              placeholder="Search item code or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-8 pr-8"
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
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* TABLE START HERE */}
      <div className="w-full rounded-lg border border-zinc-200">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="bg-sky-500 hover:bg-sky-500">
              <TableHead className="text-white">ITEM CODE</TableHead>
              <TableHead className="text-white">DESCRIPTION</TableHead>
              <TableHead className="text-white">CATEGORY</TableHead>
              <TableHead className="text-white text-center">UOM</TableHead>
              <TableHead className="text-white text-center">RECEIPT</TableHead>
              <TableHead className="text-white text-center">
                RECEIVING
              </TableHead>
              <TableHead className="text-white text-center">
                MOVE ORDER
              </TableHead>
              <TableHead className="text-white text-center">ISSUE</TableHead>
              <TableHead className="text-white text-center">SOH</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
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
                  colSpan={9}
                  className="py-16 text-center text-md text-black h-100"
                >
                  {error?.data?.errors?.[0]?.title ??
                    "Failed to load MRP inventory."}
                </TableCell>
              </TableRow>
            ) : mrpItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-sm text-zinc-500 py-6 h-100"
                >
                  No items found.
                </TableCell>
              </TableRow>
            ) : (
              mrpItems.map((item) => (
                <TableRow key={item.item_code}>
                  <TableCell
                    className="font-mono text-sm font-medium truncate"
                    title={item.item_code}
                  >
                    {item.item_code}
                  </TableCell>
                  <TableCell className="truncate" title={item.item_description}>
                    {item.item_description}
                  </TableCell>
                  <TableCell className="truncate" title={item.category}>
                    {item.category}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.unit_of_measurement}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.miscellaneous_receipt_quantity}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.receiving_quantity}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.move_order_quantity}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.miscellaneous_issue_quantity}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={
                        item.soh <= 0
                          ? "bg-red-500/15 text-red-600 hover:bg-red-500/15"
                          : "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15"
                      }
                      variant="secondary"
                    >
                      {item.soh}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* pagination starts here */}
      {!isError && (
        <div className="mt-auto flex items-center justify-between mb-12">
          <p className="text-sm text-zinc-500">
            Showing {total === 0 ? 0 : (currentPage - 1) * perPage + 1}–
            {Math.min(currentPage * perPage, total)} of {total}
          </p>

          <Pagination className="mx-0 w-auto pt-2">
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
    </div>
  );
}

export default MrpDisplay;
