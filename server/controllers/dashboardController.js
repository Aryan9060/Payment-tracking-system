import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import {
  getPaymentStatus,
  isInvoiceOverdue,
  round2,
  withPaymentSummary,
} from '../utils/calculations.js';

function monthKey(date) {
  const value = new Date(date);
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function getDashboard(req, res) {
  const [invoices, payments] = await Promise.all([
    Invoice.find().lean(),
    Payment.find().lean(),
  ]);

  const paidMap = new Map();
  for (const payment of payments) {
    const key = String(payment.invoice);
    paidMap.set(key, round2((paidMap.get(key) || 0) + payment.amount));
  }

  const totals = {
    invoiceCount: invoices.length,
    totalInvoiced: 0,
    totalPaid: round2(payments.reduce((sum, payment) => sum + payment.amount, 0)),
    totalOutstanding: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
    overdueCount: 0,
    overdueAmount: 0,
    collectionRate: 0,
  };

  const months = [];
  const now = new Date();
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    months.push({
      key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
      invoiced: 0,
      collected: 0,
    });
  }
  const monthIndex = new Map(months.map((month, index) => [month.key, index]));

  for (const invoice of invoices) {
    const paid = paidMap.get(String(invoice._id)) || 0;
    const status = getPaymentStatus(invoice.amount, paid);
    const remaining = Math.max(round2(invoice.amount - paid), 0);

    totals.totalInvoiced = round2(totals.totalInvoiced + invoice.amount);
    totals.totalOutstanding = round2(totals.totalOutstanding + remaining);

    if (status === 'Paid') totals.paidCount += 1;
    else if (status === 'Partially Paid') totals.partialCount += 1;
    else totals.unpaidCount += 1;

    if (isInvoiceOverdue(invoice.dueDate, status)) {
      totals.overdueCount += 1;
      totals.overdueAmount = round2(totals.overdueAmount + remaining);
    }

    const index = monthIndex.get(monthKey(invoice.issueDate));
    if (index !== undefined) {
      months[index].invoiced = round2(months[index].invoiced + invoice.amount);
    }
  }

  totals.collectionRate =
    totals.totalInvoiced > 0
      ? Math.min(round2((totals.totalPaid / totals.totalInvoiced) * 100), 100)
      : 0;

  const methodMap = new Map();
  for (const payment of payments) {
    const entry = methodMap.get(payment.method) || { name: payment.method, value: 0, count: 0 };
    entry.value = round2(entry.value + payment.amount);
    entry.count += 1;
    methodMap.set(payment.method, entry);

    const index = monthIndex.get(monthKey(payment.date));
    if (index !== undefined) {
      months[index].collected = round2(months[index].collected + payment.amount);
    }
  }

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((invoice) => withPaymentSummary(invoice, paidMap.get(String(invoice._id)) || 0));

  res.json({
    totals,
    monthlySeries: months.map(({ label, invoiced, collected }) => ({ label, invoiced, collected })),
    statusDistribution: [
      { name: 'Paid', value: totals.paidCount },
      { name: 'Partially Paid', value: totals.partialCount },
      { name: 'Unpaid', value: totals.unpaidCount },
    ],
    paymentMethods: [...methodMap.values()].sort((a, b) => b.value - a.value),
    recentInvoices,
  });
}
