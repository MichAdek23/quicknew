import { useEffect } from 'react';

const CANONICAL_DOMAIN = 'https://quick-hedgeconsulting.com';

export function usePageSeo({
  title,
  description,
  canonicalPath = '',
  ogType = 'website',
}) {
  useEffect(() => {
    const cleanPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
    const fullCanonicalUrl = `${CANONICAL_DOMAIN}${cleanPath === '/' ? '' : cleanPath}`;

    // 1. Update Title
    if (title) {
      document.title = title.includes('QuickHedge')
        ? title
        : `${title} | QuickHedge Inc. — Physical Education & Sports Science`;
    }

    // 2. Canonical Link Tag
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', fullCanonicalUrl || `${CANONICAL_DOMAIN}/`);

    // 3. Meta Description
    if (description) {
      let descTag = document.querySelector('meta[name="description"]');
      if (!descTag) {
        descTag = document.createElement('meta');
        descTag.setAttribute('name', 'description');
        document.head.appendChild(descTag);
      }
      descTag.setAttribute('content', description);

      let ogDescTag = document.querySelector('meta[property="og:description"]');
      if (ogDescTag) ogDescTag.setAttribute('content', description);

      let twDescTag = document.querySelector('meta[name="twitter:description"]');
      if (twDescTag) twDescTag.setAttribute('content', description);
    }

    // 4. OpenGraph & Twitter Titles
    if (title) {
      let ogTitleTag = document.querySelector('meta[property="og:title"]');
      if (ogTitleTag) ogTitleTag.setAttribute('content', document.title);

      let twTitleTag = document.querySelector('meta[name="twitter:title"]');
      if (twTitleTag) twTitleTag.setAttribute('content', document.title);
    }

    // 5. OpenGraph URL & Type
    let ogUrlTag = document.querySelector('meta[property="og:url"]');
    if (ogUrlTag) ogUrlTag.setAttribute('content', fullCanonicalUrl || `${CANONICAL_DOMAIN}/`);

    let ogTypeTag = document.querySelector('meta[property="og:type"]');
    if (ogTypeTag) ogTypeTag.setAttribute('content', ogType);

  }, [title, description, canonicalPath, ogType]);
}
