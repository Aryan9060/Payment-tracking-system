export const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export function getPaymentStatus(total, paid) {
  if (round2(total - paid) <= 0) return 'Paid';
  if (paid > 0) return 'Partially Paid';
  return 'Unpaid';
}

/**
 * Adds derived payment fields to an invoice object.
 * paidAmount and status are never stored; they are rebuilt from the payments collection.
 */
export function withPaymentSummary(invoice, paid) {
  const { __v, ...rest } = invoice;
  const paidAmount = round2(paid || 0);
  const remainingAmount = round2(Math.max(rest.amount - paidAmount, 0));

  return {
    ...rest,
    paidAmount,
    remainingAmount,
    status: getPaymentStatus(rest.amount, paidAmount),
  };
}
