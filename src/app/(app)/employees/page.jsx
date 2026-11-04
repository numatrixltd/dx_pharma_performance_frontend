'use client';
import { useEffect, useRef, useState } from 'react';
import { Archive, Camera, Download, Pencil, Plus, RotateCcw, Search, Trash2, Upload } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { downloadText, parseCsv } from '@/lib/csv';
import { money } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Notice from '@/components/ui/Notice';
import PageHeader from '@/components/ui/PageHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import OutletSelect from '@/components/ui/OutletSelect';
import { Field, Input, Select } from '@/components/ui/Field';
import { EmptyState, ErrorBox, Skeleton } from '@/components/ui/States';
import { EmployeeCell, OutletLink, TableWrap } from '@/components/shared/cells';

const EMPTY = { name: '', designation: 'Sales Executive', outlet: '', category: '', dailyTarget: '', monthlyTarget: '', phone: '' };
const TEMPLATE = 'Employee Name,Designation,Outlet,Monthly Target,Daily Target,Category\nExample Employee,Sales Executive,Panthapath,250000,10000,\n';

function EmployeeForm({ open, onClose, employee, outlets, onSaved }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const editing = !!employee;

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setPreview(employee?.avatar || null);
    setForm(employee
      ? { name: employee.name, designation: employee.designation, outlet: employee.outlet?._id || '', category: employee.category || '', dailyTarget: employee.dailyTarget, monthlyTarget: employee.monthlyTarget || '', phone: employee.phone || '' }
      : { ...EMPTY, outlet: outlets[0]?._id || '' });
  }, [open, employee, outlets]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    setBusy(true);
    try {
      const body = { ...form, dailyTarget: Number(form.dailyTarget), monthlyTarget: form.monthlyTarget === '' ? undefined : Number(form.monthlyTarget) };
      const saved = editing ? await api(`/employees/${employee._id}`, { method: 'PUT', body }) : await api('/employees', { method: 'POST', body });
      let photoFailed = '';
      if (file) {
        try {
          const fd = new FormData();
          fd.append('avatar', file);
          await api(`/employees/${saved._id}/avatar`, { method: 'POST', formData: fd });
        } catch (e) { photoFailed = e.message; }
      }
      toast.success(editing ? 'Employee updated' : 'Employee added. Assign Senior or Junior if you left it blank.');
      if (photoFailed) toast.error(`Employee saved, but the photo failed: ${photoFailed}`);
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={editing ? 'Edit employee' : 'Add employee'} subtitle="Salary is never stored. Only targets and category are used."
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>{editing ? 'Save changes' : 'Add employee'}</Button></>}>
      <div className="mb-5 flex items-center gap-4">
        <button type="button" onClick={() => fileRef.current?.click()} className="group relative" aria-label="Choose photo">
          <Avatar name={form.name || 'New'} src={preview} size={72} />
          <span className="absolute inset-0 grid place-items-center rounded-xl bg-black/55 opacity-0 transition group-hover:opacity-100"><Camera size={20} /></span>
        </button>
        <div className="text-xs text-slate-400">
          <div className="font-medium text-slate-200">Profile photo (optional)</div>
          <div className="mt-0.5">JPG, PNG or WEBP up to 3 MB</div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pick} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" className="sm:col-span-2"><Input value={form.name} onChange={set('name')} placeholder="e.g. Ayesha Rahman" autoFocus /></Field>
        <Field label="Designation"><Input value={form.designation} onChange={set('designation')} /></Field>
        <Field label="Outlet">
          <Select value={form.outlet} onChange={set('outlet')}><option value="">Choose outlet</option>{outlets.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}</Select>
        </Field>
        <Field label="Category" hint="Senior or Junior is assigned manually and decides the reward table.">
          <Select value={form.category} onChange={set('category')}><option value="">Unassigned</option><option>Senior</option><option>Junior</option></Select>
        </Field>
        <Field label="Phone (optional)"><Input value={form.phone} onChange={set('phone')} inputMode="tel" /></Field>
        <Field label="Daily target (৳)"><Input type="number" min="1" value={form.dailyTarget} onChange={set('dailyTarget')} placeholder="10000" /></Field>
        <Field label="Monthly target (৳)" hint="Leave blank to use daily target × 25."><Input type="number" min="0" value={form.monthlyTarget} onChange={set('monthlyTarget')} /></Field>
      </div>
    </Modal>
  );
}

function ImportModal({ open, onClose, onDone }) {
  const toast = useToast();
  const [parsed, setParsed] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setParsed(null); setResult(null); } }, [open]);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const rows = parseCsv(await f.text());
    e.target.value = '';
    if (rows.length < 2) { toast.error('The CSV has no employee rows'); return; }
    const h = rows[0].map((x) => x.toLowerCase());
    const idx = { name: h.findIndex((x) => x.includes('employee name') || x === 'name'), designation: h.findIndex((x) => x.includes('designation')), outlet: h.findIndex((x) => x === 'outlet'), monthlyTarget: h.findIndex((x) => x.includes('monthly')), dailyTarget: h.findIndex((x) => x.includes('daily')), category: h.findIndex((x) => x === 'category') };
    if ([idx.name, idx.outlet, idx.dailyTarget].some((i) => i < 0)) { toast.error('Missing required columns. Download the template to see the format.'); return; }
    setParsed(rows.slice(1).map((r) => ({ name: r[idx.name], designation: idx.designation >= 0 ? r[idx.designation] : '', outlet: r[idx.outlet], monthlyTarget: idx.monthlyTarget >= 0 ? r[idx.monthlyTarget] : '', dailyTarget: r[idx.dailyTarget], category: idx.category >= 0 ? r[idx.category] : '' })));
  };

  const run = async () => {
    setBusy(true);
    try { setResult(await api('/employees/import', { method: 'POST', body: { rows: parsed } })); onDone(); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Import employees from CSV" subtitle="Required columns: Employee Name, Outlet, Daily Target. Category is never guessed."
      footer={result ? <Button variant="primary" onClick={onClose}>Done</Button> : <><Button onClick={() => downloadText('dx-pharma-employee-import-template.csv', TEMPLATE)}><Download size={15} /> Template</Button><Button variant="primary" loading={busy} disabled={!parsed} onClick={run}>Import {parsed ? parsed.length : ''} row{parsed?.length === 1 ? '' : 's'}</Button></>}>
      {result ? (
        <div className="space-y-3 text-sm">
          <p className="text-emerald-300">{result.added} employee{result.added === 1 ? '' : 's'} added.</p>
          {result.skipped.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
              <div className="mb-1 font-semibold text-white">{result.skipped.length} skipped</div>
              <ul className="max-h-48 list-disc space-y-0.5 overflow-y-auto pl-5">{result.skipped.map((s, i) => <li key={i}>Row {s.line}{s.name ? ` (${s.name})` : ''}: {s.reason}</li>)}</ul>
            </div>
          )}
        </div>
      ) : !parsed ? (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-ink-500 bg-ink-900/50 px-4 py-10 text-center hover:border-brand-500/60">
          <Upload size={24} className="text-brand-400" />
          <span className="text-sm font-medium text-white">Choose a CSV file</span>
          <span className="text-xs text-slate-400">Outlet names must match an existing outlet. Duplicates are skipped.</span>
          <input type="file" accept=".csv,text/csv" hidden onChange={onFile} />
        </label>
      ) : (
        <div>
          <p className="mb-3 text-xs text-slate-400">Preview of the first 5 rows. Review before importing.</p>
          <TableWrap className="rounded-xl border border-ink-600/60">
            <table className="w-full min-w-[520px]"><thead><tr>{['Name', 'Outlet', 'Daily target', 'Category'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>{parsed.slice(0, 5).map((r, i) => <tr key={i}><td className="td">{r.name}</td><td className="td">{r.outlet}</td><td className="td">{r.dailyTarget}</td><td className="td">{r.category || 'Unassigned'}</td></tr>)}</tbody></table>
          </TableWrap>
        </div>
      )}
    </Modal>
  );
}

export default function EmployeesPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [outlet, setOutlet] = useState('All');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('active');
  const [form, setForm] = useState({ open: false, employee: null });
  const [importing, setImporting] = useState(false);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { const p = new URLSearchParams(window.location.search).get('q'); if (p) setQ(p); }, []);

  const outlets = useApi('/outlets');
  const { data, loading, error, reload } = useApi('/employees', { q, outlet: outlet === 'All' ? undefined : outlet, category: category === 'All' ? undefined : category, status });
  const activeOutlets = (outlets.data || []).filter((o) => o.isActive);

  const setCat = async (e, value) => {
    try { await api(`/employees/${e._id}`, { method: 'PUT', body: { category: value } }); toast.success(value ? `${e.name}: category set to ${value}` : `${e.name}: category unassigned`); reload(); }
    catch (err) { toast.error(err.message); }
  };
  const restore = async (e) => {
    try { await api(`/employees/${e._id}`, { method: 'PUT', body: { isActive: true } }); toast.success(`${e.name} restored`); reload(); }
    catch (err) { toast.error(err.message); }
  };
  const remove = async () => {
    setBusy(true);
    try { const r = await api(`/employees/${del._id}`, { method: 'DELETE' }); toast.success(r.message); setDel(null); reload(); outlets.reload(); }
    catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Employee directory" subtitle="Admin assigns Senior or Junior manually. Designation and system access role are separate."
        actions={can.canManageEmployees && <>
          <Button onClick={() => downloadText('dx-pharma-employee-import-template.csv', TEMPLATE)}><Download size={15} /> CSV template</Button>
          <Button onClick={() => setImporting(true)}><Upload size={15} /> Import CSV</Button>
          <Button variant="primary" onClick={() => setForm({ open: true, employee: null })}><Plus size={16} /> Add employee</Button>
        </>} />
      <Notice tone="amber" title="Salary is not stored or shown.">CSV import accepts name, designation, outlet, monthly target, daily target and an optional category. Review imported records before using them in real operations.</Notice>
      {!can.canManageEmployees && <Notice tone="blue" title="View only.">Managers can look at the directory but can&apos;t add, edit or delete employees.</Notice>}

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative"><Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search employees…" className="pl-10" aria-label="Search employees" /></div>
        <OutletSelect value={outlet} onChange={setOutlet} className="lg:!w-44" />
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="lg:!w-44" aria-label="Category"><option value="All">All categories</option><option>Senior</option><option>Junior</option><option>Unassigned</option></Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="lg:!w-36" aria-label="Status"><option value="active">Active</option><option value="archived">Archived</option><option value="all">All</option></Select>
      </div>

      {error && !data && <ErrorBox message={error} onRetry={reload} />}
      {!data && loading && <Skeleton className="h-96" />}
      {data && (
        <Card pad={false} className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4"><h3 className="text-sm font-semibold text-white">Employee master data</h3><Badge tone="gray">{data.length} record{data.length === 1 ? '' : 's'}</Badge></div>
          <TableWrap>
            <table className="w-full min-w-[920px]">
              <thead><tr>{['Employee', 'Designation', 'Outlet', 'Category', 'Daily target', 'Monthly target', ...(can.canManageEmployees ? ['Actions'] : [])].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {data.map((e) => (
                  <tr key={e._id} className="tr-hover">
                    <td className="td"><div className="flex items-center gap-2"><EmployeeCell id={e._id} name={e.name} avatar={e.avatar} />{!e.isActive && <Badge tone="gray">Archived</Badge>}</div></td>
                    <td className="td">{e.designation}</td>
                    <td className="td"><OutletLink id={e.outlet?._id} name={e.outlet?.name} /></td>
                    <td className="td">
                      {can.canManageEmployees && e.isActive ? (
                        <Select value={e.category} onChange={(ev) => setCat(e, ev.target.value)} className="!w-36 !py-1.5 !text-xs" aria-label={`Category for ${e.name}`}><option value="">Assign category</option><option>Senior</option><option>Junior</option></Select>
                      ) : <Badge tone={e.category === 'Senior' ? 'amber' : e.category === 'Junior' ? 'blue' : 'gray'}>{e.category || 'Unassigned'}</Badge>}
                    </td>
                    <td className="td">{money(e.dailyTarget)}</td>
                    <td className="td">{money(e.monthlyTarget)}</td>
                    {can.canManageEmployees && (
                      <td className="td">
                        <div className="flex gap-1.5">
                          {e.isActive ? (
                            <>
                              <Button size="icon" variant="ghost" aria-label={`Edit ${e.name}`} title="Edit" onClick={() => setForm({ open: true, employee: e })}><Pencil size={16} /></Button>
                              <Button size="icon" variant="ghost" aria-label={`Delete ${e.name}`} title="Delete" className="hover:!text-rose-300" onClick={() => setDel(e)}><Trash2 size={16} /></Button>
                            </>
                          ) : <Button size="sm" onClick={() => restore(e)}><RotateCcw size={14} /> Restore</Button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {!data.length && <tr><td colSpan={7}><EmptyState title="No employees match your filters" message={can.canManageEmployees ? 'Add an employee or import a CSV to get started.' : undefined} /></td></tr>}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      )}

      <EmployeeForm open={form.open} employee={form.employee} outlets={activeOutlets} onClose={() => setForm({ open: false, employee: null })} onSaved={() => { reload(); outlets.reload(); }} />
      <ImportModal open={importing} onClose={() => setImporting(false)} onDone={() => { reload(); outlets.reload(); }} />
      <ConfirmDialog open={!!del} title={`Delete ${del?.name}?`} confirmLabel="Delete" loading={busy} onClose={() => setDel(null)} onConfirm={remove}
        message="If this employee has sales history they are archived instead, so past rankings and incentives stay accurate. Employees with no history are deleted permanently." />
    </div>
  );
}