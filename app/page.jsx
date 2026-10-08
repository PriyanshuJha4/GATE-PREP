import Dashboard from '@/components/Dashboard';
import { getNavigation } from '@/lib/content';
import { siteConfig } from '@/site.config';

export default function HomePage() {
  return <Dashboard nav={getNavigation()} siteName={siteConfig.name} tagline={siteConfig.tagline} />;
}
