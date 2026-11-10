import {
  Award,
  BadgeDollarSign,
  Palette,
  BarChart3,
  CalendarCheck,
  CalendarRange,
  Crown,
  FileBarChart,
  LayoutDashboard,
  PlusSquare,
  Settings2,
  ShieldCheck,
  Store,
  Users,
  Wrench,
} from "lucide-react";

// `needs` is a key of the permissions object returned by /auth/me
export const NAV = [
  {
    group: "Workspace",
    items: [
      {
        href: "/dashboard",
        page: "overview",
        label: "Overview",
        icon: LayoutDashboard,
      },
      {
        href: "/leaderboard",
        page: "leaderboard",
        label: "Leaderboard",
        icon: Crown,
      },
      {
        href: "/performance",
        page: "performance",
        label: "Performance Reports",
        icon: BarChart3,
      },
      {
        href: "/sales-entry",
        page: "salesEntry",
        label: "Daily Sales Entry",
        icon: PlusSquare,
        needs: "canEnterSales",
      },
      {
        href: "/outlet-competition",
        page: "outletCompetition",
        label: "Outlet Competition",
        icon: Store,
      },
      {
        href: "/incentives",
        page: "incentives",
        label: "Incentives",
        icon: BadgeDollarSign,
      },
      {
        href: "/manager-incentive",
        page: "managerIncentive",
        label: "Manager Incentive",
        icon: Award,
        needs: "canViewManagerIncentive",
      },
      {
        href: "/employees",
        page: "employees",
        label: "Employees",
        icon: Users,
      },
      {
        href: "/attendance",
        page: "attendance",
        label: "Attendance",
        icon: CalendarCheck,
      },
    ],
  },
  {
    group: "Management",
    items: [
      {
        href: "/monthly-plan",
        page: "monthlyPlan",
        label: "Monthly Plan",
        icon: CalendarRange,
      },
      {
        href: "/policy",
        page: "policy",
        label: "Policy Settings",
        icon: Settings2,
      },
      {
        href: "/reports",
        page: "reports",
        label: "Reports & Export",
        icon: FileBarChart,
      },
      {
        href: "/admin-settings",
        page: "adminSettings",
        label: "Admin Settings",
        icon: Wrench,
        needs: "canManageOffDays",
      },
      {
        href: "/theme",
        page: "theme",
        label: "Theme & Colours",
        icon: Palette,
        needs: "canManageTheme",
      },
      {
        href: "/users",
        page: "users",
        label: "Users & Access",
        icon: ShieldCheck,
        needs: "canManageUsers",
      },
    ],
  },
];

export const TITLES = Object.fromEntries(
  NAV.flatMap((g) => g.items).map((i) => [i.href, i.label]),
);

/** Menu item for a path (longest match), e.g. /employees/bulk → Employees. */
export const itemForPath = (pathname) =>
  NAV.flatMap((g) => g.items)
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];

/** True when the account's role includes this item (its page is ticked and any extra permission is on). */
export const canOpenItem = (can, item) =>
  !item ||
  ((can.pages || []).includes(item.page) && (!item.needs || !!can[item.needs]));

export const firstAllowedHref = (can) =>
  NAV.flatMap((g) => g.items).find((i) => canOpenItem(can, i))?.href || null;
