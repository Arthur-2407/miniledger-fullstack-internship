/**
 * Formats a numeric amount into Indian Rupee representation (e.g. ₹1,500.00 or ₹1,500)
 */
export function formatINR(amount: number, showDecimals: boolean = true): string {
  if (isNaN(amount)) return '₹0';

  const parts = amount.toFixed(showDecimals ? 2 : 0).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian number system formatting (last 3 digits, then groups of 2)
  const isNegative = integerPart.startsWith('-');
  if (isNegative) {
    integerPart = integerPart.slice(1);
  }

  let lastThree = integerPart.slice(-3);
  const otherNumbers = integerPart.slice(0, -3);

  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }

  const formattedInteger =
    otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const result = isNegative ? `-${formattedInteger}` : formattedInteger;

  return showDecimals ? `₹${result}.${decimalPart}` : `₹${result}`;
}
