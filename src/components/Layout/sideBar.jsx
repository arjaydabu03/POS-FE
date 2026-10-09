import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight,
  Menu,
  X,
  ShoppingBasket,
  FolderDown,
  ChartBarStacked,
  Container,
  ShoppingCart,
  Computer,
  FolderKanban,
  FolderUp,
  FolderCog,
  Scale,
  Coins,
} from "lucide-react";

// Static nav config: each section groups related links.
// `collapsible: true` sections render a toggle header (chevron rotates open/closed).
// `collapsible: false` sections (e.g. "workspace") always render fully expanded.
//
// `permission`: the tag from PERMISSION_OPTIONS (in User.jsx) required to
// see this item — "dashboard", "user", "products". Omit it on an item to
// always show it to any logged-in user regardless of their permissions.
const NAV_SECTIONS = [
  {
    id: "workspace", // stable key used for React list rendering + openSections tracking
    label: "workspace",
    collapsible: false,
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        badge: null,
        path: "/dashboard",
        permission: "dashboard",
      },
      {
        label: "Cashier",
        icon: Coins,
        badge: null,
        path: "/cashier",
        permission: "cashier",
      },
    ],
  },
  {
    id: "manage",
    label: "Manage",
    collapsible: true,
    items: [
      {
        label: "User",
        icon: Users,
        badge: null,
        path: "/user",
        permission: "user",
      },
      {
        label: "Products",
        icon: ShoppingBasket,
        badge: null,
        path: "/products",
        permission: "products",
      },
      {
        label: "Category",
        icon: ChartBarStacked,
        badge: null,
        path: "/category",
        permission: "category",
      },
      {
        label: "Uom",
        icon: Scale,
        badge: null,
        path: "/uom",
        permission: "uom",
      },
      {
        label: "Supplier",
        icon: Container,
        badge: null,
        path: "/supplier",
        permission: "supplier",
      },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    collapsible: true,
    items: [
      {
        label: "Receiving",
        icon: FolderDown,
        badge: null,
        path: "/receiving",
        permission: "receiving",
      },
      {
        label: "Miscellaneous Receipt",
        icon: FolderCog,
        badge: null,
        path: "/miscellaneous",
        permission: "miscellaneous",
      },
      {
        label: "Miscellaneous Issue",
        icon: FolderKanban,
        badge: null,
        path: "/miscellaneous_issue",
        permission: "miscellaneous issue",
      },
      {
        label: "Mover Order",
        icon: FolderUp,
        badge: null,
        path: "/move_order",
        permission: "move order",
      },
      {
        label: "Inventory MRP",
        icon: FolderKanban,
        badge: null,
        path: "/mrp",
        permission: "inventory mrp",
      },
    ],
  },
];

// Accepts either an array (["user","products"]) or a comma-separated
// string ("user, products") and returns a clean, trimmed array — same
// normalization used for the permission combobox in User.jsx, kept here
// too since the login response may return a slightly different shape.
function normalizePermissions(permission) {
  if (!permission) return [];
  if (Array.isArray(permission)) {
    return permission.map((p) => p.trim()).filter(Boolean);
  }
  return permission
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

// Reads the permission string from localStorage. The "user" key stores
// the raw permission list directly (e.g. "user, dashboard"), not a JSON
// user object — so this is a plain string read, not JSON.parse.
function getStoredPermissions() {
  return localStorage.getItem("user");
}

/**
 * Single nav link button. Renders differently depending on whether
 * the sidebar is collapsed (icon-only rail) or expanded (icon + label).
 */
function NavButton({ item, collapsed, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined} // tooltip only needed when label is hidden
      className={[
        "group relative flex w-full items-center rounded-md text-sm transition-colors",
        collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
        active
          ? "bg-sky-500 text-white" // highlighted state for the current route
          : "text-zinc-900 hover:bg-sky-500 hover:text-zinc-100",
      ].join(" ")}
    >
      <Icon size={17} strokeWidth={1.75} className="shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate text-md">
            {item.label}
          </span>
          {item.badge && (
            <span
              className={[
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none",
                // numeric badges (counts) get a neutral style; string badges (e.g. "New") get an accent style
                typeof item.badge === "number"
                  ? "bg-zinc-700 text-zinc-200"
                  : "bg-emerald-500/15 text-emerald-400",
              ].join(" ")}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
      {/* When collapsed, there's no room for a full badge pill — show a small dot indicator instead */}
      {collapsed && item.badge && (
        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
      )}
    </button>
  );
}

export default function Sidebar() {
  // Desktop icon-only rail toggle (persists until user clicks the collapse button)
  const [collapsed, setCollapsed] = useState(false);
  // Mobile slide-over drawer open/closed state
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // used to derive "active" state from the real URL

  // Reads directly from localStorage's "user" key (set at login,
  // alongside the auth token) — it holds the raw permission string.
  const userPermissions = normalizePermissions(getStoredPermissions());

  // Filter each section's items down to what this user can see, then drop
  // any section that ends up with zero visible items (e.g. "Manage" fully
  // disappears for a user with no "user" or "products" permission).
  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.permission || userPermissions.includes(item.permission),
    ),
  })).filter((section) => section.items.length > 0);

  // Tracks which collapsible section ids are currently expanded.
  // Initialized with every section id, so all sections start open.
  const [openSections, setOpenSections] = useState(
    () => new Set(NAV_SECTIONS.map((s) => s.id)),
  );

  // Adds/removes a section id from the open set — toggling that section's expand/collapse.
  const toggleSection = (id) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Shared sidebar body — reused for both the desktop rail and the mobile drawer,
  // so both stay visually/behaviorally in sync without duplicating markup.
  const Content = (
    <div className="flex h-full flex-col bg-stone-100 text-zinc-900">
      {/* Header: logo + brand name (hidden when collapsed), plus collapse/close controls */}
      <div
        className={[
          "flex items-center border-b border-stone-100 px-3 shadow-sm",
          collapsed ? "h-16 justify-center" : "h-16 justify-between",
        ].join(" ")}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-9 items-center justify-center rounded-md bg-sky-500 text-xs font-bold text-white">
              <ShoppingCart className="size-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Astrid Store
            </span>
          </div>
        )}
        {/* Desktop-only collapse toggle (rail <-> full width) */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden h-7 w-7 items-center justify-center rounded-md text-zinc-900 hover:bg-sky-500 hover:text-zinc-200 md:flex border"
        >
          {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
        </button>
        {/* Mobile-only close button for the drawer */}
        <button
          onClick={() => setMobileOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 md:hidden"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav: renders each visible section's label/toggle, then its filtered list of NavButtons */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {visibleSections.map((section) => {
          const isOpen = openSections.has(section.id);
          return (
            <div key={section.id}>
              {!collapsed ? (
                section.collapsible ? (
                  // Collapsible section: label doubles as a toggle button, chevron rotates to show state
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full items-center justify-between px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-600 hover:text-zinc-400"
                  >
                    <span>{section.label}</span>
                    <ChevronRight
                      size={12}
                      className={[
                        "transition-transform duration-200",
                        isOpen ? "rotate-90" : "rotate-0",
                      ].join(" ")}
                    />
                  </button>
                ) : (
                  // Non-collapsible section: plain static label, no interaction
                  <div className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
                    {section.label}
                  </div>
                )
              ) : (
                // Collapsed rail mode: no room for text labels, use a thin divider between sections instead
                <div className="mb-1.5 h-px bg-sky-500" />
              )}

              {/* Items wrapper: height-animates open/closed via max-h + opacity.
                  Always fully shown when: sidebar is collapsed, OR section isn't collapsible, OR it's toggled open. */}
              <div
                className={[
                  "space-y-0.5 overflow-hidden transition-all duration-200",
                  collapsed || !section.collapsible || isOpen
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0",
                ].join(" ")}
              >
                {section.items.map((item) => (
                  <NavButton
                    key={item.label}
                    item={item}
                    collapsed={collapsed}
                    active={location.pathname === item.path} // derives highlight from the real current route
                    onClick={() => {
                      navigate(item.path);
                      setMobileOpen(false); // auto-close the mobile drawer after navigating
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer: user/account entry point (currently routes to /dashboard — likely a placeholder,
          consider pointing this at an actual /settings or /profile route) */}
      <div className="border-t border-stone-100 p-3">
        {collapsed ? (
          <Computer className="size-4 items-center w-full" />
        ) : (
          <div className="min-w-0 flex-1">
            {/* ⚠️ empty — name text was removed/never filled in; renders as a blank line */}
            <div className="truncate text-xs font-medium leading-tight  text-zinc-500 text-center">
              All rights reserved @2026
            </div>
            <div className="truncate text-xs font-medium leading-tight  text-zinc-500 text-center">
              Version 1.0
            </div>
            <div className="truncate text-xs leading-tight text-zinc-500"></div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar: just a hamburger trigger, shown only below the md breakpoint */}
      <div className="flex h-16 items-center justify-between border-zinc-800 bg-zinc-900 px-3 text-zinc-100 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-800"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile overlay: dark backdrop (click to close) + sliding drawer containing the shared Content */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          {/* ⚠️ w-85 isn't a valid Tailwind class (85 isn't on the default spacing scale) — it's silently ignored.
              Use an arbitrary value like w-[85px] or w-[320px], or a scale value like w-80. */}
          <div className="relative z-50 h-full w-85">{Content}</div>
        </div>
      )}

      {/* Desktop sidebar: fixed rail below md, full-width sidebar above it; width animates between the two */}
      <div
        className={[
          "hidden md:flex h-full shrink-0 flex-col transition-all duration-400 shadow-lg",
          collapsed ? "w-14" : "w-60", // 56px collapsed vs 320px expanded
        ].join(" ")}
      >
        {Content}
      </div>
    </>
  );
}
