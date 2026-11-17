import { parseTable } from './bulkEmployees';

export { parseTable };

export const SALES_COLUMNS = [
  { key: 'employee', label: 'Employee Name', aliases: ['employee name', 'employee', 'name', 'salesperson'] },
  { key: 'date', label: 'Date', aliases: ['date', 'sales date'] },
  { key: 'outlet', label: 'Outlet', aliases: ['outlet', 'branch', 'store'] },
  { key: 'category', label: 'Category', aliases: ['category', 'level', 'grade'] },
  { key: 'sales', label: 'Daily Sales', aliases: ['daily sales', 'sales', 'actual sales', 'amount', 'net sales'] },
];

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
let seq = 0;

/**
 * Maps a table to rows. With a header row the columns are found by name. Without one the order is
 * Employee Name, Date, Outlet, Daily Sales (4 columns) or Employee Name, Date, Outlet, Category, Daily Sales (5 columns).
 */
export function tableToSalesRows(table) {
  if (!table.length) return { rows: [], header: false };
  const head = table[0].map(norm);
  const idx = {};
  SALES_COLUMNS.forEach((c) => { const i = head.findIndex((h) => c.aliases.includes(h)); if (i >= 0) idx[c.key] = i; });
  const header = idx.employee !== undefined && idx.sales !== undefined;
  let body = table;
  if (header) body = table.slice(1);
  else {
    const order = (table[0].length >= 5 ? ['employee', 'date', 'outlet', 'category', 'sales'] : ['employee', 'date', 'outlet', 'sales']);
    order.forEach((k, i) => { idx[k] = i; });
  }
  const get = (r, k) => (idx[k] !== undefined ? String(r[idx[k]] ?? '').trim() : '');
  const rows = body
    .filter((r) => r.some((c) => String(c).trim() !== ''))
    .map((r) => ({
      key: `s${Date.now().toString(36)}${seq++}`,
      employee: get(r, 'employee'),
      date: get(r, 'date').replace(/^(\d{4}-\d{2}-\d{2})[ T].*$/, '$1'), // Excel often adds a time
      outlet: get(r, 'outlet'),
      category: get(r, 'category'),
      sales: get(r, 'sales').replace(/[৳,\s]/g, ''),
    }));
  return { rows, header };
}

const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
export const toCsv = (lines) => lines.map((l) => l.map(esc).join(',')).join('\r\n');

/** Template: every employee of the chosen outlet for the chosen date, sales left blank. */
export function salesTemplateCsv(employees, outletName, date) {
  const head = ['Employee Name', 'Date', 'Outlet', 'Category', 'Daily Sales'];
  const lines = employees.length ? employees.map((e) => [e.name, date, outletName, e.category || '', '']) : [['Example Employee', date, outletName, 'Junior', '10000']];
  return toCsv([head, ...lines]);
}