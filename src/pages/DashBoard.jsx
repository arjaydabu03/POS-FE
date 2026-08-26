import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  ShoppingCart,
  Package,
  BarChart3,
  Search,
  Bell,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from "lucide-react";

const salesTrend = [
  { day: "Mon", total: 18420 },
  { day: "Tue", total: 21150 },
  { day: "Wed", total: 19860 },
  { day: "Thu", total: 24730 },
  { day: "Fri", total: 31200 },
  { day: "Sat", total: 38940 },
  { day: "Sun", total: 27310 },
];

const topProducts = [
  { name: "Colgate Toothpaste 150ml", sold: 214, revenue: 12840 },
  { name: "Nescafe 3-in-1 Sachet", sold: 198, revenue: 9900 },
  { name: "Lucky Me Pancit Canton", sold: 176, revenue: 7040 },
  { name: "Coca-Cola 1.5L", sold: 152, revenue: 11400 },
  { name: "Century Tuna 155g", sold: 140, revenue: 9800 },
];

const lowStock = [
  { name: "Palmolive Shampoo 340ml", sku: "PLM-340", qty: 4, reorder: 20 },
  { name: "Argentina Corned Beef 150g", sku: "ARG-150", qty: 7, reorder: 25 },
  { name: "Milo 3-in-1 Sachet", sku: "MLO-3N1", qty: 2, reorder: 30 },
  { name: "Safeguard Bar Soap", sku: "SFG-BAR", qty: 9, reorder: 20 },
];

const recentTransactions = [
  {
    id: "OR-10482",
    cashier: "J. Ramos",
    items: 6,
    total: 842,
    time: "2:14 PM",
  },
  {
    id: "OR-10481",
    cashier: "M. Dela Cruz",
    items: 3,
    total: 315,
    time: "2:09 PM",
  },
  {
    id: "OR-10480",
    cashier: "J. Ramos",
    items: 11,
    total: 1560,
    time: "1:58 PM",
  },
  {
    id: "OR-10479",
    cashier: "A. Santos",
    items: 2,
    total: 128,
    time: "1:47 PM",
  },
  {
    id: "OR-10478",
    cashier: "M. Dela Cruz",
    items: 5,
    total: 604,
    time: "1:32 PM",
  },
];

function peso(n) {
  return "\u20b1" + n.toLocaleString("en-PH");
}

function KpiCard({ label, value, delta, positive, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[#E4E2DA] bg-white p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-[#6B7075] uppercase">
          {label}
        </span>
        <Icon className="h-4 w-4 text-[#6B7075]" strokeWidth={1.75} />
      </div>
      <div className="text-2xl font-semibold text-[#1C2430] tabular-nums">
        {value}
      </div>
      <div
        className={
          "flex items-center gap-1 text-xs font-medium " +
          (positive ? "text-[#14603F]" : "text-[#B23A2E]")
        }
      >
        {positive ? (
          <ArrowUpRight className="h-3.5 w-3.5" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5" />
        )}
        {delta} vs yesterday
      </div>
    </div>
  );
}

export default function PosDashboard() {
  const [range, setRange] = useState("7D");
  const today = salesTrend[salesTrend.length - 1];
  const totalToday = today.total;

  return (
    <div className="flex flex-col min-h-screen w-full p-9">
      {/* Main */}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Today's sales"
          value={peso(totalToday)}
          delta="12.4%"
          positive
          icon={ShoppingCart}
        />
        <KpiCard
          label="Transactions"
          value="184"
          delta="4.1%"
          positive
          icon={BarChart3}
        />
        <KpiCard
          label="Avg. basket"
          value={peso(149)}
          delta="1.8%"
          positive={false}
          icon={Package}
        />
        <KpiCard
          label="Low stock items"
          value={lowStock.length.toString()}
          delta="2 new"
          positive={false}
          icon={AlertTriangle}
        />
      </div>

      {/* Ticket + chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 mb-6">
        {/* Signature: receipt ticket */}
        <div
          className="relative bg-white border border-[#E4E2DA] px-4 pt-4 pb-5 text-[#1C2430]"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            clipPath:
              "polygon(0 0,100% 0,100% 96%,92% 100%,84% 96%,76% 100%,68% 96%,60% 100%,52% 96%,44% 100%,36% 96%,28% 100%,20% 96%,12% 100%,4% 96%,0 100%)",
          }}
        >
          <p className="text-[10px] tracking-widest uppercase text-[#6B7075] mb-2">
            Today's ticket
          </p>
          <p className="text-2xl font-semibold tabular-nums leading-none mb-1">
            {peso(totalToday)}
          </p>
          <p className="text-[11px] text-[#6B7075] mb-4">
            gross, before returns
          </p>
          <div className="border-t border-dashed border-[#D8D6CC] pt-3 flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6B7075]">Items sold</span>
              <span className="tabular-nums">612</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7075]">Voided</span>
              <span className="tabular-nums">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7075]">Cashiers on shift</span>
              <span className="tabular-nums">3</span>
            </div>
          </div>
        </div>

        {/* Sales trend chart */}
        <div className="rounded-xl border border-[#E4E2DA] bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#1C2430]">
              Sales trend
            </span>
            <div className="flex gap-1">
              {["7D", "30D"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={
                    "text-xs px-2.5 py-1 rounded-md border " +
                    (range === r
                      ? "bg-[#1C2430] text-white border-[#1C2430]"
                      : "border-[#E4E2DA] text-[#6B7075]")
                  }
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart
              data={salesTrend}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14603F" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#14603F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#EDEBE3" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#6B7075" }}
              />
              <YAxis hide />
              <Tooltip
                formatter={(v) => [peso(v), "Sales"]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #E4E2DA",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#14603F"
                strokeWidth={2}
                fill="url(#salesFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Products + low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-[#E4E2DA] bg-white p-4">
          <span className="text-sm font-medium text-[#1C2430] mb-3 block">
            Top products today
          </span>
          <div className="flex flex-col">
            {topProducts.map((p, i) => (
              <div
                key={p.name}
                className={
                  "flex items-center justify-between py-2.5 text-sm " +
                  (i !== topProducts.length - 1
                    ? "border-b border-[#EDEBE3]"
                    : "")
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-[#B0AEA6] tabular-nums w-4">
                    {i + 1}
                  </span>
                  <span className="text-[#1C2430] truncate">{p.name}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-[#6B7075] tabular-nums">
                    {p.sold} sold
                  </span>
                  <span className="text-[#1C2430] font-medium tabular-nums w-16 text-right">
                    {peso(p.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#E4E2DA] bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle
              className="h-4 w-4 text-[#B67F13]"
              strokeWidth={1.75}
            />
            <span className="text-sm font-medium text-[#1C2430]">
              Low stock
            </span>
          </div>
          <div className="flex flex-col">
            {lowStock.map((item, i) => (
              <div
                key={item.sku}
                className={
                  "flex items-center justify-between py-2.5 text-sm " +
                  (i !== lowStock.length - 1 ? "border-b border-[#EDEBE3]" : "")
                }
              >
                <div className="min-w-0">
                  <p className="text-[#1C2430] truncate">{item.name}</p>
                  <p className="text-xs text-[#B0AEA6]">{item.sku}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-md bg-[#FBF0DC] text-[#8A5A0D] tabular-nums shrink-0">
                  {item.qty} left
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-xl border border-[#E4E2DA] bg-white p-4">
        <span className="text-sm font-medium text-[#1C2430] mb-3 block">
          Recent transactions
        </span>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#6B7075] uppercase tracking-wide">
              <th className="font-medium pb-2">Order</th>
              <th className="font-medium pb-2">Cashier</th>
              <th className="font-medium pb-2">Items</th>
              <th className="font-medium pb-2 text-right">Total</th>
              <th className="font-medium pb-2 text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.map((t, i) => (
              <tr
                key={t.id}
                className={
                  i !== recentTransactions.length - 1
                    ? "border-b border-[#EDEBE3]"
                    : ""
                }
              >
                <td className="py-2.5 text-[#1C2430] font-medium">{t.id}</td>
                <td className="py-2.5 text-[#6B7075]">{t.cashier}</td>
                <td className="py-2.5 text-[#6B7075] tabular-nums">
                  {t.items}
                </td>
                <td className="py-2.5 text-[#1C2430] text-right tabular-nums">
                  {peso(t.total)}
                </td>
                <td className="py-2.5 text-[#B0AEA6] text-right">{t.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
