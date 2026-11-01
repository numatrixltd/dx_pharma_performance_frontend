import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'DX Pharma Arena',
  description: 'Sales league, leaderboard and incentive tracking for DX Pharma',
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#050914' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
