'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { newKey } from '@/lib/bulkEmployees';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Progress from '@/components/ui/Progress';
import Notice from '@/components/ui/Notice';
import { Select } from '@/components/ui/Field';
import { TableWrap } from '@/components/shared/cells';

const OK_TYPE = /^image\/(jpe?g|png|webp)$/;
const MAX = 3 * 1024 * 1024;
const norm = (s) => String(s).toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim();
const kb = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

const STATE = { ready: ['blue', 'Ready'], uploading: ['amber', 'Uploading…'], done: ['green', 'Uploaded'], failed: ['red', 'Failed'], invalid: ['red', 'Not allowed'] };

/** Upload many photos at once. Files are matched to employees by file name (e.g. "Ayesha Rahman.jpg" or "ayesha_rahman.png"). */
export default function BulkPhotos() {
  const toast = useToast();
  const { data: employees, reload } = useApi('/employees', { status: 'active' });
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);
  const urls = useRef(new Set());

  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const byName = useMemo(() => {
    const m = new Map();
    (employees || []).forEach((e) => { const k = norm(e.name); m.set(k, [...(m.get(k) || []), e]); });
    return m;
  }, [employees]);

  const add = (fileList) => {
    const next = Array.from(fileList).map((file) => {
      let state = 'ready';
      let error = '';
      if (!OK_TYPE.test(file.type)) { state = 'invalid'; error = 'Use JPG, PNG or WEBP'; }
      else if (file.size > MAX) { state = 'invalid'; error = 'Larger than 3 MB'; }
      const url = URL.createObjectURL(file);
      urls.current.add(url);
      const hit = byName.get(norm(file.name));
      return { key: newKey(), file, url, state, error, empId: hit?.length === 1 ? hit[0]._id : '', hint: hit?.length > 1 ? 'Several employees share this name. Pick one.' : '' };
    });
    setItems((cur) => [...cur, ...next]);
  };

  const setEmp = (key, empId) => setItems((cur) => cur.map((i) => (i.key === key ? { ...i, empId } : i)));
  const remove = (key) => setItems((cur) => { const it = cur.find((i) => i.key === key); if (it) { URL.revokeObjectURL(it.url); urls.current.delete(it.url); } return cur.filter((i) => i.key !== key); });
  const patch = (key, p) => setItems((cur) => cur.map((i) => (i.key === key ? { ...i, ...p } : i)));

  const sendable = items.filter((i) => i.state === 'ready' && i.empId);
  const used = new Map();
  items.forEach((i) => { if (i.empId && i.state !== 'invalid') used.set(i.empId, (used.get(i.empId) || 0) + 1); });
  const finished = items.filter((i) => i.state === 'done' || i.state === 'failed').length;

  const upload = async () => {
    setBusy(true);
    const queue = [...sendable];
    let ok = 0;
    let fail = 0;
    const worker = async () => {
      while (queue.length) {
        const it = queue.shift();
        patch(it.key, { state: 'uploading', error: '' });
        try {
          const fd = new FormData();
          fd.append('avatar', it.file);
          await api(`/employees/${it.empId}/avatar`, { method: 'POST', formData: fd });
          patch(it.key, { state: 'done' });
          ok += 1;
        } catch (e) {
          patch(it.key, { state: 'failed', error: e.message });
          fail += 1;
        }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    setBusy(false);
    reload();
    if (fail) toast.error(`${ok} photo${ok === 1 ? '' : 's'} uploaded, ${fail} failed. See the table for reasons.`);
    else toast.success(`${ok} photo${ok === 1 ? '' : 's'} uploaded`);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Bulk photos" subtitle="Drop many photos at once. Each file is matched to an employee by its file name, and you can change any match." />
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-10 text-center transition ${drag ? 'border-brand-400 bg-brand-500/10' : 'border-ink-500 bg-ink-900/50 hover:border-brand-500/60'}`}
        >
          <ImagePlus size={26} className="text-brand-400" />
          <span className="text-sm font-medium text-white">Drop photos here or click to choose</span>
          <span className="text-xs text-slate-400">JPG, PNG or WEBP up to 3 MB each. Name files like “Ayesha Rahman.jpg”. Portrait photos work best.</span>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
        </label>
        <Notice tone="blue" className="!mb-0 mt-4">A photo replaces the employee&apos;s current one. Photos need Cloudinary to be set up on the server.</Notice>
      </Card>

      {items.length > 0 && (
        <Card pad={false} className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div><h3 className="text-sm font-semibold text-white">{items.length} photo{items.length === 1 ? '' : 's'}</h3><p className="mt-1 text-xs text-slate-400">{sendable.length} matched and ready · {items.filter((i) => i.state === 'ready' && !i.empId).length} need an employee picked</p></div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => { items.forEach((i) => URL.revokeObjectURL(i.url)); urls.current.clear(); setItems([]); }} disabled={busy}>Clear</Button>
              <Button variant="primary" onClick={upload} loading={busy} disabled={!sendable.length}><Upload size={15} /> Upload {sendable.length} photo{sendable.length === 1 ? '' : 's'}</Button>
            </div>
          </div>
          {busy && <div className="px-5 pb-3"><Progress value={(finished / Math.max(1, items.filter((i) => i.state !== 'invalid').length)) * 100} height={6} /></div>}
          <TableWrap>
            <table className="w-full min-w-[760px]">
              <thead><tr>{['Photo', 'File', 'Employee', 'Status', ''].map((h, i) => <th key={i} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.key} className="tr-hover">
                    <td className="td">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={i.url} alt="" className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/10" /></td>
                    <td className="td"><div className="max-w-[220px] truncate font-medium text-white" title={i.file.name}>{i.file.name}</div><div className="text-xs text-slate-500">{kb(i.file.size)}</div></td>
                    <td className="td">
                      <Select value={i.empId} onChange={(e) => setEmp(i.key, e.target.value)} disabled={i.state === 'uploading' || i.state === 'done' || i.state === 'invalid'} className="!w-64 !py-1.5 !text-xs" aria-label={`Employee for ${i.file.name}`}>
                        <option value="">Pick employee…</option>
                        {(employees || []).map((e) => <option key={e._id} value={e._id}>{e.name} · {e.outlet?.name}</option>)}
                      </Select>
                      {i.hint && <div className="mt-1 text-[11px] text-amber-300">{i.hint}</div>}
                      {i.empId && used.get(i.empId) > 1 && <div className="mt-1 text-[11px] text-amber-300">Two photos picked for this employee. The last upload wins.</div>}
                    </td>
                    <td className="td"><Badge tone={STATE[i.state][0]}>{STATE[i.state][1]}</Badge>{i.error && <div className="mt-1 max-w-[220px] whitespace-normal text-[11px] text-rose-300">{i.error}</div>}</td>
                    <td className="td"><Button size="icon" variant="ghost" className="hover:!text-rose-300" aria-label={`Remove ${i.file.name}`} disabled={i.state === 'uploading'} onClick={() => remove(i.key)}><Trash2 size={15} /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      )}
    </div>
  );
}