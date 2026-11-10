'use client';
import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

/**
 * Confirmation for actions that cannot be undone: the admin must type `word` and (optionally) re-enter their password.
 * onConfirm receives { confirm, password }.
 */
export default function DangerDialog({ open, title, children, word, needPassword = true, confirmLabel = 'Confirm', loading, onConfirm, onClose }) {
  const [typed, setTyped] = useState('');
  const [password, setPassword] = useState('');
  useEffect(() => { if (open) { setTyped(''); setPassword(''); } }, [open]);
  const ok = typed === word && (!needPassword || password.length > 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={<><Button onClick={onClose} disabled={loading}>Cancel</Button><Button variant="danger" loading={loading} disabled={!ok} onClick={() => onConfirm({ confirm: typed, password })}>{confirmLabel}</Button></>}
    >
      <div className="mb-4 flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-100/90">
        <TriangleAlert size={16} className="mt-0.5 shrink-0 text-rose-400" />
        <div>{children}</div>
      </div>
      <div className="space-y-4">
        <Field label={`Type ${word} to confirm`}><Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={word} autoComplete="off" spellCheck={false} autoFocus /></Field>
        {needPassword && <Field label="Your admin password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>}
      </div>
    </Modal>
  );
}