import { parseCsv } from './csv';

export const COLUMNS = [
  { key: 'name', label: 'Employee Name', aliases: ['employee name', 'name', 'full name', 'employee'] },
  { key: 'designation', label: 'Designation', aliases: ['designation', 'title', 'position', 'role'] },
  { key: 'outlet', label: 'Outlet', aliases: ['outlet', 'branch', 'store', 'shop'] },
  { key: 'category', label: 'Category', aliases: ['category', 'level', 'grade'] },
  { key: 'dailyTarget', label: 'Daily Target', aliases: ['daily target', 'daily', 'target per day'] },
  { key: 'monthlyTarget', label: 'Monthly Target', aliases: ['monthly target', 'monthly'] },
  { key: 'phone', label: 'Phone', aliases: ['phone', 'mobile', 'contact', 'phone number'] },
  { key: 'status', label: 'Status', aliases: ['status', 'state'] },
];

let seq = 0;
export const newKey = () => `r${Date.now().toString(36)}${seq++}`;
export const emptyRow = (over = {}) => ({ key: newKey(), name: '', designation: '', outlet: '', category: '', dailyTarget: '', monthlyTarget: '', phone: '', status: 'Active', ...over });

/** A row with nothing typed in it (status alone does not count). */
export const isBlank = (r) => !['name', 'designation', 'outlet', 'category', 'dailyTarget', 'monthlyTarget', 'phone'].some((k) => String(r[k] ?? '').trim() !== '');

/** Splits pasted / uploaded text into a table. Tab-separated (Excel, Google Sheets) or comma-separated. */
export function parseTable(text) {
  const t = String(text || '').replace(/^\uFEFF/, '').trim();
  if (!t) return [];
  const lines = t.split(/\r?\n/);
  if (lines[0].includes('\t')) return lines.filter((l) => l.trim()).map((l) => l.split('\t').map((c) => c.trim()));
  return parseCsv(t);
}

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();

/** Maps a table (with or without a header row) to grid rows. Unknown outlets are kept as typed so they can be fixed. */
export function tableToRows(table, outlets) {
  if (!table.length) return { rows: [], header: false };
  const head = table[0].map(norm);
  const idx = {};
  COLUMNS.forEach((c) => { const i = head.findIndex((h) => c.aliases.includes(h)); if (i >= 0) idx[c.key] = i; });
  const header = idx.name !== undefined && Object.keys(idx).length >= 2;
  let body = table;
  if (header) body = table.slice(1);
  else COLUMNS.forEach((c, i) => { idx[c.key] = i; });

  const byName = new Map(outlets.map((o) => [o.name.toLowerCase(), o.name]));
  const get = (r, k) => (idx[k] !== undefined ? String(r[idx[k]] ?? '').trim() : '');
  const money = (v) => v.replace(/[৳,\s]/g, '');

  const rows = body
    .filter((r) => r.some((c) => String(c).trim() !== ''))
    .map((r) => {
      const outletRaw = get(r, 'outlet');
      const cat = get(r, 'category');
      return emptyRow({
        name: get(r, 'name'),
        designation: get(r, 'designation'),
        outlet: byName.get(outletRaw.toLowerCase()) || outletRaw,
        category: /^senior$/i.test(cat) ? 'Senior' : /^junior$/i.test(cat) ? 'Junior' : cat,
        dailyTarget: money(get(r, 'dailyTarget')),
        monthlyTarget: money(get(r, 'monthlyTarget')),
        phone: get(r, 'phone'),
        status: /^(archived|inactive|no|false)$/i.test(get(r, 'status')) ? 'Archived' : 'Active',
      });
    });
  return { rows, header };
}

const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
export const rowsToCsv = (rows, extra = []) => [[...COLUMNS.map((c) => c.label), ...extra.map((e) => e.label)], ...rows.map((r) => [...COLUMNS.map((c) => r[c.key]), ...extra.map((e) => e.get(r))])].map((line) => line.map(esc).join(',')).join('\r\n');

export const templateCsv = (outletName = 'Panthapath') =>
  rowsToCsv([
    emptyRow({ name: 'Example Employee', designation: 'Sales Executive', outlet: outletName, category: 'Junior', dailyTarget: '10000', monthlyTarget: '250000', phone: '01700000000' }),
    emptyRow({ name: 'Another Employee', designation: 'Senior Sales Executive', outlet: outletName, category: 'Senior', dailyTarget: '12000', monthlyTarget: '', phone: '' }),
  ]);