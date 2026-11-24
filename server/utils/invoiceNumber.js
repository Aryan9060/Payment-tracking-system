import Counter from '../models/Counter.js';
import Invoice from '../models/Invoice.js';

const COUNTER_ID = 'invoice';
const format = (n) => `INV-${String(n).padStart(4, '0')}`;

/**
 * Keeps invoice numbers monotonic. A dedicated counter collection is used
 * instead of counting invoices, so deleting an invoice never frees its number.
 */
export async function initializeInvoiceCounter() {
  const [latest] = await Invoice.aggregate([
    { $project: { sequence: { $toInt: { $substrCP: ['$invoiceNumber', 4, 10] } } } },
    { $sort: { sequence: -1 } },
    { $limit: 1 },
  ]);

  await Counter.updateOne(
    { _id: COUNTER_ID },
    { $max: { seq: latest?.sequence || 0 } },
    { upsert: true }
  );
}

export async function generateInvoiceNumber() {
  const counter = await Counter.findByIdAndUpdate(
    COUNTER_ID,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return format(counter.seq);
}
