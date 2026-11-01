import clsx from 'clsx';
import { initials } from '@/lib/format';
import { avatarUrl } from '@/lib/cloudinary';

const GRADS = ['from-brand-500 to-violet-500', 'from-cyan-500 to-brand-600', 'from-violet-500 to-fuchsia-500', 'from-emerald-500 to-cyan-500', 'from-amber-500 to-rose-500'];

export default function Avatar({ name = '', src, size = 36, className }) {
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % GRADS.length;
  const style = { width: size, height: size, fontSize: Math.max(10, size * 0.34) };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl(src, size)} alt={name} style={style} loading="lazy" className={clsx('shrink-0 rounded-xl object-cover ring-1 ring-white/10', className)} />;
  }
  return (
    <div style={style} className={clsx('grid shrink-0 place-items-center rounded-xl bg-gradient-to-br font-bold text-white', GRADS[hue], className)}>
      {initials(name)}
    </div>
  );
}