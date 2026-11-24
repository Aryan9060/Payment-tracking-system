import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createInvoice, fetchInvoice, updateInvoice } from '../api/invoices.js';
import { ErrorBanner, LoadingState } from '../components/States.jsx';
import { formatCurrency, todayInput, toInputDate } from '../utils/format.js';

const EMPTY_FORM = {
  customerName: '',
  description: '',
  amount: '',
  issueDate: todayInput(),
  dueDate: '',
  notes: '',
};

export default function InvoiceForm({ mode }) {
  const isEdit = mode === 'edit';
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return undefined;

    let active = true;
    fetchInvoice(id)
      .then((invoice) => {
        if (!active) return;
        setForm({
          customerName: invoice.customerName,
          description: invoice.description,
          amount: String(invoice.amount),
          issueDate: toInputDate(invoice.issueDate),
          dueDate: toInputDate(invoice.dueDate),
          notes: invoice.notes || '',
        });
        setInvoiceNumber(invoice.invoiceNumber);
        setPaidAmount(invoice.paidAmount);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, isEdit]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      customerName: form.customerName,
      description: form.description,
      amount: Number(form.amount),
      issueDate: form.issueDate,
      dueDate: form.dueDate || null,
      notes: form.notes,
    };

    try {
      const saved = isEdit ? await updateInvoice(id, payload) : await createInvoice(payload);
      navigate(`/invoices/${saved._id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page page-narrow">
        <LoadingState label="Loading invoice…" />
      </div>
    );
  }

  return (
    <div className="page page-narrow">
      <Link className="back-link" to={isEdit ? `/invoices/${id}` : '/invoices'}>
        <ArrowLeft size={15} />
        {isEdit ? 'Back to invoice' : 'Back to invoices'}
      </Link>

      <div className="page-header">
        <div>
          <h1>{isEdit ? `Edit ${invoiceNumber}` : 'New invoice'}</h1>
          <p className="subtitle">
            {isEdit
              ? 'Update the invoice details. The paid amount is managed by recorded payments.'
              : 'Bill a customer for a product or service.'}
          </p>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <form className="panel form-panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>Customer name</span>
            <input
              type="text"
              name="customerName"
              required
              maxLength={100}
              value={form.customerName}
              onChange={updateField('customerName')}
              placeholder="e.g. Acme Traders"
            />
          </label>

          <label className="field">
            <span>Amount (INR)</span>
            <input
              type="number"
              name="amount"
              required
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={updateField('amount')}
              placeholder="0.00"
            />
            {isEdit && paidAmount > 0 && (
              <small>Already paid: {formatCurrency(paidAmount)}. Amount cannot go below this.</small>
            )}
          </label>

          <label className="field">
            <span>Issue date</span>
            <input type="date" name="issueDate" required value={form.issueDate} onChange={updateField('issueDate')} />
          </label>

          <label className="field">
            <span>Due date (optional)</span>
            <input type="date" name="dueDate" value={form.dueDate} onChange={updateField('dueDate')} />
          </label>

          <label className="field field-full">
            <span>Description</span>
            <textarea
              name="description"
              required
              rows={3}
              maxLength={500}
              value={form.description}
              onChange={updateField('description')}
              placeholder="What is this invoice for?"
            />
          </label>

          <label className="field field-full">
            <span>Notes (optional)</span>
            <textarea
              name="notes"
              rows={2}
              maxLength={500}
              value={form.notes}
              onChange={updateField('notes')}
              placeholder="Payment terms or other details"
            />
          </label>
        </div>

        <div className="form-actions">
          <Link className="btn btn-secondary" to={isEdit ? `/invoices/${id}` : '/invoices'}>
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
