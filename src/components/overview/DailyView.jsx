"use client";
import {
  AlertTriangle,
  BadgeDollarSign,
  CalendarCheck,
  Clock,
  Crown,
  Target,
  TrendingUp,
  UserCheck,
  Wallet,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { money, pct } from "@/lib/format";
import KpiCard from "@/components/ui/KpiCard";
import { ErrorBox, PageSkeleton } from "@/components/ui/States";
import AlertsCard from "./AlertsCard";
import { ChampionCard, OutletPerformanceCard, PerformersTable } from "./shared";

export default function DailyView({ date, outlet, scope }) {
  const { data, loading, error, reload } = useApi("/dashboard", {
    date,
    outlet,
  });
  const alerts = useApi("/dashboard/alerts", { date, outlet });

  if (!data && loading) return <PageSkeleton />;
  if (!data && error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;
  const {
    kpis: k,
    attendance: a,
    outletPerformance,
    champion,
    performers,
  } = data;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          variant="spread"
          dot
          index={0}
          label="Total daily sales"
          icon={Wallet}
          tone="blue"
          value={k.sales}
          format={money}
          foot="Finalized records"
        />
        <KpiCard
          variant="spread"
          index={1}
          label="Total daily target"
          icon={Target}
          tone="violet"
          value={k.target}
          format={money}
          foot="Target coverage for selected date"
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
          foot={`${k.achievers100} of ${k.ranked} employees at 100%+`}
        />
        <KpiCard
          variant="spread"
          index={3}
          label="Salesperson incentives"
          icon={BadgeDollarSign}
          tone="amber"
          value={k.incentives}
          format={money}
          foot="Earned · pending approval"
        />
        <KpiCard
          variant="spread"
          dot
          index={4}
          label="100%+ achievers"
          icon={UserCheck}
          tone="green"
          value={k.achievers100}
          foot={`${k.achievers150} reached 150%+`}
        />
        <KpiCard
          variant="spread"
          index={5}
          label="200%+ achievers"
          icon={Crown}
          tone="amber"
          value={k.achievers200}
          foot="Highest reward tier"
        />
        <KpiCard
          variant="spread"
          index={6}
          label="Attendance"
          icon={CalendarCheck}
          tone={a.absent ? "red" : "cyan"}
          text={`${a.present} / ${a.total}`}
          foot={`${a.absent} absent · ${a.off} off · ${a.notReported} not reported`}
        />
        <KpiCard
          variant="spread"
          index={7}
          label="Pending approvals"
          icon={Clock}
          tone="cyan"
          value={k.pendingApprovals}
          foot="Earned is not the same as paid"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr] sm:gap-5">
        <OutletPerformanceCard
          outlets={outletPerformance}
          subtitle="Daily sales against target"
        />
        <ChampionCard champion={champion} scope={scope} />
      </div>

      <PerformersTable
        title="Salesperson performance · selected day"
        rows={performers}
      />
      <AlertsCard
        data={alerts.data}
        loading={alerts.loading}
        error={alerts.error}
      />
      <p className="pb-2 text-right text-xs text-slate-500">
        Incentives calculated using unrounded achievement values
      </p>
    </div>
  );
}
