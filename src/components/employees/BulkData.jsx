'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCheck, ClipboardPaste, Download, FileSpreadsheet, Plus, Trash2, Upload } from 'lucide-react';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { downloadText } from '@/lib/csv';
import { COLUMNS, emptyRow, isBlank, parseTable, rowsToCsv, tableToRows, templateCsv } from '@/lib/bulkEmployees';
import { useToast } from '@/context/ToastContext';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Notice from '@/components/ui/Notice';
import KpiCard from '@/components/ui/KpiCard';
import { Input, Select } from '@/components/ui/Field';
import { TableWrap } from '@/components/shared/cells';

const RESULT = { add: ['green', 'New'], update: ['blue', 'Will update'], skip: ['gray', 'Skipped'], error: ['red', 'Error'] };
const DONE = { add: ['green', 'Added'], update: ['blue', 'Updated'], skip: ['gray', 'Skipped'], error: ['red', 'Error'] };

export default function BulkData({ outlets }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [rows, setRows] = useState(() => [emptyRow(), emptyRow(), emptyRow()]);
  const [mode, setMode] = useState('skip');
  const [check, setCheck] = useState(null); // { byKey: Map, summary }
  const [done, setDone] = useState(null); // { summary, problems }
  const [busy, setBusy] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [paste, setPaste] = useState('');

  const outletNames = outlets.map((o) => o.name);
  const filled = rows.filter((r) => !isBlank(r));

  const change = (key, field, value) => { setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: value } : r))); setCheck(null); };
  const remove = (key) => { setRows((rs) => rs.filter((r) => r.key !== key)); setCheck(null); };
  const addRows = (n) => { setRows((rs) => [...rs, ...Array.from({ length: n }, () => emptyRow())]); setCheck(null); };

  const load = (table, source) => {
    const { rows: parsed, header } = tableToRows(table, outlets);
    if (!parsed.length) { toast.error('No employee rows found'); return; }
    setRows((rs) => [...rs.filter((r) => !isBlank(r)), ...parsed]);
    setCheck(null);
    setDone(null);
    toast.success(`${parsed.length} row${parsed.length === 1 ? '' : 's'} loaded from ${source}${header ? '' : ' (no header row, so the standard column order was used)'}. Check them, then press Check data.`);
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (/\.xlsx?$/i.test(f.name)) { toast.error('Save the sheet as CSV first (File → Save as → CSV), or copy the cells and use Paste from Excel.'); return; }
    load(parseTable(await f.text()), f.name);
  };

  const exportCurrent = async () => {
    try {
      const list = await api('/employees', { params: { status: 'all' } });
      const out = list.map((e) => emptyRow({ name: e.name, designation: e.designation, outlet: e.outlet?.name || '', category: e.category, dailyTarget: e.dailyTarget, monthlyTarget: e.monthlyTarget, phone: e.phone || '', status: e.isActive ? 'Active' : 'Archived' }));
      downloadText('dx-pharma-employees-all-data.csv', rowsToCsv(out));
      toast.success(`${out.length} employees exported. Edit and upload with “Update existing” to change them in bulk.`);
    } catch (err) { toast.error(err.message); }
  };

  const send = async (dryRun) => {
    const res = await api('/employees/bulk', { method: 'POST', body: { rows: filled.map(({ key, ...r }) => r), mode, dryRun } });
    const byKey = new Map(filled.map((r, i) => [r.key, res.results[i]]));
    return { res, byKey };
  };

  const runCheck = async () => {
    if (!filled.length) { toast.error('Add at least one employee first'); return; }
    setBusy('check');
    try { const { res, byKey } = await send(true); setCheck({ byKey, summary: res.summary }); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(''); }
  };

  const runImport = async () => {
    setBusy('import');
    try {
      const { res, byKey } = await send(false);
      const problems = filled.map((r) => ({ row: r, r: byKey.get(r.key) })).filter((x) => x.r.result === 'skip' || x.r.result === 'error');
      setDone({ summary: res.summary, problems });
      setRows([emptyRow(), emptyRow(), emptyRow()]);
      setCheck(null);
      toast.success(`${res.summary.add} added, ${res.summary.update} updated`);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(''); }
  };

  const downloadProblems = () => downloadText('dx-pharma-bulk-problem-rows.csv', rowsToCsv(done.problems.map((p) => p.row), [{ label: 'Result', get: (r) => done.problems.find((p) => p.row.key === r.key).r.result }, { label: 'Reason', get: (r) => done.problems.find((p) => p.row.key === r.key).r.reason }]));

  const local = (r) => {
    if (isBlank(r)) return null;
    if (!r.name.trim()) return 'name';
    if (!r.outlet || !outletNames.includes(r.outlet)) return 'outlet';
    return null;
  };

  if (done) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <KpiCard animate={false} variant="spread" label="Added" tone="green" value={done.summary.add} foot="New employees" />
          <KpiCard animate={false} variant="spread" label="Updated" tone="blue" value={done.summary.update} foot="Existing employees changed" />
          <KpiCard animate={false} variant="spread" label="Skipped" tone="cyan" value={done.summary.skip} foot="Already existed or duplicates" />
          <KpiCard animate={false} variant="spread" label="Errors" tone={done.summary.error ? 'red' : 'cyan'} value={done.summary.error} foot="Not imported" />
        </div>
        {done.problems.length > 0 && (
          <Card pad={false} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <h3 className="text-sm font-semibold text-white">Rows that were not imported</h3>
              <Button onClick={downloadProblems}><Download size={15} /> Download these rows</Button>
            </div>
            <TableWrap>
              <table className="w-full min-w-[640px]">
                <thead><tr>{['Name', 'Outlet', 'Result', 'Reason'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>{done.problems.map(({ row, r }) => <tr key={row.key}><td className="td font-semibold text-white">{row.name || '—'}</td><td className="td">{row.outlet || '—'}</td><td className="td"><Badge tone={DONE[r.result][0]}>{DONE[r.result][1]}</Badge></td><td className="td whitespace-normal text-xs text-slate-300">{r.reason}</td></tr>)}</tbody>
              </table>
            </TableWrap>
          </Card>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setDone(null)}><Plus size={15} /> Add more</Button>
          <Link href="/employees"><Button variant="primary">Go to employees</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="1. Bring in your data" subtitle="Upload a CSV, paste cells copied from Excel or Google Sheets, or type straight into the grid below." />
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv" hidden onChange={onFile} />
          <Button variant="primary" onClick={() => fileRef.current?.click()}><Upload size={15} /> Upload CSV</Button>
          <Button onClick={() => setPasteOpen((v) => !v)}><ClipboardPaste size={15} /> Paste from Excel</Button>
          <Button onClick={() => downloadText('dx-pharma-bulk-employee-template.csv', templateCsv(outletNames[0]))}><FileSpreadsheet size={15} /> Download template</Button>
          <Button onClick={exportCurrent}><Download size={15} /> Export current employees</Button>
        </div>
        {pasteOpen && (
          <div className="mt-4">
            <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={6} spellCheck={false} placeholder={'Paste rows here. Columns: Employee Name, Designation, Outlet, Category, Daily Target, Monthly Target, Phone, Status\nA header row is optional.'} className="input font-mono text-xs" aria-label="Paste employee rows" />
            <div className="mt-2 flex gap-2"><Button variant="primary" onClick={() => { load(parseTable(paste), 'pasted data'); setPaste(''); setPasteOpen(false); }} disabled={!paste.trim()}>Add pasted rows</Button><Button onClick={() => setPasteOpen(false)}>Cancel</Button></div>
          </div>
        )}
        <div className="mt-4 grid gap-1.5 text-xs text-slate-400">
          <p><strong className="text-slate-300">Columns:</strong> {COLUMNS.map((c) => c.label).join(' · ')}</p>
          <p><strong className="text-slate-300">Outlet</strong> must match one of: {outletNames.join(', ') || '—'}. <strong className="text-slate-300">Category</strong>: Senior, Junior or blank. <strong className="text-slate-300">Status</strong>: Active or Archived. Monthly target blank = daily × 25. Salary is never stored.</p>
        </div>
      </Card>

      <Card pad={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div><h3 className="text-sm font-semibold text-white">2. Review and edit</h3><p className="mt-1 text-xs text-slate-400">{filled.length} employee{filled.length === 1 ? '' : 's'} ready. Fix anything in red, then check the data.</p></div>
          <div className="flex gap-2"><Button size="sm" onClick={() => addRows(1)}><Plus size={14} /> Add row</Button><Button size="sm" onClick={() => addRows(5)}>+ 5 rows</Button><Button size="sm" variant="ghost" onClick={() => { setRows([emptyRow(), emptyRow(), emptyRow()]); setCheck(null); }}>Clear all</Button></div>
        </div>
        <TableWrap>
          <table className="w-full min-w-[1180px]">
            <thead><tr><th className="th w-10">#</th>{COLUMNS.map((c) => <th key={c.key} className="th">{c.label}</th>)}<th className="th">Check</th><th className="th w-10"><span className="sr-only">Remove</span></th></tr></thead>
            <tbody>
              {rows.map((r, i) => {
                const bad = local(r);
                const res = check?.byKey.get(r.key);
                const cell = 'input !py-1.5 !text-xs';
                return (
                  <tr key={r.key} className="tr-hover">
                    <td className="td text-xs text-slate-500">{i + 1}</td>
                    <td className="td"><Input value={r.name} onChange={(e) => change(r.key, 'name', e.target.value)} className={clsx(cell, 'min-w-[170px]', bad === 'name' && '!border-rose-500/70')} aria-label={`Name, row ${i + 1}`} placeholder="Full name" /></td>
                    <td className="td"><Input value={r.designation} onChange={(e) => change(r.key, 'designation', e.target.value)} className={clsx(cell, 'min-w-[150px]')} aria-label={`Designation, row ${i + 1}`} placeholder="Sales Executive" /></td>
                    <td className="td">
                      <Select value={r.outlet} onChange={(e) => change(r.key, 'outlet', e.target.value)} className={clsx(cell, 'min-w-[130px]', bad === 'outlet' && '!border-rose-500/70')} aria-label={`Outlet, row ${i + 1}`}>
                        <option value="">Choose…</option>
                        {outletNames.map((n) => <option key={n} value={n}>{n}</option>)}
                        {r.outlet && !outletNames.includes(r.outlet) && <option value={r.outlet}>⚠ {r.outlet}</option>}
                      </Select>
                    </td>
                    <td className="td"><Select value={r.category} onChange={(e) => change(r.key, 'category', e.target.value)} className={clsx(cell, 'min-w-[110px]')} aria-label={`Category, row ${i + 1}`}><option value="">Unassigned</option><option>Senior</option><option>Junior</option>{r.category && !['Senior', 'Junior'].includes(r.category) && <option value={r.category}>⚠ {r.category}</option>}</Select></td>
                    <td className="td"><Input type="number" min="0" value={r.dailyTarget} onChange={(e) => change(r.key, 'dailyTarget', e.target.value)} className={clsx(cell, 'w-28')} aria-label={`Daily target, row ${i + 1}`} /></td>
                    <td className="td"><Input type="number" min="0" value={r.monthlyTarget} onChange={(e) => change(r.key, 'monthlyTarget', e.target.value)} className={clsx(cell, 'w-32')} placeholder="daily × 25" aria-label={`Monthly target, row ${i + 1}`} /></td>
                    <td className="td"><Input value={r.phone} onChange={(e) => change(r.key, 'phone', e.target.value)} className={clsx(cell, 'w-36')} aria-label={`Phone, row ${i + 1}`} placeholder="01…" /></td>
                    <td className="td"><Select value={r.status} onChange={(e) => change(r.key, 'status', e.target.value)} className={clsx(cell, 'w-28')} aria-label={`Status, row ${i + 1}`}><option>Active</option><option>Archived</option></Select></td>
                    <td className="td">
                      {res ? (
                        <div className="min-w-[130px] whitespace-normal">
                          <Badge tone={RESULT[res.result][0]}>{RESULT[res.result][1]}</Badge>
                          {res.reason && <div className="mt-1 text-[11px] leading-snug text-slate-400">{res.reason}</div>}
                        </div>
                      ) : bad ? <span className="text-[11px] text-rose-300">{bad === 'name' ? 'Name needed' : 'Pick an outlet'}</span> : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="td"><Button size="icon" variant="ghost" className="hover:!text-rose-300" aria-label={`Remove row ${i + 1}`} onClick={() => remove(r.key)}><Trash2 size={15} /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Card>
        <CardHeader title="3. Check and import" subtitle="Employees are matched by name and outlet." />
        <div className="grid gap-2 sm:grid-cols-2">
          {[['skip', 'Skip rows that already exist', 'Only new employees are added.'], ['update', 'Update existing employees', 'Matches by name and outlet. Blank cells keep the current value.']].map(([v, t, d]) => (
            <label key={v} className={clsx('flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition', mode === v ? 'border-brand-400 bg-brand-500/10' : 'border-ink-600 hover:border-brand-500/50')}>
              <input type="radio" name="mode" checked={mode === v} onChange={() => { setMode(v); setCheck(null); }} className="mt-1 accent-brand-500" />
              <span><span className="block text-sm font-semibold text-white">{t}</span><span className="text-xs text-slate-400">{d}</span></span>
            </label>
          ))}
        </div>

        {check && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <Badge tone="green">{check.summary.add} new</Badge>
            <Badge tone="blue">{check.summary.update} to update</Badge>
            <Badge tone="gray">{check.summary.skip} skipped</Badge>
            <Badge tone={check.summary.error ? 'red' : 'gray'}>{check.summary.error} errors</Badge>
            {check.summary.error > 0 && <span className="text-slate-400">Rows with errors are left out. Fix them above and check again, or import the rest.</span>}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <Button onClick={runCheck} loading={busy === 'check'} disabled={!filled.length}><CheckCheck size={15} /> Check data</Button>
          <Button variant="primary" onClick={runImport} loading={busy === 'import'} disabled={!check || check.summary.add + check.summary.update === 0}>
            Import {check ? check.summary.add + check.summary.update : 0} employee{check && check.summary.add + check.summary.update === 1 ? '' : 's'}
          </Button>
        </div>
        {!check && filled.length > 0 && <Notice tone="blue" className="!mb-0 mt-4">Press <strong className="text-white">Check data</strong> to see what will be added or updated before anything is saved.</Notice>}
      </Card>
    </div>
  );
}