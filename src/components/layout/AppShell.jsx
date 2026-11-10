"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { canOpenItem, firstAllowedHref, itemForPath } from "./nav";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import ProfileProvider from "@/components/profiles/ProfileProvider";

function NoAccess({ first, logout }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-ink-600/70 bg-ink-800/60 p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-400/10 text-amber-300">
        <Lock size={24} />
      </span>
      <h2 className="mt-5 text-lg font-bold text-white">
        Your role can&apos;t open this page
      </h2>
      <p className="mt-2 text-sm text-slate-400">
        An admin chooses which pages each role can open. Ask an admin to add
        this page to your role if you need it.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        {first ? (
          <Link href={first}>
            <Button variant="primary">Go to a page I can open</Button>
          </Link>
        ) : (
          <Button onClick={logout}>Sign out</Button>
        )}
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { can, logout } = useAuth();
  const allowed = canOpenItem(can, itemForPath(pathname));
  const first = firstAllowedHref(can);

  useEffect(() => setOpen(false), [pathname]);
  // Landing page: if the role has no Overview, go straight to the first page it can open
  useEffect(() => {
    if (!allowed && first && pathname === "/dashboard") router.replace(first);
  }, [allowed, first, pathname, router]);

  return (
    <ProfileProvider>
      <div className="min-h-screen">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="lg:pl-[264px]">
          <Topbar onMenu={() => setOpen(true)} />
          <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7">
            {allowed ? children : <NoAccess first={first} logout={logout} />}
          </main>
        </div>
      </div>
    </ProfileProvider>
  );
}
