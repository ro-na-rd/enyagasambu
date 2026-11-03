import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

const publicPages: Array<[string, MetadataRoute.Sitemap[number]['changeFrequency'], number]> = [
  ['', 'daily', 1],
  ['/listings', 'hourly', 0.9],
  ['/auction', 'hourly', 0.9],
  ['/about', 'monthly', 0.7],
  ['/faq', 'monthly', 0.6],
  ['/guide', 'monthly', 0.6],
  ['/support', 'monthly', 0.5],
  ['/tax-advisory', 'weekly', 0.7],
  ['/certificates', 'monthly', 0.5],
  ['/certificate', 'monthly', 0.5],
  ['/verify-broker', 'monthly', 0.4],
  ['/verify-supplier', 'monthly', 0.4],
  ['/privacy', 'yearly', 0.3],
  ['/terms', 'yearly', 0.3],
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map(([path, changeFrequency, priority]) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
