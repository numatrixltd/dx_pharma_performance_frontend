import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'DX Pharma Arena',
  description: 'Sales league, leaderboard and incentive tracking for DX Pharma',
};

export const viewport = { width: 'device-width', initialScale: 1 };

// Paints the last saved theme before the first frame so there is no flash of the default colours.
const THEME_BOOT = `(function(){try{var c=JSON.parse(localStorage.getItem('dxa_theme_cache')||'null');if(!c)return;var l=c.autoLight&&window.matchMedia('(prefers-color-scheme: light)').matches;var v=l?c.lightVars:c.vars;var r=document.documentElement;for(var k in v)r.style.setProperty(k,v[k]);r.setAttribute('data-mode',l?c.lightMode:c.mode);}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-mode="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}