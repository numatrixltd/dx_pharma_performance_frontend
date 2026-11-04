import { Award, BadgeDollarSign, Palette, BarChart3, CalendarCheck, CalendarRange, Crown, FileBarChart, LayoutDashboard, PlusSquare, Settings2, ShieldCheck, Store, Users, Wrench } from 'lucide-react';

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
      { href: '/manager-incentive', label: 'Manager Incentive', icon: Award, needs: 'canViewManagerIncentive' },
      { href: '/employees', label: 'Employees', icon: Users },
      { href: '/attendance', label: 'Attendance', icon: CalendarCheck },
    ],
  },
  {
    group: 'Management',
    items: [
      { href: '/monthly-plan', label: 'Monthly Plan', icon: CalendarRange },
      { href: '/policy', label: 'Policy Settings', icon: Settings2 },
      { href: '/reports', label: 'Reports & Export', icon: FileBarChart },
      { href: '/admin-settings', label: 'Admin Settings', icon: Wrench, needs: 'canManageOffDays' },
      { href: '/theme', label: 'Theme & Colours', icon: Palette, needs: 'canManageTheme' },
      { href: '/users', label: 'Users & Access', icon: ShieldCheck, needs: 'canManageUsers' },
    ],
  },
];

export const TITLES = Object.fromEntries(NAV.flatMap((g) => g.items).map((i) => [i.href, i.label]));