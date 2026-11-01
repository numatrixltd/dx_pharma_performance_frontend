# DX Pharma Arena — Frontend

Next.js 15 (App Router) · JavaScript · Tailwind CSS 3 · Framer Motion · Recharts

```bash
npm install
cp .env.example .env.local     # set NEXT_PUBLIC_API_URL (must end with /api)
npm run dev                    # http://localhost:3000
npm run build && npm start
```

Sign in with the accounts created by the backend seed (`admin@dxpharma.com` / `Admin@123`, `manager@dxpharma.com` / `Manager@123`).

## Pages
Overview · Leaderboard · Performance Reports · Daily Sales Entry · Outlet Competition · Incentives · Employees · Users & Access (admin) · Policy Settings · Reports & Export

## Roles in the UI
Permissions come from `GET /auth/me`. Admin sees every action. Manager sees the same data but no create, edit, delete, finalize or approve controls, and no Users page.

## Theme
InsightAI-style dark navy. Colors live in `tailwind.config.js` (`ink`, `brand`); shared classes (`card`, `input`, `th`, `td`) are in `src/app/globals.css`.
