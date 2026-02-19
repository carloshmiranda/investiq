// Currency formatter
export const formatCurrency = (value, decimals = 2) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

// Compact currency (1.2M, 34.5K)
export const formatCurrencyCompact = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

// Percent formatter
export const formatPercent = (value, decimals = 2) =>
  `${value.toFixed(decimals)}%`;

// Number formatter
export const formatNumber = (value, decimals = 4) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);

// Date formatter
export const formatDate = (dateStr) => {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Short date
export const formatDateShort = (dateStr) => {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

// Time ago
export const timeAgo = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
