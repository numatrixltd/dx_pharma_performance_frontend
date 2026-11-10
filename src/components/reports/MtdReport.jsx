'use client';
import { useState } from 'react';
import { CheckCircle2, Download, TrendingUp, Users, Wallet } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/context/ToastContext';
import { downloadFile } from '@/lib/api';
import { defaultReportDate, monthStart, todayISO } from '@/lib/dates';
import { money, pct } from '@/lib/format';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import KpiCard from '@/components/ui/KpiCard';
import PageHeader from '@/components/ui/PageHeader';
import OutletSelect from '@/components/ui/OutletSelect';
import { Field, Input } from '@/components/ui/Field';
import { ErrorBox, PageSkeleton } from '@/components/ui/States';
import MtdReport from '@/components/reports/MtdReport';

export default function ReportsPage() {
  const toast = useToast();
  const [date, setDate] = useState(defaultReportDate());
  const [outlet, setOutlet] = useState('All');
  const [start, setStart] = useState(monthStart(defaultReportDate()));
  const [end, setEnd] = useState(defaultReportDate());
  const [busy, setBusy] = useState('');
  const { data, loading, error, reload } = useApi('/reports/summary', { date });

  const run = async (key, path, params) => {
    setBusy(key);
    try { await downloadFile(path, params); toast.success('Download started'); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(''); }
  };

  if (!data && loading) return <PageSkeleton />;
  if (!data && error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;

  const ready = [
    ['Active employee records', <strong key="a" className="text-white">{data.employeeCount}</strong>],
    ['Manager incentive policy', <Badge key="b" tone={data.managerPolicyConfigured ? 'green' : 'amber'}>{data.managerPolicyConfigured ? 'Configured' : 'Not configured'}</Badge>],
    ['Database connection', <Badge key="c" tone="green">{data.database}</Badge>],
    ['Authentication', <Badge key="d" tone="green">{data.authentication}</Badge>],
    ['Photo uploads (Cloudinary)', <Badge key="e" tone={data.cloudinary ? 'green' : 'amber'}>{data.cloudinary ? 'Ready' : 'Not configured'}</Badge>],
    ['Manager sales entry', <Badge key="f" tone="gray">{data.managerCanEnterSales ? 'Drafts allowed' : 'Read-only'}</Badge>],
  ];

  return (
    <div>
      <PageHeader title="Reports & exports" subtitle="Outlet month-to-date performance, plus CSV downloads that open in Excel or Google Sheets." />
      <div className="mb-5"><Input type="date" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} className="!w-auto" aria-label="Summary date" /></div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard animate={false} label="Employee master" icon={Users} tone="blue" value={data.employeeCount} foot="Active directory records" />
        <KpiCard animate={false} label="Finalized records" icon={CheckCircle2} tone="green" value={data.finalizedCount} foot="For the selected date" />
        <KpiCard animate={false} label="Total sales" icon={Wallet} tone="violet" value={data.totalSales} format={(n) => money(n)} foot="Finalized sales only" />
        <KpiCard animate={false} label="Achievement" icon={TrendingUp} tone="amber" value={data.achievement} format={(n) => pct(n)} foot="Against covered targets" />
      </div>

      <div className="mb-5"><MtdReport date={date} /></div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr] sm:gap-5">
        <div className="space-y-4 sm:space-y-5">
          <Card>
            <CardHeader title="Daily sales & incentive records" subtitle="Employee, outlet, category, target, sales, achievement and incentive. Salary fields are never included." />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="Date" className="flex-1"><Input type="date" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} /></Field>
              <Field label="Outlet" className="flex-1"><OutletSelect value={outlet} onChange={setOutlet} allLabel="All" /></Field>
              <Button variant="primary" loading={busy === 'daily'} onClick={() => run('daily', '/reports/export/daily', { date, outlet })}><Download size={15} /> Download CSV</Button>
            </div>
          </Card>
          <Card>
            <CardHeader title="Period performance" subtitle="Ranked salesperson results for a date range." />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="Start date" className="flex-1"><Input type="date" value={start} max={todayISO()} onChange={(e) => setStart(e.target.value)} /></Field>
              <Field label="End date" className="flex-1"><Input type="date" value={end} max={todayISO()} onChange={(e) => setEnd(e.target.value)} /></Field>
              <Button variant="primary" loading={busy === 'perf'} disabled={!start || !end || start > end} onClick={() => run('perf', '/reports/export/performance', { start, end, outlet })}><Download size={15} /> Download CSV</Button>
            </div>
          </Card>
          <Card>
            <CardHeader title="Employee directory" subtitle="Name, designation, outlet, category and targets." />
            <Button loading={busy === 'emp'} onClick={() => run('emp', '/reports/export/employees', { outlet })}><Download size={15} /> Download CSV</Button>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Data readiness" />
          <dl className="space-y-4 text-sm">{ready.map(([k, v]) => <div key={k} className="flex items-center justify-between gap-4"><dt className="text-slate-400">{k}</dt><dd>{v}</dd></div>)}</dl>
        </Card>
      </div>
    </div>
  );
}