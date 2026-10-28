/**
 * Product imagery utilities & reliable licensed fallback mappings
 * Ensures every product displays a crisp, high-resolution lifestyle/studio visual
 * with zero broken image states.
 */

const CURATED_IMAGE_MAP = {
  // Direct SKU & Keyword matches
  'ELEC-001': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
  'ELEC-002': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
  'HOME-001': '/frying-pan.jpg',
  'HOME-002': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
  'APP-001': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  'SPRT-001': 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80',
  
  // Category Fallbacks
  'electronics': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  'home & kitchen': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
  'apparel': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
  'sports & fitness': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  'general': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
};

// Generic elegant SVG data-URI placeholder as ultimate safety net
export const FALLBACK_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23131b2e"/><circle cx="200" cy="180" r="60" fill="%231e293b"/><path d="M150 280 L200 230 L250 280" stroke="%2338bdf8" stroke-width="8" stroke-linecap="round" fill="none"/><text x="200" y="320" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="16" font-weight="600">NexStock Exclusive</text></svg>';

export function getProductImage(product) {
  if (product?.primary_image && product.primary_image.trim() !== '') {
    return product.primary_image;
  }
  
  if (product?.sku && CURATED_IMAGE_MAP[product.sku]) {
    return CURATED_IMAGE_MAP[product.sku];
  }

  const name = (product?.name || '').toLowerCase();
  if (name.includes('mouse')) return CURATED_IMAGE_MAP['ELEC-001'];
  if (name.includes('charger') || name.includes('cable') || name.includes('usb')) return CURATED_IMAGE_MAP['ELEC-002'];
  if (name.includes('pan') || name.includes('cookware') || name.includes('pot')) return CURATED_IMAGE_MAP['HOME-001'];
  if (name.includes('bed') || name.includes('sheet') || name.includes('pillow')) return CURATED_IMAGE_MAP['HOME-002'];
  if (name.includes('shirt') || name.includes('cloth') || name.includes('apparel')) return CURATED_IMAGE_MAP['APP-001'];
  if (name.includes('yoga') || name.includes('mat') || name.includes('fitness') || name.includes('gym')) return CURATED_IMAGE_MAP['SPRT-001'];

  const category = (product?.category || '').toLowerCase();
  if (CURATED_IMAGE_MAP[category]) {
    return CURATED_IMAGE_MAP[category];
  }

  return CURATED_IMAGE_MAP['general'];
}

export function handleImageError(e) {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_SVG;
}
