/** Small RFC-4180 style CSV parser (handles quotes and commas inside quotes). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let q = false;
  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"' && src[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur.trim()); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cur.trim());
      if (row.some((v) => v !== '')) rows.push(row);
      row = []; cur = '';
    } else cur += c;
  }
  row.push(cur.trim());
  if (row.some((v) => v !== '')) rows.push(row);
  return rows;
}

export function downloadText(name, content, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob(['\ufeff' + content], { type: `${type};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
