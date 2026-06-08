export function formatCurrency(amount: number): string {
  // Pakistani Rupee format: Rs. 1,23,456.78
  // Note: Pakistan uses South Asian numbering (lakhs/crores)
  return `Rs. ${amount.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 10000000) return `Rs. ${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `Rs. ${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `Rs. ${(amount / 1000).toFixed(1)}K`;
  return `Rs. ${amount.toFixed(2)}`;
}
