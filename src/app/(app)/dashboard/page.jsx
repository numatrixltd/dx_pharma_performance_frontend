"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Plus } from "lucide-react";
import clsx from "clsx";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { downloadFile } from "@/lib/api";
import {
  defaultReportDate,
  monthStart,
  shiftDate,
  todayISO,
  weekStart,
} from "@/lib/dates";
import { greeting } from "@/lib/format";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import DailyView from "@/components/overview/DailyView";
import PeriodView from "@/components/overview/PeriodView";
import InsightsView from "@/components/overview/InsightsView";

const TABS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "insights", label: "Insights & what-if" },
];
const HINT = {
  daily:
    "Reporting date · finalized records · click an outlet bar or a person to drill in",
  weekly:
    "Week to the selected date · finalized records · click an outlet or a person to drill in",
  monthly:
    "Month to the selected date · finalized records · click an outlet or a person to drill in",
  insights: "Month projection · select any outlet to drill down",
};

export default function OverviewPage() {
  const { user, can } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState("daily");
  const [outlet, setOutlet] = useState("All");
  const [date, setDate] = useState(defaultReportDate());
  const outlets = useApi("/outlets");
  const pills = [
    { value: "All", label: "All outlets" },
    ...(outlets.data || [])
      .filter((o) => o.isActive)
      .map((o) => ({ value: o._id, label: o.name })),
  ];
  const scope =
    pills.find((p) => p.value === outlet)?.label === "All outlets"
      ? "DX Pharma"
      : pills.find((p) => p.value === outlet)?.label;
  const yesterday = defaultReportDate();
  const today = todayISO();

  const exportReport = () =>
    downloadFile("/reports/export/daily", { date, outlet }).catch((e) =>
      toast.error(e.message),
    );
  const step = (n) => {
    const next = shiftDate(date, n);
    if (next <= today) setDate(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Performance command center
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {greeting()}, {user?.name?.split(" ")[0]}{" "}
            {/* <span className="text-brand-400">✦</span> */}
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            One team. Every outlet. Every sale moves the leaderboard.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={exportReport}>
            <Download size={15} /> Export report
          </Button>
          {can.canEnterSales && (
            <Link href="/sales-entry">
              <Button variant="primary">
                <Plus size={15} /> Enter daily sales
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Outlet">
        {pills.map((p) => (
          <button
            key={p.value}
            type="button"
            role="tab"
            aria-selected={outlet === p.value}
            onClick={() => setOutlet(p.value)}
            className={clsx(
              "rounded-full border px-4 py-1.5 text-xs font-semibold transition",
              outlet === p.value
                ? "border-brand-400 bg-brand-500/15 text-brand-300"
                : "border-ink-600 text-slate-300 hover:border-brand-500/50",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="icon" onClick={() => step(-1)} aria-label="Previous day">
          <ChevronLeft size={16} />
        </Button>
        <Input
          type="date"
          value={date}
          max={today}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="!w-auto"
          aria-label="Reporting date"
        />
        <Button
          size="icon"
          onClick={() => step(1)}
          disabled={date >= today}
          aria-label="Next day"
        >
          <ChevronRight size={16} />
        </Button>
        <Button
          onClick={() => setDate(yesterday)}
          disabled={date === yesterday}
        >
          Yesterday
        </Button>
        <span className="text-xs text-slate-500 lg:ml-auto">{HINT[tab]}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-ink-600 bg-ink-900/70 p-1"
          role="tablist"
          aria-label="View"
        >
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={clsx(
                "whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-semibold transition",
                tab === t.value
                  ? "bg-ink-700 text-white shadow-sm"
                  : "text-slate-400 hover:text-white",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 lg:ml-auto">
          CEO view · finalized sales only · select any outlet to drill down
        </span>
      </div>

      {tab === "daily" && (
        <DailyView date={date} outlet={outlet} scope={scope} />
      )}
      {tab === "weekly" && (
        <PeriodView
          start={weekStart(date)}
          end={date}
          outlet={outlet}
          label="Weekly"
        />
      )}
      {tab === "monthly" && (
        <PeriodView
          start={monthStart(date)}
          end={date}
          outlet={outlet}
          label="Monthly"
        />
      )}
      {tab === "insights" && <InsightsView date={date} outlet={outlet} />}
    </div>
  );
}
