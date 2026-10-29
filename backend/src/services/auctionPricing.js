const DEFAULT_DURATIONS = { 3: 500, 7: 1000, 30: 3500 };
const DEFAULT_DURATION = 7;

function parseDurationPrices(rows) {
  const prices = {};
  if (Array.isArray(rows)) {
    rows.forEach((r) => {
      const days = parseInt(String((r && r.setting_key) || '').replace('listing_duration_', '').replace('_days', ''), 10);
      const value = parseInt((r && r.setting_value) || '', 10);
      if (Number.isInteger(days) && days > 0 && Number.isFinite(value)) prices[days] = value;
    });
  }
  return Object.keys(prices).length ? prices : { ...DEFAULT_DURATIONS };
}

function resolveAuctionDuration(requestedDays, prices) {
  const map = prices && Object.keys(prices).length ? prices : DEFAULT_DURATIONS;
  const options = Object.keys(map).map(Number).sort((a, b) => a - b);
  const requested = parseInt(requestedDays, 10);
  const fallback = options.includes(DEFAULT_DURATION) ? DEFAULT_DURATION : options[0];
  const days = options.includes(requested) ? requested : fallback;
  return { duration_days: days, amount_rwf: map[days] };
}

function computeAuctionWindow(durationDays, now = Date.now()) {
  const days = Number(durationDays) > 0 ? Number(durationDays) : DEFAULT_DURATION;
  return {
    auction_start: new Date(now),
    expires_at: new Date(now + days * 24 * 60 * 60 * 1000),
  };
}

module.exports = {
  DEFAULT_DURATIONS,
  DEFAULT_DURATION,
  parseDurationPrices,
  resolveAuctionDuration,
  computeAuctionWindow,
};
