/**
 * Price formatting and parsing utilities for admin panel
 */

/**
 * Convert price to Indian currency format (K, L, Cr)
 * Examples:
 * - 67000 -> "67 K"
 * - 6700000 -> "67 L"
 * - 67000000 -> "6.7 Cr"
 * - 670000000 -> "67 Cr"
 */
export const formatPriceConverter = (
  price: string | number | null | undefined
): string => {
  if (!price) return '';

  const numPrice =
    typeof price === 'string'
      ? parseFloat(price.replace(/[^0-9.]/g, ''))
      : price;

  if (isNaN(numPrice) || numPrice === 0) return '';

  // Crores (7+ digits, e.g., 67,00,00,000)
  if (numPrice >= 10000000) {
    const crores = numPrice / 10000000;
    // If it's a whole number, show without decimals
    if (crores % 1 === 0) {
      return `${crores.toFixed(0)} Cr`;
    }
    // Otherwise show 1 decimal place
    return `${crores.toFixed(1)} Cr`;
  }

  // Lakhs (5-6 digits, e.g., 67,00,000)
  if (numPrice >= 100000) {
    const lakhs = numPrice / 100000;
    // If it's a whole number, show without decimals
    if (lakhs % 1 === 0) {
      return `${lakhs.toFixed(0)} L`;
    }
    // Otherwise show 1 decimal place
    return `${lakhs.toFixed(1)} L`;
  }

  // Thousands (3-4 digits, e.g., 67,000)
  if (numPrice >= 1000) {
    const thousands = numPrice / 1000;
    // If it's a whole number, show without decimals
    if (thousands % 1 === 0) {
      return `${thousands.toFixed(0)} K`;
    }
    // Otherwise show 1 decimal place
    return `${thousands.toFixed(1)} K`;
  }

  // Less than 1000, return as is
  return numPrice.toString();
};

/**
 * Format price with currency symbol and Indian format
 * Returns formatted string like "₹67,00,000" or "₹67 L" based on useConverter flag
 */
export const formatPriceWithCurrency = (
  price: number | string | null | undefined,
  useConverter: boolean = false
): string => {
  if (!price) return '₹0';

  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '₹0';

  if (useConverter) {
    const converted = formatPriceConverter(numPrice);
    return `₹${converted}`;
  }

  return `₹${numPrice.toLocaleString('en-IN')}`;
};

/**
 * Format price for display (adds commas in Indian format)
 */
export const formatPrice = (price: number | string | null | undefined): string => {
  if (!price) return '0';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '0';
  return numPrice.toLocaleString('en-IN');
};

/**
 * Format currency with Indian number format
 * @deprecated Use formatPriceWithCurrency instead
 */
export const formatCurrency = (
  amount?: number | null
): string => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

