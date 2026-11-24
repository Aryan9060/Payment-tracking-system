export const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export function getPaymentStatus(total, paid) {
  if (round2(total - paid) <= 0) return 'Paid';
  if (paid > 0) return 'Partially Paid';
  return 'Unpaid';
}

export function isInvoiceOverdue(dueDate, status) {
  if (!dueDate || status === 'Paid') return false;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;

  const today = new Date();
  const todayStart = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const dueStart = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  return dueStart < todayStart;
}

/**
 * Adds derived payment fields to an invoice object.
 * paidAmount, status, and isOverdue are never stored; they are rebuilt from the payments collection.
 */
export function withPaymentSummary(invoice, paid) {
  const { __v, ...rest } = invoice;
  const paidAmount = round2(paid || 0);
  const remainingAmount = round2(Math.max(rest.amount - paidAmount, 0));
  const status = getPaymentStatus(rest.amount, paidAmount);

  return {
    ...rest,
    paidAmount,
    remainingAmount,
    status,
    isOverdue: isInvoiceOverdue(rest.dueDate, status),
  };
}
