'use client';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', tone = 'danger', loading, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-300">{message}</p>
    </Modal>
  );
}
