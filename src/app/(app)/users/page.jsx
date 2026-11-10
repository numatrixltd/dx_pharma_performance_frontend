"use client";
import { useMemo, useState } from "react";
import {
  Crown,
  Eye,
  Lock,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import clsx from "clsx";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { PAGE_LABEL, summarizeAccess } from "@/lib/access";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Tabs from "@/components/ui/Tabs";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Field";
import { EmptyState, ErrorBox, Skeleton } from "@/components/ui/States";
import RoleDrawer from "@/components/access/RoleDrawer";
import MemberModal from "@/components/access/MemberModal";

const KIND = {
  admin: {
    icon: Crown,
    bar: "from-amber-400 to-amber-600",
    chip: "bg-amber-400/15 text-amber-300",
    badge: "amber",
    label: "Admin",
  },
  custom: {
    icon: ShieldCheck,
    bar: "from-brand-400 to-brand-600",
    chip: "bg-brand-500/15 text-brand-300",
    badge: "blue",
  },
  manager: {
    icon: Eye,
    bar: "from-violet-400 to-violet-600",
    chip: "bg-violet-500/15 text-violet-300",
    badge: "violet",
    label: "Manager",
  },
};
const kindOf = (u) =>
  u.role === "admin" ? "admin" : u.customRole ? "custom" : "manager";

function Stat({ label, value, icon: Icon, tone }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-600/70 bg-ink-800/60 px-4 py-3.5">
      <span
        className={clsx("grid h-10 w-10 place-items-center rounded-xl", tone)}
      >
        <Icon size={18} />
      </span>
      <div>
        <div className="text-xl font-bold leading-none text-white">{value}</div>
        <div className="mt-1 text-xs text-slate-400">{label}</div>
      </div>
    </div>
  );
}

function AccessChips({ flags, readOnly }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {readOnly ? (
        <span className="rounded-full bg-ink-700 px-2.5 py-1 text-[11px] text-slate-300">
          Read-only
        </span>
      ) : (
        flags.map((f) => (
          <span
            key={f}
            className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300"
          >
            {f}
          </span>
        ))
      )}
    </div>
  );
}

function MemberCard({ u, me, onEdit, onDelete }) {
  const k = KIND[kindOf(u)];
  const Icon = k.icon;
  const summary =
    u.role === "admin"
      ? { pageCount: 15, flags: ["Full access"], readOnly: false }
      : u.customRole
        ? summarizeAccess(u.customRole)
        : {
            pageCount: 10 + (u.managerIncentiveAccess ? 1 : 0),
            flags: [],
            readOnly: true,
          };
  return (
    <Card
      pad={false}
      className={clsx(
        "relative overflow-hidden transition hover:border-brand-500/40",
        !u.isActive && "opacity-60",
      )}
    >
      <div className={clsx("h-1 bg-gradient-to-r", k.bar)} />
      <div className="p-5">
        <div className="flex items-start gap-3.5">
          <Avatar name={u.name} size={46} className="!rounded-2xl" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-white">
                {u.name}
              </span>
              {u._id === me._id && (
                <span className="text-[11px] text-slate-500">(you)</span>
              )}
            </div>
            <div className="truncate text-xs text-slate-400">{u.email}</div>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Edit ${u.name}`}
              onClick={() => onEdit(u)}
            >
              <Pencil size={15} />
            </Button>
            {u._id !== me._id && (
              <Button
                size="icon"
                variant="ghost"
                className="hover:!text-rose-300"
                aria-label={`Delete ${u.name}`}
                onClick={() => onDelete(u)}
              >
                <Trash2 size={15} />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              k.chip,
            )}
          >
            <Icon size={13} />
            {u.role === "admin" ? "Admin" : u.customRole?.name || "Manager"}
          </span>
          <Badge tone={u.isActive ? "green" : "gray"}>
            {u.isActive ? "Active" : "Disabled"}
          </Badge>
          {u.role === "manager" &&
            !u.customRole &&
            u.managerIncentiveAccess && (
              <Badge tone="amber">Manager incentive</Badge>
            )}
        </div>

        <div className="mt-4 border-t border-ink-600/50 pt-3.5">
          <div className="mb-2 text-[11px] text-slate-500">
            {u.role === "admin" ? "Everything" : `${summary.pageCount} pages`}
          </div>
          <AccessChips flags={summary.flags} readOnly={summary.readOnly} />
        </div>
        <div className="mt-3 text-[11px] text-slate-500">
          Last sign-in:{" "}
          {u.lastLoginAt
            ? new Date(u.lastLoginAt).toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "never"}
        </div>
      </div>
    </Card>
  );
}

function RoleCard({ role, builtin, members, onEdit, onDelete }) {
  const k = KIND[builtin || "custom"];
  const Icon = k.icon;
  const s = role ? summarizeAccess(role) : null;
  const pages = role ? role.pages.map((p) => PAGE_LABEL[p]) : [];
  return (
    <Card
      pad={false}
      className="overflow-hidden transition hover:border-brand-500/40"
    >
      <div className={clsx("h-1 bg-gradient-to-r", k.bar)} />
      <div className="p-5">
        <div className="flex items-start gap-3.5">
          <span
            className={clsx(
              "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
              k.chip,
            )}
          >
            <Icon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-white">
                {role ? role.name : k.label}
              </span>
              {builtin && (
                <Badge tone="gray">
                  <Lock size={10} /> Built-in
                </Badge>
              )}
            </div>
            <div className="mt-0.5 text-xs text-slate-400">
              {role
                ? role.description ||
                  `${members} member${members === 1 ? "" : "s"}`
                : builtin === "admin"
                  ? "Full access to everything, always"
                  : "Read-only access to dashboards and reports"}
            </div>
          </div>
          {role && (
            <div className="flex shrink-0 gap-0.5">
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Edit ${role.name}`}
                onClick={() => onEdit(role)}
              >
                <Pencil size={15} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="hover:!text-rose-300"
                aria-label={`Delete ${role.name}`}
                onClick={() => onDelete(role)}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4">
          <AccessChips
            flags={role ? s.flags : builtin === "admin" ? ["Full access"] : []}
            readOnly={role ? s.readOnly : builtin === "manager"}
          />
        </div>

        {role && (
          <div className="mt-4 border-t border-ink-600/50 pt-3.5">
            <div className="mb-2 text-[11px] text-slate-500">
              Opens {pages.length} page{pages.length === 1 ? "" : "s"}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {pages.slice(0, 5).map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-ink-700 px-2.5 py-1 text-[11px] text-slate-300"
                >
                  {p}
                </span>
              ))}
              {pages.length > 5 && (
                <span className="rounded-full bg-ink-700 px-2.5 py-1 text-[11px] text-slate-400">
                  +{pages.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
        <div className="mt-3 text-[11px] text-slate-500">
          {members} member{members === 1 ? "" : "s"}{" "}
          {role ? "use this role" : "on this role"}
        </div>
      </div>
    </Card>
  );
}

export default function UsersPage() {
  const { user: me, can } = useAuth();
  const toast = useToast();
  const users = useApi("/users", undefined, { enabled: !!can.canManageUsers });
  const roles = useApi("/roles", undefined, { enabled: !!can.canManageUsers });
  const [tab, setTab] = useState("members");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [member, setMember] = useState({ open: false, user: null });
  const [drawer, setDrawer] = useState({ open: false, role: null });
  const [delUser, setDelUser] = useState(null);
  const [delRole, setDelRole] = useState(null);
  const [busy, setBusy] = useState(false);

  const list = users.data || [];
  const roleList = roles.data || [];
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return list.filter(
      (u) =>
        (!s ||
          u.name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s)) &&
        (filter === "all" ||
          (filter === "admin"
            ? u.role === "admin"
            : filter === "manager"
              ? u.role === "manager" && !u.customRole
              : (u.customRole?._id || u.customRole?.id) === filter)),
    );
  }, [list, q, filter]);

  if (!can.canManageUsers)
    return (
      <EmptyState
        title="Admins only"
        message="Only an admin can manage members and roles."
      />
    );
  const loading =
    (!users.data && users.loading) || (!roles.data && roles.loading);
  const err = (!users.data && users.error) || (!roles.data && roles.error);

  const adminCount = list.filter((u) => u.role === "admin").length;
  const managerCount = list.filter(
    (u) => u.role === "manager" && !u.customRole,
  ).length;
  const pills = [
    { value: "all", label: `All (${list.length})` },
    { value: "admin", label: `Admin (${adminCount})` },
    ...roleList.map((r) => ({
      value: r.id,
      label: `${r.name} (${r.members})`,
    })),
    { value: "manager", label: `Manager (${managerCount})` },
  ];

  const removeUser = async () => {
    setBusy(true);
    try {
      await api(`/users/${delUser._id}`, { method: "DELETE" });
      toast.success("Member deleted");
      setDelUser(null);
      users.reload();
      roles.reload();
    } catch (e) {
      toast.error(e.message);
      setDelUser(null);
    } finally {
      setBusy(false);
    }
  };
  const removeRole = async () => {
    setBusy(true);
    try {
      await api(`/roles/${delRole.id}`, { method: "DELETE" });
      toast.success("Role deleted");
      setDelRole(null);
      roles.reload();
    } catch (e) {
      toast.error(e.message);
      setDelRole(null);
    } finally {
      setBusy(false);
    }
  };
  const refresh = () => {
    users.reload();
    roles.reload();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Users & access"
        subtitle="Create roles that decide which pages a member can open and what they can change, then add members and give each one a role."
        actions={
          tab === "members" ? (
            <Button
              variant="primary"
              onClick={() => setMember({ open: true, user: null })}
            >
              <UserPlus size={16} /> Add member
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => setDrawer({ open: true, role: null })}
            >
              <Plus size={16} /> New role
            </Button>
          )
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Members"
          value={list.length}
          icon={Users}
          tone="bg-brand-500/15 text-brand-300"
        />
        <Stat
          label="Admins"
          value={adminCount}
          icon={Crown}
          tone="bg-amber-400/15 text-amber-300"
        />
        <Stat
          label="Custom roles"
          value={roleList.length}
          icon={ShieldCheck}
          tone="bg-emerald-500/15 text-emerald-300"
        />
        <Stat
          label="Disabled"
          value={list.filter((u) => !u.isActive).length}
          icon={Lock}
          tone="bg-slate-500/15 text-slate-300"
        />
      </div>

      <div className="mb-5">
        <Tabs
          options={[
            { value: "members", label: `Members (${list.length})` },
            { value: "roles", label: `Roles (${roleList.length + 2})` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {err && <ErrorBox message={err} onRetry={refresh} />}
      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      )}

      {!loading && !err && tab === "members" && (
        <>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-xs">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search members…"
                className="pl-10"
                aria-label="Search members"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {pills.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setFilter(p.value)}
                  className={clsx(
                    "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                    filter === p.value
                      ? "border-brand-400 bg-brand-500/15 text-brand-300"
                      : "border-ink-600 text-slate-300 hover:border-brand-500/50",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {shown.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shown.map((u) => (
                <MemberCard
                  key={u._id}
                  u={u}
                  me={me}
                  onEdit={(x) => setMember({ open: true, user: x })}
                  onDelete={setDelUser}
                />
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                title="No members match"
                message="Try a different search or role filter."
              />
            </Card>
          )}
        </>
      )}

      {!loading && !err && tab === "roles" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <RoleCard builtin="admin" members={adminCount} />
          {roleList.map((r) => (
            <RoleCard
              key={r.id}
              role={r}
              members={r.members}
              onEdit={(x) => setDrawer({ open: true, role: x })}
              onDelete={setDelRole}
            />
          ))}
          <RoleCard builtin="manager" members={managerCount} />
          <button
            type="button"
            onClick={() => setDrawer({ open: true, role: null })}
            className="grid min-h-[200px] place-items-center rounded-2xl border border-dashed border-ink-500 text-center text-slate-400 transition hover:border-brand-400 hover:text-brand-300"
          >
            <span>
              <span className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-xl bg-ink-700">
                <Plus size={20} />
              </span>
              <span className="text-sm font-semibold">New role</span>
              <span className="mt-1 block text-xs text-slate-500">
                Choose pages and permissions
              </span>
            </span>
          </button>
        </div>
      )}

      <Notice tone="amber" className="mt-6 !mb-0" title="Good to know:">
        page access controls what each role sees in the menu and which pages it
        can open. The three permissions decide what it can actually save, and
        the server enforces them. Signed-in members can still receive workspace
        figures such as sales and targets behind the pages they can open, so
        only give a role to people who may see that. Admin accounts always have
        full access and cannot be locked out from here.
      </Notice>

      <MemberModal
        open={member.open}
        user={member.user}
        roles={roleList}
        isSelf={member.user?._id === me._id}
        onClose={() => setMember({ open: false, user: null })}
        onSaved={refresh}
      />
      <RoleDrawer
        open={drawer.open}
        role={drawer.role}
        onClose={() => setDrawer({ open: false, role: null })}
        onSaved={refresh}
      />
      <ConfirmDialog
        open={!!delUser}
        title={`Delete ${delUser?.name}?`}
        confirmLabel="Delete member"
        loading={busy}
        onClose={() => setDelUser(null)}
        onConfirm={removeUser}
        message="This account will no longer be able to sign in. To keep it but block access, disable it instead."
      />
      <ConfirmDialog
        open={!!delRole}
        title={`Delete the “${delRole?.name}” role?`}
        confirmLabel="Delete role"
        loading={busy}
        onClose={() => setDelRole(null)}
        onConfirm={removeRole}
        message={
          delRole?.members
            ? `${delRole.members} member${delRole.members === 1 ? " uses" : "s use"} this role, so it can't be deleted yet. Move them to another role first.`
            : "The role is removed. No members use it."
        }
      />
    </div>
  );
}
