'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays, ChevronDown, KeyRound, LogOut, Menu, Search } from 'lucide-react';
import { TITLES } from './nav';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { longDate } from '@/lib/format';
import { todayISO } from '@/lib/dates';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

function PasswordModal({ open, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api('/auth/password', { method: 'PUT', body: form });
      toast.success('Password updated');
      setForm({ currentPassword: '', newPassword: '' });
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Change password" size="sm" footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={submit}>Update password</Button></>}>
      <div className="space-y-4">
        <Field label="Current password"><Input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} autoComplete="current-password" /></Field>
        <Field label="New password" hint="At least 6 characters"><Input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} autoComplete="new-password" /></Field>
      </div>
    </Modal>
  );
}

export default function Topbar({ onMenu }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const [pw, setPw] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  const title = TITLES[Object.keys(TITLES).find((k) => pathname === k || pathname.startsWith(k + '/'))] || 'Overview';

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-600/60 bg-ink-950/75 px-4 backdrop-blur-xl sm:px-6">
      <button onClick={onMenu} className="rounded-xl border border-ink-600 p-2 text-slate-300 hover:bg-white/5 lg:hidden" aria-label="Open menu"><Menu size={19} /></button>
      <div className="hidden min-w-0 text-sm text-slate-500 sm:block">
        DX Pharma Arena <span className="mx-1 text-ink-500">/</span> <span className="font-medium text-slate-200">{title}</span>
      </div>
      <div className="min-w-0 truncate text-sm font-semibold text-white sm:hidden">{title}</div>

      <form
        onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/employees?q=${encodeURIComponent(q.trim())}`); }}
        className="relative ml-auto hidden w-full max-w-sm md:block"
      >
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search employees…" className="input !rounded-full !bg-ink-800/80 !py-2 pl-10" aria-label="Search employees" />
      </form>

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <span className="hidden items-center gap-2 rounded-full border border-ink-600 bg-ink-800/70 px-3 py-1.5 text-xs text-slate-300 xl:flex">
          <CalendarDays size={14} className="text-brand-400" /> {longDate(todayISO())}
        </span>
        <div className="relative" ref={ref}>
          <button onClick={() => setMenu((v) => !v)} className="flex items-center gap-2 rounded-full border border-ink-600 bg-ink-800/70 py-1 pl-1 pr-2.5 hover:border-brand-500/50" aria-haspopup="menu" aria-expanded={menu}>
            <Avatar name={user?.name} size={30} className="!rounded-full" />
            <span className="hidden text-xs font-medium text-slate-200 sm:block">{user?.name}</span>
            <ChevronDown size={14} className="text-slate-500" />
          </button>
          {menu && (
            <div className="card absolute right-0 mt-2 w-60 p-2" role="menu">
              <div className="px-3 py-2">
                <div className="truncate text-sm font-semibold text-white">{user?.name}</div>
                <div className="truncate text-xs text-slate-400">{user?.email}</div>
                <Badge tone={user?.role === 'admin' ? 'blue' : 'violet'} className="mt-2 capitalize">{user?.role}</Badge>
              </div>
              <hr className="my-1 border-ink-600/60" />
              <button onClick={() => { setMenu(false); setPw(true); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5" role="menuitem"><KeyRound size={15} /> Change password</button>
              <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10" role="menuitem"><LogOut size={15} /> Sign out</button>
            </div>
          )}
        </div>
      </div>
      <PasswordModal open={pw} onClose={() => setPw(false)} />
    </header>
  );
}
