'use client';
import { useMemo, useRef, useState } from 'react';
import { CheckCheck, ClipboardPaste, Download, FileSpreadsheet, Upload } from 'lucide-react';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { downloadText } from '@/lib/csv';
import { SALES_COLUMNS, parseTable, salesTemplateCsv, tableToSalesRows, toCsv } from '@/lib/bulkSales';
import { money } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Notice from '@/components/ui/Notice';

const TONE = { add: ['green', 'New'], update: ['blue', 'Will replace'], skip: ['gray', 'Skipped'], error: ['red', 'Error'], pending: ['gray', '—'] };
const DONE_TONE = { add: ['green', 'Added'], update: ['blue', 'Replaced'], skip: ['gray', 'Skipped'], error: ['red', 'Error'] };
const SHOW = 300;

function Choice({ on, title, text, onClick, disabled }) {
  return (
    <button type="button" role="radio" aria-checked={on} disabled={disabled} onClick={onClick}
      className={clsx('flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition', on ? 'border-brand-400 bg-brand-500/10' : 'border-ink-600 hover:border-brand-500/50', disabled && 'cursor-not-allowed opacity-50')}>
      <span className={clsx('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border', on ? 'border-brand-400' : 'border-ink-500')}>{on && <span className="h-2 w-2 rounded-full bg-brand-400" />}</span>
      <span><span className="block text-sm font-semibold text-white">{title}</span><span className="text-xs text-slate-400">{text}</span></span>
    </button>
  );
}

/**
 * Bulk upload of daily sales for many employees and dates.
 * employees/outletName/date describe the page's current sheet and are only used to build the template.
 */
export default function BulkSalesModal({ open, onClose, outletName, date, employees, canFinalize, onDone }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('Draft');
  const [existing, setExisting] = useState('skip');
  const [check, setCheck] = useState(null); // { results, summary }
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState('');
  const [filter, setFilter] = useState('all');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [paste, setPaste] = useState('');

  const reset = () => { setRows([]); setCheck(null); setDone(null); setFilter('all'); setPaste(''); setPasteOpen(false); };
  const close = () => { const changed = !!done; reset(); onClose(); if (changed) onDone(); };

  const load = (table, source) => {
    const { rows: parsed, header } = tableToSalesRows(table);
    if (!parsed.length) { toast.error('No sales rows found in that data'); return; }
    setRows(parsed);
    setCheck(null);
    setDone(null);
    toast.success(`${parsed.length} row${parsed.length === 1 ? '' : 's'} loaded from ${source}${header ? '' : ' (no header row, so the standard column order was used)'}. Press Check data.`);
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (/\.xlsx?$/i.test(f.name)) { toast.error('Save the sheet as CSV first (File → Save as → CSV), or copy the cells and use Paste from Excel.'); return; }
    load(parseTable(await f.text()), f.name);
  };

  const send = (dryRun) => api('/sales/bulk', { method: 'POST', body: { rows: rows.map(({ key, ...r }) => r), status, existing, dryRun } });

  const runCheck = async () => {
    setBusy('check');
    try { setCheck(await send(true)); } catch (e) { toast.error(e.message); } finally { setBusy(''); }
  };
  const runImport = async () => {
    setBusy('import');
    try { const r = await send(false); setDone(r); setCheck(null); toast.success(`${r.summary.add} added, ${r.summary.update} replaced`); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(''); }
  };

  const view = done || check;
  const results = view?.results || [];
  const shown = useMemo(() => {
    const list = results.map((r, i) => ({ ...r, row: rows[i] })).filter((x) => x.row);
    return filter === 'all' ? list : list.filter((x) => (filter === 'problems' ? x.result === 'error' || x.result === 'skip' : x.result === filter));
  }, [results, rows, filter]);

  const problems = () => downloadText('dx-pharma-bulk-sales-problem-rows.csv', toCsv([
    ['Employee Name', 'Date', 'Outlet', 'Category', 'Daily Sales', 'Result', 'Reason'],
    ...results.map((r, i) => ({ r, row: rows[i] })).filter((x) => x.row && (x.r.result === 'error' || x.r.result === 'skip')).map(({ r, row }) => [row.employee, row.date, row.outlet, row.category, row.sales, r.result, r.reason]),
  ]));

  const s = view?.summary;
  const writes = s ? s.add + s.update : 0;
  const tone = done ? DONE_TONE : TONE;

  return (
    <Modal open={open} onClose={close} size="xl" title="Bulk upload daily sales" subtitle="Upload sales for many employees and dates at once. Anyone with a sales entry counts as present."
      footer={done ? <Button variant="primary" onClick={close}>Done</Button> : (
        <>
          <Button onClick={close} disabled={!!busy}>Cancel</Button>
          <Button onClick={runCheck} loading={busy === 'check'} disabled={!rows.length}><CheckCheck size={15} /> Check data</Button>
          <Button variant="primary" onClick={runImport} loading={busy === 'import'} disabled={!check || writes === 0}>{status === 'Finalized' ? 'Finalize' : 'Save'} {writes} record{writes === 1 ? '' : 's'}</Button>
        </>
      )}>
      {!done && (
        <>
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv" hidden onChange={onFile} />
            <Button variant="primary" onClick={() => fileRef.current?.click()}><Upload size={15} /> Upload CSV</Button>
            <Button onClick={() => setPasteOpen((v) => !v)}><ClipboardPaste size={15} /> Paste from Excel</Button>
            <Button onClick={() => downloadText(`dx-pharma-sales-template-${outletName}-${date}.csv`, salesTemplateCsv(employees, outletName, date))}><FileSpreadsheet size={15} /> Template ({outletName}, {date})</Button>
          </div>
          {pasteOpen && (
            <div className="mt-3">
              <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={5} spellCheck={false} className="input font-mono text-xs" aria-label="Paste sales rows"
                placeholder={'Employee Name\tDate\tOutlet\tCategory\tDaily Sales\nAyesha Rahman\t2026-11-03\tPanthapath\tSenior\t12500'} />
              <div className="mt-2 flex gap-2"><Button variant="primary" disabled={!paste.trim()} onClick={() => { load(parseTable(paste), 'pasted data'); setPasteOpen(false); setPaste(''); }}>Use pasted rows</Button><Button onClick={() => setPasteOpen(false)}>Cancel</Button></div>
            </div>
          )}
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            <strong className="text-slate-300">Columns:</strong> {SALES_COLUMNS.map((c) => c.label + (c.key === 'category' ? ' (optional)' : '')).join(' · ')}. One row per employee per date, any number of dates. Use dates like <span className="font-mono">2026-11-03</span>. Leave Daily Sales blank for “not reported”, and use 0 for a confirmed zero.
            Each row is checked for employee name, outlet, category and date.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div role="radiogroup" aria-label="Save as" className="space-y-2">
              <div className="text-xs font-medium text-slate-400">Save as</div>
              <Choice on={status === 'Draft'} title="Draft" text="Does not count in rankings until finalized." onClick={() => { setStatus('Draft'); setCheck(null); }} />
              <Choice on={status === 'Finalized'} disabled={!canFinalize} title="Finalized" text={canFinalize ? 'Locks targets and incentives, and counts in rankings.' : 'Your role can’t finalize. Save as Draft.'} onClick={() => { setStatus('Finalized'); setCheck(null); }} />
            </div>
            <div role="radiogroup" aria-label="If a record already exists" className="space-y-2">
              <div className="text-xs font-medium text-slate-400">If a record already exists for that employee and date</div>
              <Choice on={existing === 'skip'} title="Keep the existing record" text="The row is skipped." onClick={() => { setExisting('skip'); setCheck(null); }} />
              <Choice on={existing === 'overwrite'} title="Replace it" text="Corrections to finalized days are audited. Paid incentives are never changed." onClick={() => { setExisting('overwrite'); setCheck(null); }} />
            </div>
          </div>
        </>
      )}

      {done && (
        <Notice tone="blue" className="!mb-4" title="Import finished.">{done.summary.present} sales record{done.summary.present === 1 ? '' : 's'} saved across {done.summary.dates.length} date{done.summary.dates.length === 1 ? '' : 's'}. Those employees now count as present, and any Absent or Day-off mark for those days was removed.</Notice>
      )}

      {s && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setFilter('all')} className={clsx('rounded-full border px-3 py-1 text-xs font-semibold', filter === 'all' ? 'border-brand-400 text-brand-300' : 'border-ink-600 text-slate-300')}>All {results.length}</button>
          <button type="button" onClick={() => setFilter('add')}><Badge tone="green">{s.add} {done ? 'added' : 'new'}</Badge></button>
          <button type="button" onClick={() => setFilter('update')}><Badge tone="blue">{s.update} {done ? 'replaced' : 'to replace'}</Badge></button>
          <button type="button" onClick={() => setFilter('skip')}><Badge tone="gray">{s.skip} skipped</Badge></button>
          <button type="button" onClick={() => setFilter('error')}><Badge tone={s.error ? 'red' : 'gray'}>{s.error} errors</Badge></button>
          {(s.skip > 0 || s.error > 0) && <Button size="sm" className="ml-auto" onClick={problems}><Download size={14} /> Download problem rows</Button>}
        </div>
      )}
      {check && s.error > 0 && !done && <p className="mt-2 text-xs text-slate-400">Rows with errors are left out. Fix them in your file and upload again, or save the rest.</p>}

      {rows.length > 0 && (
        <div className="mt-4 overflow-auto rounded-xl border border-ink-600/60" style={{ maxHeight: 360 }}>
          <table className="w-full min-w-[760px]">
            <thead className="sticky top-0 z-10"><tr>{['#', 'Employee', 'Date', 'Outlet', 'Category', 'Daily sales', 'Check'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {(view ? shown : rows.map((row, i) => ({ row, line: i + 1, result: 'pending', reason: '' }))).slice(0, SHOW).map((x) => {
                const r = x.row;
                const [t, label] = tone[x.result];
                return (
                  <tr key={r.key} className="tr-hover">
                    <td className="td text-xs text-slate-500">{x.line}</td>
                    <td className="td font-medium text-white">{r.employee || '—'}</td>
                    <td className="td">{x.date || r.date || '—'}</td>
                    <td className="td">{r.outlet || '—'}</td>
                    <td className="td">{r.category || '—'}</td>
                    <td className="td tabular-nums">{r.sales === '' ? '—' : Number.isFinite(Number(r.sales)) ? money(r.sales) : r.sales}</td>
                    <td className="td"><div className="min-w-[150px] whitespace-normal"><Badge tone={t}>{label}</Badge>{x.reason && <div className="mt-1 text-[11px] leading-snug text-slate-400">{x.reason}</div>}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(view ? shown.length : rows.length) > SHOW && <p className="border-t border-ink-600/50 px-4 py-2 text-center text-xs text-slate-500">Showing the first {SHOW} of {view ? shown.length : rows.length} rows. Everything is checked and imported.</p>}
        </div>
      )}
      {rows.length > 0 && !view && <Notice tone="blue" className="!mb-0 mt-4">{rows.length} row{rows.length === 1 ? '' : 's'} loaded. Press <strong className="text-white">Check data</strong> to see what will happen before anything is saved.</Notice>}
    </Modal>
  );
}