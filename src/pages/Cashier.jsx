import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Search as SearchIcon,
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  XCircleIcon,
  CheckCircle2Icon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import React, { useState, useEffect, useMemo, useRef } from "react";

import {
  usePosProductsQuery,
  useTransactionQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteRestoreTransactionMutation,
} from "../Api/store";

import ConfirmDialog from "../components/DialogBox/ConfirmDialog";

function makeLine(product) {
  return {
    item_code: product.item_code,
    item_description: product.item_description,
    category: product.category,
    unit_of_measurement: product.unit_of_measurement,
    price: Number(product.selling_price ?? 0),
    available_quantity: Number(product.available_quantity ?? 0),
    qty: 1,
  };
}
import { Alert, AlertDescription } from "@/components/ui/alert";

function peso(n) {
  return `₱${Number(n || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const PAGE_SIZE = 16;

function Cashier() {
  // ---------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // Empty string = no category filter = show everything
  const [category, setCategory] = useState("");

  // ---------------------------------------------------------
  // CART
  // ---------------------------------------------------------

  const [cart, setCart] = useState([]);

  const cartListRef = useRef(null);
  const prevCartLengthRef = useRef(0);

  // ---------------------------------------------------------
  // CASH TENDERED
  // ---------------------------------------------------------

  const [cashTendered, setCashTendered] = useState("");

  // ---------------------------------------------------------
  // ALERTS
  // ---------------------------------------------------------

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

  const notify = (severity, message) => {
    setAlertState({ isOpen: true, severity, message });
  };

  // ---------------------------------------------------------
  // PRODUCTS (server-side search + real pagination)
  // ---------------------------------------------------------

  const [page, setPage] = useState(1);

  // Reset to page 1 whenever search or category changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category]);

  const {
    data: productsData,
    isFetching: isProductsFetching,
    refetch: refetchProducts,
  } = usePosProductsQuery({
    status: "active",
    search: debouncedSearch || undefined,
    category: category || undefined,
    page,
    per_page: PAGE_SIZE,
  });

  // Defensive extraction — adjust once you confirm your API's real
  // response shape via console.log(productsData). Handles both
  // { data: [...], meta: { total, last_page } } and
  // { data: { data: [...], total, last_page } } (Laravel-style).
  const products = useMemo(() => {
    if (Array.isArray(productsData?.data)) return productsData.data;
    if (Array.isArray(productsData?.data?.data)) return productsData.data.data;
    return [];
  }, [productsData]);

  const totalCount =
    productsData?.meta?.total ?? productsData?.data?.total ?? products.length;

  const lastPage =
    productsData?.meta?.last_page ??
    productsData?.data?.last_page ??
    Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // ---------------------------------------------------------
  // CATEGORIES
  // ---------------------------------------------------------
  // NOTE: this still pulls all rows just to get distinct categories.
  // Swap for a dedicated lightweight endpoint (e.g. GET /products/categories)
  // once available — this is the one remaining heavy call.

  const { data: categoriesData, refetch: refetchCategories } =
    usePosProductsQuery({
      status: "active",
      pagination: "none",
      fields: "category",
    });

  const categories = useMemo(() => {
    const rows = Array.isArray(categoriesData?.data)
      ? categoriesData.data
      : Array.isArray(categoriesData?.data?.data)
        ? categoriesData.data.data
        : [];
    return Array.from(new Set(rows.map((p) => p.category).filter(Boolean)));
  }, [categoriesData]);

  // ---------------------------------------------------------
  // CART ACTIONS
  // ---------------------------------------------------------

  const addToCart = (product) => {
    const available = Number(product.available_quantity ?? 0);

    if (available <= 0) {
      notify("error", `${product.item_description} is out of stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (line) => line.item_code === product.item_code,
      );

      if (existing) {
        if (existing.qty >= existing.available_quantity) {
          notify(
            "error",
            `Only ${existing.available_quantity} ${existing.item_description} in stock.`,
          );
          return prev;
        }

        return prev.map((line) =>
          line.item_code === product.item_code
            ? {
                ...line,
                qty: line.qty + 1,
              }
            : line,
        );
      }

      return [...prev, makeLine(product)];
    });
  };

  const changeQty = (item_code, delta) => {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.item_code !== item_code) return line;

          const nextQty = line.qty + delta;

          if (delta > 0 && nextQty > line.available_quantity) {
            notify(
              "error",
              `Only ${line.available_quantity} ${line.item_description} in stock.`,
            );
            return line;
          }

          return {
            ...line,
            qty: nextQty,
          };
        })
        .filter((line) => line.qty > 0),
    );
  };

  const removeLine = (item_code) => {
    setCart((prev) => prev.filter((line) => line.item_code !== item_code));
  };

  const clearCart = () => {
    setCart([]);
    setCashTendered("");
  };

  // Auto-scroll cart to bottom whenever a new line item is added
  useEffect(() => {
    if (cart.length > prevCartLengthRef.current && cartListRef.current) {
      cartListRef.current.scrollTo({
        top: cartListRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    prevCartLengthRef.current = cart.length;
  }, [cart.length]);

  // ---------------------------------------------------------
  // TOTALS
  // ---------------------------------------------------------

  const total = cart.reduce((sum, line) => sum + line.price * line.qty, 0);

  const itemCount = cart.reduce((sum, line) => sum + line.qty, 0);

  const cashAmount = Number(cashTendered || 0);

  const change = cashAmount >= total ? cashAmount - total : 0;

  const insufficientCash = cashTendered !== "" && cashAmount < total;

  // Any line in the cart that (somehow) exceeds available stock —
  // e.g. stock dropped after the item was already added to the cart.
  const hasStockIssue = cart.some((line) => line.qty > line.available_quantity);

  // ---------------------------------------------------------
  // CASH INPUT
  // ---------------------------------------------------------

  const handleCashTendered = (e) => {
    const value = e.target.value;

    if (value === "") {
      setCashTendered("");
      return;
    }

    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setCashTendered(value);
    }
  };

  // ---------------------------------------------------------
  // CHARGE
  // ---------------------------------------------------------

  const [createTransaction, { isLoading: isCreating }] =
    useCreateTransactionMutation();

  const [pendingCharge, setPendingCharge] = useState(false);

  const stageCharge = () => {
    if (cart.length === 0) return;
    if (cashAmount < total) return;

    if (hasStockIssue) {
      notify(
        "error",
        "One or more items in the order exceed available stock. Please adjust quantities.",
      );
      return;
    }

    setPendingCharge(true);
  };

  const confirmCharge = async () => {
    const payload = {
      transaction_items: cart.map((item) => ({
        item_code: item.item_code.trim(),
        item_description: item.item_description.trim(),
        category: item.category.trim(),
        unit_of_measurement: item.unit_of_measurement.trim(),
        quantity: item.qty,
        selling_price: item.price,
      })),
      total,
    };

    try {
      await createTransaction(payload).unwrap();

      notify("success", "Successfully Paid");

      clearCart();

      // Refresh item list so available_quantity reflects this sale
      refetchProducts();
      refetchCategories();
    } catch (err) {
      const firstError = err?.data?.errors?.item_code;
      const message =
        firstError?.[0] ??
        firstError?.[1] ??
        "Something went wrong while processing this transaction.";

      notify("error", message);
    } finally {
      setPendingCharge(false);
    }
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="flex flex-col h-full p-6">
      {alertState.isOpen && (
        <div className="fixed top-4 right-4 w-full max-w-sm">
          <Alert
            className=" bg-sky-500"
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

      {/* =====================================================
          BODY
      ====================================================== */}

      <div className="flex gap-6 flex-1 min-h-0">
        {/* ===================================================
            ITEMS CARD
        ==================================================== */}

        <Card className="flex-1 min-w-0 flex flex-col p-0 overflow-hidden border-zinc-200">
          {/* ITEMS HEADER */}

          <div className="px-4 py-3 border-b border-zinc-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Items</h2>

                <p className="text-xs text-zinc-400">
                  Select an item to add it to the order
                </p>
              </div>

              <Badge variant="secondary" className="bg-zinc-100 text-zinc-600">
                {totalCount} items
              </Badge>
            </div>

            {/* SEARCH */}

            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />

              <Input
                id="search"
                placeholder="Search items or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-8"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center text-zinc-400 hover:text-zinc-600"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* CATEGORY FILTERS */}

          {categories.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 flex-wrap">
              {categories.map((c) => (
                <Button
                  key={c}
                  type="button"
                  size="sm"
                  variant={category === c ? "default" : "outline"}
                  className={
                    category === c ? "bg-sky-500 hover:bg-sky-600" : ""
                  }
                  onClick={() => setCategory((prev) => (prev === c ? "" : c))}
                >
                  {c}
                </Button>
              ))}
            </div>
          )}

          {/* ITEMS CONTENT */}

          <div className="flex-1 overflow-y-auto p-4 flex flex-col ">
            {isProductsFetching ? (
              <div className="flex items-center justify-center h-full text-sm text-zinc-500 ">
                Loading items...
              </div>
            ) : products.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-zinc-500 border border-dashed border-zinc-200 rounded-md">
                No items match your search.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 content-start ">
                {products.map((p) => {
                  const outOfStock = Number(p.available_quantity ?? 0) <= 0;

                  return (
                    <Card
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      aria-disabled={outOfStock}
                      onClick={() => addToCart(p)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addToCart(p);
                        }
                      }}
                      className={`p-3 border-zinc-200 transition-colors ${
                        outOfStock
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer hover:border-sky-400 hover:shadow-sm hover:bg-sky-400"
                      }`}
                    >
                      <p
                        className="text-sm font-medium text-zinc-900 truncate "
                        title={p.item_description}
                      >
                        {p.item_description}
                      </p>

                      <p className="text-xs text-zinc-400 mb-2">
                        {p.item_code}
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-zinc-100 text-zinc-600 hover:bg-zinc-100 truncate"
                        >
                          {p.category}
                        </Badge>

                        <span className="text-sm font-semibold text-sky-600 whitespace-nowrap">
                          {peso(p.selling_price)}
                        </span>
                      </div>

                      {p.available_quantity != null && (
                        <p
                          className={`text-[10px] mt-1 ${
                            outOfStock ? "text-red-500" : "text-zinc-400"
                          }`}
                        >
                          {outOfStock
                            ? "Out of stock"
                            : `${p.available_quantity} left`}
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* PAGINATION CONTROLS */}

          {lastPage > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || isProductsFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>

              <span className="text-xs text-zinc-500">
                Page {page} of {lastPage}
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= lastPage || isProductsFetching}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </Card>

        {/* ===================================================
            CURRENT ORDER CARD
        ==================================================== */}

        <Card className="w-105 shrink-0 flex flex-col p-0 overflow-hidden border-zinc-200">
          {/* ORDER HEADER */}

          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-zinc-500" />

              <div>
                <span className="text-sm font-semibold text-zinc-900">
                  Current Order
                </span>

                <p className="text-xs text-zinc-400">Review selected items</p>
              </div>
            </div>

            <Badge
              className="bg-sky-500/15 text-sky-600 hover:bg-sky-500/15"
              variant="secondary"
            >
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </Badge>
          </div>

          {/* ORDER ITEMS */}

          <div ref={cartListRef} className="flex-1 overflow-y-auto px-4 py-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <ShoppingCart className="h-8 w-8 text-zinc-300 mb-2" />

                <p className="text-sm text-zinc-500">No items in the order</p>

                <p className="text-xs text-zinc-400 mt-1">
                  Select an item from the Items section.
                </p>
              </div>
            ) : (
              cart.map((line) => {
                const atMax = line.qty >= line.available_quantity;
                const overStock = line.qty > line.available_quantity;

                return (
                  <div
                    key={line.item_code}
                    className="flex flex-col gap-1 py-3 border-b border-zinc-100 last:border-b-0"
                  >
                    {/* ITEM NAME + TOTAL */}

                    <div className="flex items-center justify-between gap-2">
                      <p
                        className="text-sm font-medium text-zinc-900 truncate"
                        title={line.item_description}
                      >
                        {line.item_description}
                      </p>

                      <span className="text-sm font-semibold text-zinc-900 whitespace-nowrap">
                        {peso(line.price * line.qty)}
                      </span>
                    </div>

                    {/* PRICE + QUANTITY */}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">
                        {peso(line.price)} each
                      </span>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => changeQty(line.item_code, -1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>

                        <span className="text-xs w-5 text-center">
                          {line.qty}
                        </span>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => changeQty(line.item_code, 1)}
                          disabled={atMax}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-zinc-400 hover:text-red-600"
                          onClick={() => removeLine(line.item_code)}
                          aria-label="Remove line"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {overStock && (
                      <p className="text-xs text-red-500">
                        Only {line.available_quantity} in stock — reduce
                        quantity to continue.
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* =================================================
              PAYMENT SUMMARY
          ================================================== */}

          <div className="px-4 py-3 border-t border-zinc-100">
            <div className="flex items-center justify-between text-base font-semibold text-zinc-900 pt-2 border-t border-zinc-100 mb-4">
              <span>Total</span>

              <span>{peso(total)}</span>
            </div>

            {/* CASH TENDERED */}

            <div className="space-y-2 mb-3">
              <label
                htmlFor="cash-tendered"
                className="text-sm font-medium text-zinc-700"
              >
                Cash Tendered
              </label>

              <div className="relative">
                <Banknote className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />

                <Input
                  id="cash-tendered"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={cashTendered}
                  onChange={handleCashTendered}
                  className="pl-9 text-right text-base font-medium"
                />
              </div>

              {insufficientCash && (
                <p className="text-xs text-red-500">
                  Cash tendered is less than the total.
                </p>
              )}
            </div>

            {/* CHANGE */}

            <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 mb-3">
              <span className="text-sm font-medium text-zinc-600">Change</span>

              <span
                className={`text-base font-bold ${
                  insufficientCash ? "text-red-500" : "text-zinc-900"
                }`}
              >
                {insufficientCash ? "₱0.00" : peso(change)}
              </span>
            </div>

            {/* CHARGE */}

            <Button
              type="button"
              disabled={
                cart.length === 0 || cashAmount < total || hasStockIssue
              }
              onClick={stageCharge}
              className="w-full bg-sky-500 hover:bg-sky-600"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Pay {peso(total)}
            </Button>

            {/* CLEAR ORDER */}

            {cart.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={clearCart}
                className="w-full mt-1 text-zinc-500"
              >
                Clear order
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* =====================================================
          PAYMENT CONFIRMATION DIALOG
      ====================================================== */}

      <ConfirmDialog
        open={pendingCharge}
        onOpenChange={(open) => !open && setPendingCharge(false)}
        title="Confirm payment?"
        description={
          <div className="flex flex-col pl-4">
            <p>
              Review the order below before charging{" "}
              <strong>{peso(total)}</strong>.
            </p>

            <div className="max-h-170 overflow-y-auto rounded-md border border-zinc-200 divide-y divide-zinc-100">
              {cart.map((line) => (
                <div
                  key={line.item_code}
                  className="flex items-center justify-between gap-2 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p
                      className="text-sm font-medium text-zinc-900 truncate"
                      title={line.item_description}
                    >
                      {line.item_description}
                    </p>
                    <p className="text-sm text-black">
                      {line.qty} × {peso(line.price)}
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-zinc-900 whitespace-nowrap">
                    {peso(line.price * line.qty)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-1 border-t border-zinc-100">
              <div className="flex items-center justify-between text-sm text-zinc-600">
                <span>
                  {itemCount} item{itemCount === 1 ? "" : "s"}
                </span>
                <span>{peso(total)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-zinc-600">
                <span>Cash tendered</span>
                <span>{peso(cashAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold text-zinc-900">
                <span>Change due</span>
                <span>{peso(change)}</span>
              </div>
            </div>
          </div>
        }
        confirmLabel="Confirm & Pay"
        isLoading={isCreating}
        loadingLabel="Processing..."
        variant="default"
        onConfirm={confirmCharge}
      />
    </div>
  );
}

export default Cashier;
