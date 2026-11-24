import mongoose from 'mongoose';
import Invoice from '../models/Invoice.js';
import Payment, { PAYMENT_METHODS } from '../models/Payment.js';
import { round2, withPaymentSummary } from '../utils/calculations.js';
import { generateInvoiceNumber } from '../utils/invoiceNumber.js';

function parseDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function validateInvoicePayload(body) {
  const errors = [];

  const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
  if (!customerName) errors.push('Customer name is required');
  else if (customerName.length > 100) errors.push('Customer name must be 100 characters or fewer');

  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (!description) errors.push('Description is required');
  else if (description.length > 500) errors.push('Description must be 500 characters or fewer');

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push('Amount must be a number greater than 0');
  }

  const issueDate =
    body.issueDate === undefined || body.issueDate === null || body.issueDate === ''
      ? new Date()
      : parseDate(body.issueDate);
  if (issueDate === undefined) errors.push('Issue date is invalid');

  let dueDate = null;
  if (body.dueDate !== undefined && body.dueDate !== null && body.dueDate !== '') {
    dueDate = parseDate(body.dueDate);
    if (dueDate === undefined) errors.push('Due date is invalid');
  }
  if (dueDate && issueDate && dueDate < issueDate) {
    errors.push('Due date cannot be before the issue date');
  }

  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  if (notes.length > 500) errors.push('Notes must be 500 characters or fewer');

  return {
    errors,
    value: {
      customerName,
      description,
      amount: round2(amount),
      issueDate,
      dueDate,
      notes,
    },
  };
}

async function getPaidTotal(invoiceId) {
  const [result] = await Payment.aggregate([
    { $match: { invoice: invoiceId } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return round2(result?.total || 0);
}

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  'amount-desc': { amount: -1 },
  'amount-asc': { amount: 1 },
};

const STATUS_FILTERS = {
  paid: 'Paid',
  partial: 'Partially Paid',
  unpaid: 'Unpaid',
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseAmountQuery(value) {
  if (value === undefined || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : undefined;
}

export async function getInvoices(req, res) {
  const query = req.query || {};
  const filter = {};

  const search = typeof query.search === 'string' ? query.search.trim() : '';
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { invoiceNumber: pattern },
      { customerName: pattern },
      { description: pattern },
    ];
  }

  const issueFrom = parseDate(query.from);
  const issueTo = parseDate(query.to);
  if (issueFrom === undefined || issueTo === undefined) {
    return res.status(400).json({ message: 'Issue date range is invalid' });
  }
  if (issueFrom && issueTo && issueFrom > issueTo) {
    return res.status(400).json({ message: 'Issued from cannot be after issued to' });
  }
  if (issueFrom || issueTo) {
    filter.issueDate = {};
    if (issueFrom) filter.issueDate.$gte = issueFrom;
    if (issueTo) {
      const end = new Date(issueTo);
      end.setUTCHours(23, 59, 59, 999);
      filter.issueDate.$lte = end;
    }
  }

  const minAmount = parseAmountQuery(query.minAmount);
  const maxAmount = parseAmountQuery(query.maxAmount);
  if (minAmount === undefined || maxAmount === undefined) {
    return res.status(400).json({ message: 'Amount filters must be non-negative numbers' });
  }
  if (minAmount !== null && maxAmount !== null && minAmount > maxAmount) {
    return res.status(400).json({ message: 'Minimum amount cannot be greater than maximum' });
  }
  if (minAmount !== null || maxAmount !== null) {
    filter.amount = {};
    if (minAmount !== null) filter.amount.$gte = minAmount;
    if (maxAmount !== null) filter.amount.$lte = maxAmount;
  }

  const sortKey = typeof query.sort === 'string' && query.sort ? query.sort : 'newest';
  if (sortKey !== 'due-asc' && !SORT_OPTIONS[sortKey]) {
    return res
      .status(400)
      .json({ message: `Sort must be one of: ${Object.keys(SORT_OPTIONS).join(', ')}, due-asc` });
  }

  const statusKey = typeof query.status === 'string' ? query.status.toLowerCase() : '';
  if (statusKey && statusKey !== 'overdue' && !STATUS_FILTERS[statusKey]) {
    return res
      .status(400)
      .json({ message: 'Status must be one of: paid, partial, unpaid, overdue' });
  }

  const invoices = await Invoice.find(filter)
    .sort(SORT_OPTIONS[sortKey] || { createdAt: -1 })
    .lean();

  const sums = await Payment.aggregate([
    { $match: { invoice: { $in: invoices.map((invoice) => invoice._id) } } },
    { $group: { _id: '$invoice', paid: { $sum: '$amount' } } },
  ]);
  const paidMap = new Map(sums.map((entry) => [String(entry._id), entry.paid]));

  let summaries = invoices.map((invoice) =>
    withPaymentSummary(invoice, paidMap.get(String(invoice._id)) || 0)
  );

  if (statusKey) {
    summaries =
      statusKey === 'overdue'
        ? summaries.filter((invoice) => invoice.isOverdue)
        : summaries.filter((invoice) => invoice.status === STATUS_FILTERS[statusKey]);
  }

  if (sortKey === 'due-asc') {
    summaries.sort((a, b) => {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (aDue !== bDue) return aDue - bDue;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  res.json(summaries);
}

export async function getInvoiceById(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid invoice id' });
  }

  const invoice = await Invoice.findById(req.params.id).lean();
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  const payments = await Payment.find({ invoice: invoice._id })
    .sort({ date: -1, createdAt: -1 })
    .lean();
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  res.json({ ...withPaymentSummary(invoice, paid), payments });
}

export async function createInvoice(req, res) {
  const { errors, value } = validateInvoicePayload(req.body || {});
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  let invoice;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      invoice = await Invoice.create({
        invoiceNumber: await generateInvoiceNumber(),
        ...value,
      });
      break;
    } catch (error) {
      // Two invoices can compute the same number at the same moment; retry with a fresh number.
      if (error.code === 11000 && attempt < 2) continue;
      throw error;
    }
  }

  res.status(201).json(withPaymentSummary(invoice.toObject(), 0));
}

export async function updateInvoice(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid invoice id' });
  }

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  const { errors, value } = validateInvoicePayload(req.body || {});
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  const paid = await getPaidTotal(invoice._id);
  if (value.amount < paid) {
    return res.status(400).json({
      message: `Invoice amount cannot be lower than the amount already paid (${paid})`,
    });
  }

  invoice.customerName = value.customerName;
  invoice.description = value.description;
  invoice.amount = value.amount;
  invoice.issueDate = value.issueDate;
  invoice.dueDate = value.dueDate;
  invoice.notes = value.notes;
  await invoice.save();

  res.json(withPaymentSummary(invoice.toObject(), paid));
}

export async function deleteInvoice(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid invoice id' });
  }

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  await Payment.deleteMany({ invoice: invoice._id });
  await invoice.deleteOne();

  res.json({ message: 'Invoice deleted successfully' });
}

export async function recordPayment(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid invoice id' });
  }

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  const paid = await getPaidTotal(invoice._id);
  const remaining = round2(invoice.amount - paid);

  if (remaining <= 0) {
    return res.status(400).json({ message: 'This invoice is already fully paid' });
  }

  const errors = [];
  const body = req.body || {};
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push('Payment amount must be greater than 0');
  } else if (round2(amount) > remaining) {
    errors.push(`Payment exceeds the remaining balance of ${remaining}`);
  }

  const method = body.method || 'Other';
  if (!PAYMENT_METHODS.includes(method)) {
    errors.push(`Payment method must be one of: ${PAYMENT_METHODS.join(', ')}`);
  }

  let date = new Date();
  if (body.date !== undefined && body.date !== null && body.date !== '') {
    date = new Date(body.date);
    if (Number.isNaN(date.getTime())) errors.push('Payment date is invalid');
  }

  const note = typeof body.note === 'string' ? body.note.trim() : '';
  if (note.length > 200) errors.push('Note must be 200 characters or fewer');

  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  const payment = await Payment.create({
    invoice: invoice._id,
    amount: round2(amount),
    method,
    date,
    note,
  });

  res.status(201).json({
    payment,
    invoice: withPaymentSummary(invoice.toObject(), round2(paid + payment.amount)),
  });
}

export async function markInvoicePaid(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid invoice id' });
  }

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  const paid = await getPaidTotal(invoice._id);
  const remaining = round2(invoice.amount - paid);

  if (remaining <= 0) {
    return res.status(400).json({ message: 'This invoice is already fully paid' });
  }

  const method = PAYMENT_METHODS.includes((req.body || {}).method) ? req.body.method : 'Other';

  const payment = await Payment.create({
    invoice: invoice._id,
    amount: remaining,
    method,
    date: new Date(),
    note: 'Remaining balance marked as paid',
  });

  res.status(201).json({
    payment,
    invoice: withPaymentSummary(invoice.toObject(), invoice.amount),
  });
}
