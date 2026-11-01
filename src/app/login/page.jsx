'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, TrendingUp, Trophy, BadgeDollarSign } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';

const HIGHLIGHTS = [
  { icon: Trophy, title: 'Live leaderboard', text: 'Every finalized sale moves the daily race.' },
  { icon: TrendingUp, title: 'Target tracking', text: 'Achievement against daily and period targets.' },
  { icon: BadgeDollarSign, title: 'Incentive clarity', text: 'Earned, approved and paid, kept separate.' },
];

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const demo = process.env.NEXT_PUBLIC_SHOW_DEMO === 'true';

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden border-r border-ink-600/60 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-24 top-1/3 h-[420px] w-[420px] rounded-full bg-brand-600/25 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-violet-600/20 blur-[110px]" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 font-extrabold text-white shadow-glow">DX</div>
          <div>
            <div className="font-bold text-white">DX Pharma</div>
            <div className="text-xs text-slate-400">Arena sales league</div>
          </div>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">One team. Two outlets. Every sale moves the leaderboard.</h1>
          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-brand-400"><Icon size={19} /></span>
                <div>
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="text-sm text-slate-400">{text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-xs text-slate-500">© {new Date().getFullYear()} DX Pharma</div>
      </div>

      <div className="flex items-center justify-center p-5 sm:p-10">
        <motion.form onSubmit={submit} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="card w-full max-w-md space-y-5 p-6 sm:p-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Sign in</h2>
            <p className="mt-1.5 text-sm text-slate-400">Use the account your admin created for you.</p>
          </div>

          <Field label="Email">
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-10" placeholder="you@dxpharma.com" />
            </div>
          </Field>
          <Field label="Password">
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input type={show ? 'text' : 'password'} required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="px-10" placeholder="Your password" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white" aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">{error}</div>}

          <Button type="submit" variant="primary" loading={busy} className="w-full">Sign in</Button>

          {demo && (
            <div className="rounded-xl border border-ink-600 bg-ink-900/60 p-3 text-xs text-slate-400">
              <div className="mb-2 font-medium text-slate-300">Demo accounts</div>
              <button type="button" className="block w-full text-left hover:text-white" onClick={() => setForm({ email: 'admin@dxpharma.com', password: 'Admin@123' })}>Admin · admin@dxpharma.com</button>
              <button type="button" className="mt-1 block w-full text-left hover:text-white" onClick={() => setForm({ email: 'manager@dxpharma.com', password: 'Manager@123' })}>Manager · manager@dxpharma.com</button>
            </div>
          )}
        </motion.form>
      </div>
    </div>
  );
}
