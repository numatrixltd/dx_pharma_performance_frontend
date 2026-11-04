"use client";
import {
  CalendarCheck,
  CalendarX,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  BadgeDollarSign,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { money, pct, longDate } from "@/lib/format";
import Card, { CardHeader } from "@/components/ui/Card";
import KpiCard from "@/components/ui/KpiCard";
import { ErrorBox, PageSkeleton } from "@/components/ui/States";
import TrendChart from "@/components/charts/TrendChart";
import { OutletPerformanceCard, PerformersTable } from "./shared";

/** Weekly / monthly roll-up (week or month to the selected date). */
export default function PeriodView({ start, end, outlet, label }) {
  const { data, loading, error, reload } = useApi("/dashboard/period", {
    start,
    end,
    outlet,
  });
  if (!data && loading) return <PageSkeleton />;
  if (!data && error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;
  const { kpis: k, outletPerformance, performers, trend } = data;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          variant="spread"
          dot
          index={0}
          label={`${label} sales`}
          icon={Wallet}
          tone="blue"
          value={k.sales}
          format={money}
          foot={`${longDate(start)} to ${longDate(end)}`}
        />
        <KpiCard
          variant="spread"
          index={1}
          label={`${label} target`}
          icon={Target}
          tone="violet"
          value={k.target}
          format={money}
          foot="Daily targets over working days"
        />
        <KpiCard
          variant="spread"
          dot
          index={2}
          label="Overall achievement"
          icon={TrendingUp}
          tone="green"
          value={k.achievement}
          format={(n) => pct(n)}
          foot="Against period targets"
        />
        <KpiCard
          variant="spread"
          index={3}
          label="Salesperson incentives"
          icon={BadgeDollarSign}
          tone="amber"
          value={k.incentive}
          format={money}
          foot="Daily rewards summed · pending approval"
        />
        <KpiCard
          variant="spread"
          dot
          index={4}
          label="100%+ achievers"
          icon={UserCheck}
          tone="green"
          value={k.achievers100}
          foot="Employees at or above period target"
        />
        <KpiCard
          variant="spread"
          index={5}
          label="Employees reported"
          icon={Users}
          tone="cyan"
          text={`${k.employeesReported} / ${k.employeesTotal}`}
          foot="With finalized sales in the period"
        />
        <KpiCard
          variant="spread"
          index={6}
          label="Reported days"
          icon={CalendarCheck}
          tone="blue"
          text={`${k.reportedDays} / ${k.possibleDays}`}
          foot="Employee-days with finalized sales"
        />
        <KpiCard
          variant="spread"
          index={7}
          label="Missing days"
          icon={CalendarX}
          tone={k.missingDays ? "red" : "cyan"}
          value={k.missingDays}
          foot="Working days without a finalized record"
        />
      </div>

      <Card>
        <CardHeader
          title="Sales trend"
          subtitle={`${label} · finalized records`}
        />
        <TrendChart data={trend} />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr] sm:gap-5">
        <OutletPerformanceCard
          outlets={outletPerformance}
          subtitle={`${label} sales against period target`}
        />
      </div>

      <PerformersTable
        title={`Salesperson performance · ${label.toLowerCase()}`}
        rows={performers}
      />
    </div>
  );
}
