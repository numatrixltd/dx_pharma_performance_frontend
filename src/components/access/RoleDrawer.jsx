"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, X } from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/api";
import {
  ACTIONS,
  ALL_PAGES,
  PAGE_GROUPS,
  PAGE_LABEL,
  TEMPLATES,
  normalizeAccess,
} from "@/lib/access";
import { NAV } from "@/components/layout/nav";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/ui/Button";
import Switch from "@/components/ui/Switch";
import { Field, Input, Select } from "@/components/ui/Field";

const ICONS = Object.fromEntries(
  NAV.flatMap((g) => g.items).map((i) => [i.page, i.icon]),
);
const EMPTY = normalizeAccess({});

function PageChip({ page, on, onClick }) {
  const Icon = ICONS[page.key];
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      className={clsx(
        "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
        on
          ? "border-brand-400/80 bg-brand-500/10"
          : "border-ink-600 bg-ink-900/40 hover:border-brand-500/50",
      )}
    >
      <span
        className={clsx(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition",
          on ? "bg-brand-500/20 text-brand-300" : "bg-ink-700 text-slate-400",
        )}
      >
        {Icon && <Icon size={16} />}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={clsx(
            "block truncate text-sm font-medium",
            on ? "text-white" : "text-slate-300",
          )}
        >
          {page.label}
        </span>
        {page.note && (
          <span className="block truncate text-[10px] text-slate-500">
            {page.note}
          </span>
        )}
      </span>
      <span
        className={clsx(
          "grid h-5 w-5 shrink-0 place-items-center rounded-full border transition",
          on ? "border-brand-400 bg-brand-500 text-onaccent" : "border-ink-500",
        )}
      >
        {on && <Check size={12} strokeWidth={3} />}
      </span>
    </button>
  );
}

/** Slide-over to create or edit a role: pages it can open + what it can change. */
export default function RoleDrawer({ open, role, onClose, onSaved }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [access, setAccess] = useState(EMPTY);
  const [notes, setNotes] = useState([]);
  const [tpl, setTpl] = useState("");
  const [busy, setBusy] = useState(false);
  const editing = !!role;

  useEffect(() => {
    if (!open) return;
    setName(role?.name || "");
    setDescription(role?.description || "");
    setAccess(role ? normalizeAccess(role) : EMPTY);
    setNotes([]);
    setTpl("");
  }, [open, role]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const apply = (next, extra = []) => {
    const n = normalizeAccess(next);
    setAccess(n);
    setNotes([...extra, ...n.notes]);
  };

  const togglePage = (k) =>
    apply({
      ...access,
      pages: access.pages.includes(k)
        ? access.pages.filter((p) => p !== k)
        : [...access.pages, k],
    });
  const setGroup = (group, on) =>
    apply({
      ...access,
      pages: on
        ? [...new Set([...access.pages, ...group.pages.map((p) => p.key)])]
        : access.pages.filter((p) => !group.pages.some((g) => g.key === p)),
    });

  const toggleAction = (key) => {
    const next = { ...access, [key]: !access[key] };
    const extra = [];
    if (
      key === "enterSales" &&
      !next.enterSales &&
      access.pages.includes("salesEntry")
    ) {
      next.pages = next.pages.filter((p) => p !== "salesEntry");
      extra.push(
        "Daily Sales Entry was unticked because it needs “Enter & edit daily sales”.",
      );
    }
    if (
      key === "manageSetup" &&
      !next.manageSetup &&
      access.pages.some((p) => p === "theme" || p === "adminSettings")
    ) {
      next.pages = next.pages.filter(
        (p) => p !== "theme" && p !== "adminSettings",
      );
      extra.push(
        "Theme & Colours and Admin Settings were unticked because they need “Manage setup”.",
      );
    }
    apply(next, extra);
  };

  const useTemplate = (id) => {
    const t = TEMPLATES.find((x) => x.id === id);
    setTpl("");
    if (t) {
      apply(t);
      if (!name.trim()) setName(t.name);
    }
  };

  const pageNames = access.pages.map((k) => PAGE_LABEL[k]);
  const flags = ACTIONS.filter((a) => access[a.key]).map((a) => a.title);
  const valid = name.trim().length >= 2 && access.pages.length > 0;

  const save = async () => {
    setBusy(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        pages: access.pages,
        enterSales: access.enterSales,
        approveIncentives: access.approveIncentives,
        manageSetup: access.manageSetup,
      };
      if (editing) await api(`/roles/${role.id}`, { method: "PUT", body });
      else await api("/roles", { method: "POST", body });
      toast.success(editing ? "Role saved" : "Role created");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[90]"
          role="dialog"
          aria-modal="true"
          aria-label={editing ? "Edit role" : "New role"}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-ink-600/70 bg-ink-900 shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-ink-600/60 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editing ? `Edit role · ${role.name}` : "New role"}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Dependent permissions are ticked for you. For example, opening
                  Daily Sales Entry needs “enter sales”.
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Role name">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Outlet Manager"
                    maxLength={40}
                    autoFocus
                  />
                </Field>
                <Field label="Start from a template">
                  <Select
                    value={tpl}
                    onChange={(e) => useTemplate(e.target.value)}
                  >
                    <option value="">— keep my choices —</option>
                    {TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Description (optional)" className="sm:col-span-2">
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Who is this role for?"
                    maxLength={140}
                  />
                </Field>
              </div>

              <section>
                <h3 className="text-sm font-semibold text-white">
                  Pages this role can open
                </h3>
                <div className="mt-4 space-y-5">
                  {PAGE_GROUPS.map((g) => {
                    const all = g.pages.every((p) =>
                      access.pages.includes(p.key),
                    );
                    return (
                      <div key={g.id}>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="text-xs font-semibold text-slate-300">
                            {g.title}{" "}
                            <span className="font-normal text-slate-500">
                              · {g.hint}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setGroup(g, !all)}
                            className="text-xs font-semibold text-brand-400 hover:text-brand-300"
                          >
                            {all ? "Clear" : "Select all"}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {g.pages.map((p) => (
                            <PageChip
                              key={p.key}
                              page={p}
                              on={access.pages.includes(p.key)}
                              onClick={() => togglePage(p.key)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-white">
                  What this role can change
                </h3>
                <div className="mt-3 divide-y divide-ink-600/50 rounded-2xl border border-ink-600/70 bg-ink-850/50">
                  {ACTIONS.map((a) => {
                    const forced =
                      a.key !== "manageSetup" && access.manageSetup;
                    return (
                      <div
                        key={a.key}
                        className="flex items-start justify-between gap-4 px-4 py-3.5"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white">
                            {a.title}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            {forced ? "Included in “Manage setup”." : a.help}
                          </div>
                        </div>
                        <Switch
                          checked={access[a.key]}
                          onChange={() => toggleAction(a.key)}
                          disabled={forced}
                          label={a.title}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>

              {notes.length > 0 && (
                <div
                  className="flex gap-2.5 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-xs text-slate-200"
                  role="status"
                >
                  <Info size={15} className="mt-0.5 shrink-0 text-brand-300" />
                  <ul className="space-y-1">
                    {notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div
                className={clsx(
                  "rounded-2xl border px-4 py-3.5 text-xs leading-relaxed",
                  access.pages.length
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-amber-500/30 bg-amber-500/10",
                )}
                aria-live="polite"
              >
                {access.pages.length ? (
                  <p>
                    <strong className="text-white">
                      Can open {access.pages.length} page
                      {access.pages.length === 1 ? "" : "s"}
                    </strong>{" "}
                    <span className="text-slate-400">
                      — {pageNames.slice(0, 5).join(", ")}
                      {pageNames.length > 5
                        ? ` and ${pageNames.length - 5} more`
                        : ""}
                      .
                    </span>
                  </p>
                ) : (
                  <p>
                    <strong className="text-amber-200">
                      Can open no pages yet
                    </strong>{" "}
                    <span className="text-slate-300">— tick at least one.</span>
                  </p>
                )}
                {flags.length ? (
                  <p className="mt-1">
                    <strong className="text-white">Can change</strong>{" "}
                    <span className="text-slate-400">
                      — {flags.join(" · ")}.
                    </span>
                  </p>
                ) : (
                  <p className="mt-1">
                    <strong className="text-white">
                      Cannot change anything
                    </strong>{" "}
                    <span className="text-slate-400">— read-only.</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-ink-600/60 px-6 py-4">
              <span className="text-xs text-slate-500">
                {ALL_PAGES.length} pages available
              </span>
              <div className="flex gap-2">
                <Button onClick={onClose} disabled={busy}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={save}
                  loading={busy}
                  disabled={!valid}
                >
                  {editing ? "Save changes" : "Save role"}
                </Button>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
