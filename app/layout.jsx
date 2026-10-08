import './globals.css';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import AppShell from '@/components/AppShell';
import ServiceWorker from '@/components/ServiceWorker';
import { getNavigation, getQuestionIndex, getSyllabus } from '@/lib/content';
import { siteConfig } from '@/site.config';

export const metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.tagline,
  applicationName: siteConfig.name,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, title: 'GATE Notebook', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#171717' },
  ],
};

// Runs before first paint: restores theme + desktop sidebar state without flicker.
const initScript = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.setAttribute('data-theme',t);d.setAttribute('data-sidebar',localStorage.getItem('sidebar')==='collapsed'?'collapsed':'open')}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
      </head>
      <body>
        <ServiceWorker />
        <AppShell
          nav={getNavigation()}
          syllabus={getSyllabus()}
          questionIndex={getQuestionIndex()}
          siteName={siteConfig.name}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
