// Pages and permissions a role can have. Keep in sync with backend/src/config/access.js.

export const PAGE_GROUPS = [
  {
    id: "view",
    title: "View pages",
    hint: "Dashboards and reports",
    pages: [
      { key: "overview", label: "Overview" },
      { key: "leaderboard", label: "Leaderboard" },
      { key: "performance", label: "Performance Reports" },
      { key: "outletCompetition", label: "Outlet Competition" },
      { key: "incentives", label: "Incentives" },
      {
        key: "managerIncentive",
        label: "Manager Incentive",
        note: "Confidential",
      },
      { key: "attendance", label: "Attendance" },
      { key: "reports", label: "Reports & Export" },
    ],
  },
  {
    id: "entry",
    title: "Data entry",
    hint: "Where daily numbers go in",
    pages: [
      {
        key: "salesEntry",
        label: "Daily Sales Entry",
        note: "Needs “enter sales”",
      },
    ],
  },
  {
    id: "setup",
    title: "Setup & administration",
    hint: "Configuration pages",
    pages: [
      { key: "employees", label: "Employees" },
      { key: "monthlyPlan", label: "Monthly Plan" },
      { key: "policy", label: "Policy Settings" },
      {
        key: "adminSettings",
        label: "Admin Settings",
        note: "Needs “manage setup”",
      },
      { key: "theme", label: "Theme & Colours", note: "Needs “manage setup”" },
    ],
  },
];

export const ALL_PAGES = PAGE_GROUPS.flatMap((g) => g.pages);
export const PAGE_LABEL = Object.fromEntries(
  ALL_PAGES.map((p) => [p.key, p.label]),
);

export const ACTIONS = [
  {
    key: "enterSales",
    title: "Enter & edit daily sales and attendance",
    help: "Save drafts, finalize a day and mark attendance in Daily Sales Entry.",
  },
  {
    key: "approveIncentives",
    title: "Approve & mark incentives paid",
    help: "Cannot create or edit sales unless the permission above is also on.",
  },
  {
    key: "manageSetup",
    title: "Manage setup",
    help: "Employees (including bulk add), targets, monthly plans, reward policies, outlets, off days, attendance rules and theme. Includes the two permissions above.",
  },
];

/** Applies the same dependencies as the server. Returns the cleaned access plus a note for each automatic change. */
export function normalizeAccess(a = {}) {
  const pages = new Set((a.pages || []).filter((p) => PAGE_LABEL[p]));
  let enterSales = !!a.enterSales;
  let approveIncentives = !!a.approveIncentives;
  let manageSetup = !!a.manageSetup;
  const notes = [];

  if ((pages.has("theme") || pages.has("adminSettings")) && !manageSetup) {
    manageSetup = true;
    notes.push(
      "Theme & Colours and Admin Settings need “Manage setup”, so it was turned on.",
    );
  }
  if (manageSetup && (!enterSales || !approveIncentives)) {
    enterSales = true;
    approveIncentives = true;
    notes.push(
      "“Manage setup” includes entering sales and approving incentives.",
    );
  }
  if (pages.has("salesEntry") && !enterSales) {
    enterSales = true;
    notes.push(
      "Daily Sales Entry needs “Enter & edit daily sales”, so it was turned on.",
    );
  }
  if (!enterSales) pages.delete("salesEntry");

  return {
    pages: ALL_PAGES.map((p) => p.key).filter((k) => pages.has(k)),
    enterSales,
    approveIncentives,
    manageSetup,
    notes,
  };
}

export const TEMPLATES = [
  {
    id: "viewer",
    name: "Read-only viewer",
    pages: [
      "overview",
      "leaderboard",
      "performance",
      "outletCompetition",
      "incentives",
      "attendance",
      "reports",
    ],
    enterSales: false,
    approveIncentives: false,
    manageSetup: false,
  },
  {
    id: "clerk",
    name: "Data entry clerk",
    pages: ["overview", "leaderboard", "salesEntry", "attendance"],
    enterSales: true,
    approveIncentives: false,
    manageSetup: false,
  },
  {
    id: "outlet",
    name: "Outlet manager",
    pages: [
      "overview",
      "leaderboard",
      "performance",
      "outletCompetition",
      "incentives",
      "attendance",
      "reports",
      "salesEntry",
    ],
    enterSales: true,
    approveIncentives: false,
    manageSetup: false,
  },
  {
    id: "finance",
    name: "Finance / approver",
    pages: ["overview", "incentives", "managerIncentive", "reports"],
    enterSales: false,
    approveIncentives: true,
    manageSetup: false,
  },
  {
    id: "setup",
    name: "Setup administrator",
    pages: ALL_PAGES.map((p) => p.key),
    enterSales: true,
    approveIncentives: true,
    manageSetup: true,
  },
];

/** Short description used on cards and in the live summary. */
export function summarizeAccess(a) {
  const flags = [];
  if (a.enterSales) flags.push("Enter sales");
  if (a.approveIncentives) flags.push("Approve incentives");
  if (a.manageSetup) flags.push("Manage setup");
  return {
    pageCount: (a.pages || []).length,
    flags,
    readOnly: flags.length === 0,
  };
}

/** Name shown for an account's role. */
export function roleLabel(user) {
  if (!user) return "";
  if (user.role === "admin") return "Admin";
  return user.customRole?.name || "Manager";
}
