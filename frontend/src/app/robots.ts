import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/ambassador/',
        '/broker/',
        '/executive/',
        '/supplier/',
        '/login',
        '/forgot-password',
        '/reset-password',
        '/my-listings',
        '/preview-certificate',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
