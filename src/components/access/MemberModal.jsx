"use client";
import { useEffect, useState } from "react";
import { Check, Crown, ShieldCheck, Eye } from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/api";
import { PAGE_LABEL, summarizeAccess } from "@/lib/access";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

const EMPTY = {
  name: "",
  email: "",
  password: "",
  roleId: "",
  isActive: true,
  managerIncentiveAccess: false,
};

function RoleChoice({ on, icon: Icon, title, text, onClick, tone }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={clsx(
        "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition",
        on
          ? "border-brand-400/80 bg-brand-500/10"
          : "border-ink-600 bg-ink-900/40 hover:border-brand-500/50",
      )}
    >
      <span
        className={clsx(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
          tone,
        )}
      >
        <Icon size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-white">{title}</span>
        <span className="block truncate text-xs text-slate-400">{text}</span>
      </span>
      <span
        className={clsx(
          "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
          on ? "border-brand-400 bg-brand-500 text-onaccent" : "border-ink-500",
        )}
      >
        {on && <Check size={12} strokeWidth={3} />}
      </span>
    </button>
  );
}

/** Create or edit a member and choose their role. */
export default function MemberModal({
  open,
  onClose,
  user,
  roles,
  isSelf,
  onSaved,
}) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const editing = !!user;

  useEffect(() => {
    if (!open) return;
    setForm(
      user
        ? {
            name: user.name,
            email: user.email,
            password: "",
            roleId:
              user.role === "admin"
                ? "admin"
                : user.customRole?._id || user.customRole?.id || "manager",
            isActive: user.isActive,
            managerIncentiveAccess: !!user.managerIncentiveAccess,
          }
        : { ...EMPTY, roleId: roles[0]?.id || "manager" },
    );
  }, [open, user, roles]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const picked = roles.find((r) => r.id === form.roleId);

  const save = async () => {
    setBusy(true);
    try {
      const body = {
        name: form.name,
        email: form.email,
        roleId: form.roleId,
        isActive: form.isActive,
        managerIncentiveAccess:
          form.roleId === "manager" && form.managerIncentiveAccess,
      };
      if (form.password) body.password = form.password;
      if (editing) await api(`/users/${user._id}`, { method: "PUT", body });
      else await api("/users", { method: "POST", body });
      toast.success(editing ? "Member updated" : "Member added");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const access = picked ? summarizeAccess(picked) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? "Edit member" : "Add member"}
      subtitle="Their role decides which pages they can open and what they can change."
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={busy}
            onClick={save}
            disabled={
              !form.name.trim() ||
              !form.email.trim() ||
              (!editing && form.password.length < 8)
            }
          >
            {editing ? "Save changes" : "Add member"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <Input value={form.name} onChange={set("name")} autoFocus />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={set("email")}
            autoComplete="off"
          />
        </Field>
        <Field
          label={editing ? "New password" : "Password"}
          hint={
            editing
              ? "Leave blank to keep the current password."
              : "At least 8 characters."
          }
        >
          <Input
            type="password"
            value={form.password}
            onChange={set("password")}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Status">
          <Select
            value={String(form.isActive)}
            onChange={(e) =>
              setForm((f) => ({ ...f, isActive: e.target.value === "true" }))
            }
            disabled={isSelf}
          >
            <option value="true">Active</option>
            <option value="false">Disabled (cannot sign in)</option>
          </Select>
        </Field>
      </div>

      <div className="mt-6">
        <div className="mb-2 text-xs font-medium text-slate-400">Role</div>
        <div className="space-y-2" role="radiogroup" aria-label="Role">
          <RoleChoice
            on={form.roleId === "admin"}
            icon={Crown}
            tone="bg-amber-400/15 text-amber-300"
            title="Admin"
            text="Full access to everything, including users and roles"
            onClick={() =>
              !isSelf && setForm((f) => ({ ...f, roleId: "admin" }))
            }
          />
          {roles.map((r) => {
            const s = summarizeAccess(r);
            return (
              <RoleChoice
                key={r.id}
                on={form.roleId === r.id}
                icon={ShieldCheck}
                tone="bg-brand-500/15 text-brand-300"
                title={r.name}
                text={`${s.pageCount} pages · ${s.readOnly ? "read-only" : s.flags.join(", ")}`}
                onClick={() =>
                  !isSelf && setForm((f) => ({ ...f, roleId: r.id }))
                }
              />
            );
          })}
          <RoleChoice
            on={form.roleId === "manager"}
            icon={Eye}
            tone="bg-violet-500/15 text-violet-300"
            title="Manager (built-in, read-only)"
            text="Can view dashboards and reports. Cannot create, edit or delete anything"
            onClick={() =>
              !isSelf && setForm((f) => ({ ...f, roleId: "manager" }))
            }
          />
        </div>
        {isSelf && (
          <p className="mt-2 text-xs text-slate-500">
            You can&apos;t change your own role or disable your own account.
          </p>
        )}
        {!roles.length && (
          <p className="mt-2 text-xs text-slate-500">
            Create a custom role first if you want finer control than Admin or
            read-only Manager.
          </p>
        )}
      </div>

      {picked && (
        <div className="mt-4 rounded-xl border border-ink-600/60 bg-ink-900/50 p-3.5">
          <div className="text-xs font-semibold text-slate-300">
            This member can open
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {picked.pages.map((k) => (
              <span
                key={k}
                className="rounded-full bg-ink-700 px-2.5 py-1 text-[11px] text-slate-300"
              >
                {PAGE_LABEL[k]}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {access.readOnly
              ? "Read-only: cannot change anything."
              : `Can change: ${access.flags.join(" · ")}.`}
          </p>
        </div>
      )}

      {form.roleId === "manager" && (
        <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-ink-600/60 bg-ink-900/50 p-3 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={form.managerIncentiveAccess}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                managerIncentiveAccess: e.target.checked,
              }))
            }
            className="mt-0.5 h-4 w-4 accent-brand-500"
          />
          <span>
            <strong className="text-white">Can open Manager Incentive.</strong>{" "}
            Lets this read-only manager see the confidential monthly manager
            incentive page. With a custom role, tick the page in the role
            instead.
          </span>
        </label>
      )}
    </Modal>
  );
}
