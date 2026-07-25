import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/technician/', '/api/'],
    },
    sitemap: 'https://sktechnology.services/sitemap.xml',
  };
}
