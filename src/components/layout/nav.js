import { BadgeDollarSign, BarChart3, Crown, FileBarChart, LayoutDashboard, PlusSquare, Settings2, ShieldCheck, Store, Users } from 'lucide-react';

// `needs` is a key of the permissions object returned by /auth/me
export const NAV = [
  {
    group: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/leaderboard', label: 'Leaderboard', icon: Crown },
      { href: '/performance', label: 'Performance Reports', icon: BarChart3 },
      { href: '/sales-entry', label: 'Daily Sales Entry', icon: PlusSquare, needs: 'canEnterSales' },
      { href: '/outlet-competition', label: 'Outlet Competition', icon: Store },
      { href: '/incentives', label: 'Incentives', icon: BadgeDollarSign },
      { href: '/employees', label: 'Employees', icon: Users },
    ],
  },
  {
    group: 'Management',
    items: [
      { href: '/users', label: 'Users & Access', icon: ShieldCheck, needs: 'canManageUsers' },
      { href: '/policy', label: 'Policy Settings', icon: Settings2 },
      { href: '/reports', label: 'Reports & Export', icon: FileBarChart },
    ],
  },
];

export const TITLES = Object.fromEntries(NAV.flatMap((g) => g.items).map((i) => [i.href, i.label]));
