'use client';
import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Notice from '@/components/ui/Notice';
import PageHeader from '@/components/ui/PageHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Field, Input, Select } from '@/components/ui/Field';
import { EmptyState, ErrorBox, Skeleton } from '@/components/ui/States';
import { TableWrap } from '@/components/shared/cells';

const EMPTY = { name: '', email: '', password: '', role: 'manager', isActive: true };

function UserForm({ open, onClose, user, isSelf, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const editing = !!user;

  useEffect(() => { if (open) setForm(user ? { name: user.name, email: user.email, password: '', role: user.role, isActive: user.isActive } : EMPTY); }, [open, user]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: k === 'isActive' ? e.target.value === 'true' : e.target.value }));

  const save = async () => {
    setBusy(true);
    try {
      const body = { ...form };
      if (editing && !body.password) delete body.password;
      if (editing) await api(`/users/${user._id}`, { method: 'PUT', body });
      else await api('/users', { method: 'POST', body });
      toast.success(editing ? 'User updated' : 'User created');
      onSaved();
      onClose();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit user' : 'Add user'} subtitle="Admins can do everything. Managers can only view and export."
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>{editing ? 'Save changes' : 'Create user'}</Button></>}>
      <div className="grid grid-cols-1 gap-4">
        <Field label="Full name"><Input value={form.name} onChange={set('name')} autoFocus /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} autoComplete="off" /></Field>
        <Field label={editing ? 'New password' : 'Password'} hint={editing ? 'Leave blank to keep the current password.' : 'At least 6 characters.'}><Input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Role"><Select value={form.role} onChange={set('role')} disabled={isSelf}><option value="manager">Manager (read-only)</option><option value="admin">Admin (full access)</option></Select></Field>
          <Field label="Status"><Select value={String(form.isActive)} onChange={set('isActive')} disabled={isSelf}><option value="true">Active</option><option value="false">Disabled</option></Select></Field>
        </div>
      </div>
    </Modal>
  );
}

export default function UsersPage() {
  const { user: me, can } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useApi('/users', undefined, { enabled: !!can.canManageUsers });
  const [form, setForm] = useState({ open: false, user: null });
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!can.canManageUsers) return <EmptyState title="Admins only" message="Only an admin can manage users and access." />;

  const remove = async () => {
    setBusy(true);
    try { await api(`/users/${del._id}`, { method: 'DELETE' }); toast.success('User deleted'); setDel(null); reload(); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Users & access" subtitle="Create admin and manager accounts. Managers have read-only access to every section."
        actions={<Button variant="primary" onClick={() => setForm({ open: true, user: null })}><Plus size={16} /> Add user</Button>} />
      <Notice tone="blue" title="Roles:">Admin can create, edit, delete, finalize sales and approve incentives. Manager can view dashboards, reports and export CSV, but cannot create or delete anything.</Notice>

      {error && !data && <ErrorBox message={error} onRetry={reload} />}
      {!data && loading && <Skeleton className="h-72" />}
      {data && (
        <Card pad={false} className="overflow-hidden">
          <TableWrap>
            <table className="w-full min-w-[760px]">
              <thead><tr>{['User', 'Role', 'Status', 'Last sign-in', 'Actions'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u._id} className="tr-hover">
                    <td className="td"><div className="flex items-center gap-3"><Avatar name={u.name} size={34} /><div><div className="font-semibold text-white">{u.name}{u._id === me._id && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}</div><div className="text-xs text-slate-500">{u.email}</div></div></div></td>
                    <td className="td"><Badge tone={u.role === 'admin' ? 'blue' : 'violet'} className="capitalize">{u.role}</Badge></td>
                    <td className="td"><Badge tone={u.isActive ? 'green' : 'gray'}>{u.isActive ? 'Active' : 'Disabled'}</Badge></td>
                    <td className="td text-slate-400">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never'}</td>
                    <td className="td">
                      <div className="flex gap-1.5">
                        <Button size="icon" variant="ghost" aria-label={`Edit ${u.name}`} onClick={() => setForm({ open: true, user: u })}><Pencil size={16} /></Button>
                        {u._id !== me._id && <Button size="icon" variant="ghost" aria-label={`Delete ${u.name}`} className="hover:!text-rose-300" onClick={() => setDel(u)}><Trash2 size={16} /></Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      )}

      <UserForm open={form.open} user={form.user} isSelf={form.user?._id === me._id} onClose={() => setForm({ open: false, user: null })} onSaved={reload} />
      <ConfirmDialog open={!!del} title={`Delete ${del?.name}?`} confirmLabel="Delete user" loading={busy} onClose={() => setDel(null)} onConfirm={remove} message="This account will no longer be able to sign in. To keep the account but block access, disable it instead." />
    </div>
  );
}
