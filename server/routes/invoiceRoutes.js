import { Router } from 'express';
import {
  createInvoice,
  deleteInvoice,
  getInvoiceById,
  getInvoices,
  markInvoicePaid,
  recordPayment,
  updateInvoice,
} from '../controllers/invoiceController.js';

const router = Router();

router.route('/').get(getInvoices).post(createInvoice);
router.route('/:id').get(getInvoiceById).put(updateInvoice).delete(deleteInvoice);
router.post('/:id/payments', recordPayment);
router.post('/:id/mark-paid', markInvoicePaid);

export default router;
