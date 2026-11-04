'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ProfileProvider from '@/components/profiles/ProfileProvider';

export default function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <ProfileProvider>
      <div className="min-h-screen">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="lg:pl-[264px]">
          <Topbar onMenu={() => setOpen(true)} />
          <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7">{children}</main>
        </div>
      </div>
    </ProfileProvider>
  );
}