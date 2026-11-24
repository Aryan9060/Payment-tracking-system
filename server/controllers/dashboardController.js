import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import { getPaymentStatus, round2, withPaymentSummary } from '../utils/calculations.js';

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
  };

  for (const invoice of invoices) {
    const paid = paidMap.get(String(invoice._id)) || 0;
    const status = getPaymentStatus(invoice.amount, paid);

    totals.totalInvoiced = round2(totals.totalInvoiced + invoice.amount);
    totals.totalOutstanding = round2(totals.totalOutstanding + Math.max(round2(invoice.amount - paid), 0));

    if (status === 'Paid') totals.paidCount += 1;
    else if (status === 'Partially Paid') totals.partialCount += 1;
    else totals.unpaidCount += 1;
  }

  const months = [];
  const now = new Date();
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      amount: 0,
    });
  }

  const monthIndex = new Map(months.map((month, index) => [month.key, index]));
  for (const payment of payments) {
    const date = new Date(payment.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const index = monthIndex.get(key);
    if (index !== undefined) {
      months[index].amount = round2(months[index].amount + payment.amount);
    }
  }

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((invoice) => withPaymentSummary(invoice, paidMap.get(String(invoice._id)) || 0));

  res.json({
    totals,
    monthlyPayments: months.map(({ label, amount }) => ({ label, amount })),
    recentInvoices,
  });
}
