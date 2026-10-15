const REPOST_COST = 400;

function computeRepostPrice(discountPercent) {
  const pct = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discountAmount = Math.round((REPOST_COST * pct) / 100);
  return {
    baseCost: REPOST_COST,
    discountPercent: pct,
    discountAmount,
    amount: REPOST_COST - discountAmount,
  };
}

function isDiscountEligible(listing) {
  if (!listing || listing.status !== 'sold') return false;
  if (listing.sale_reported_at) return false;
  const expiresAt = listing.expires_at ? new Date(listing.expires_at).getTime() : 0;
  return expiresAt > Date.now();
}

module.exports = { REPOST_COST, computeRepostPrice, isDiscountEligible };
