'use client';
import { useApi } from '@/hooks/useApi';
import { Select } from './Field';

export default function OutletSelect({ value, onChange, includeAll = true, allLabel = 'All outlets', className }) {
  const { data } = useApi('/outlets');
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className={className} aria-label="Outlet">
      {includeAll && <option value="All">{allLabel}</option>}
      {(data || []).filter((o) => o.isActive).map((o) => (
        <option key={o._id} value={o._id}>{o.name}</option>
      ))}
    </Select>
  );
}
