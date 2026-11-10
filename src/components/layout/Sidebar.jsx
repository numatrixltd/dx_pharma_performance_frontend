"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, X } from "lucide-react";
import clsx from "clsx";
import { NAV, canOpenItem } from "./nav";
import { roleLabel } from "@/lib/access";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/ui/Avatar";

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-sm font-extrabold text-onaccent shadow-glow">
        DX
      </div>
      <div>
        <div className="text-sm font-bold tracking-wide text-white">
          DX Pharma
        </div>
        <div className="text-xs text-slate-400">Arena sales league</div>
      </div>
    </div>
  );
}

function NavList({ onNavigate }) {
  const pathname = usePathname();
  const { can } = useAuth();
  return (
    <nav className="mt-7 flex-1 space-y-6 overflow-y-auto pr-1">
      {NAV.map((g) => {
        const items = g.items.filter((i) => canOpenItem(can, i));
        if (!items.length) return null;
        return (
          <div key={g.group}>
            <div className="mb-2 px-3 text-xs font-medium text-slate-500">
              {g.group}
            </div>
            <ul className="space-y-1">
              {items.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href || pathname.startsWith(href + "/");
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={clsx(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                        active
                          ? "bg-brand-500/15 text-white shadow-[inset_0_0_0_1px_rgba(96,165,250,.35),0_0_24px_-8px_rgba(59,130,246,.6)]"
                          : "text-slate-400 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <Icon
                        size={18}
                        className={clsx(
                          active
                            ? "text-brand-400"
                            : "text-slate-500 group-hover:text-slate-300",
                        )}
                      />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function Footer() {
  const { user, logout } = useAuth();
  return (
    <div className="mt-4 rounded-2xl border border-ink-600/70 bg-ink-800/70 p-3">
      <div className="flex items-center gap-3">
        <Avatar name={user?.name} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">
            {user?.name}
          </div>
          <div className="truncate text-xs text-slate-400">
            {roleLabel(user)}
          </div>
        </div>
        <button
          onClick={logout}
          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-rose-300"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-ink-600/60 bg-ink-900/80 p-5 backdrop-blur-xl lg:flex">
        <Brand />
        <NavList />
        <Footer />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r border-ink-600/60 bg-ink-900 p-5"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
            >
              <div className="flex items-center justify-between">
                <Brand />
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/5"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>
              <NavList onNavigate={onClose} />
              <Footer />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
