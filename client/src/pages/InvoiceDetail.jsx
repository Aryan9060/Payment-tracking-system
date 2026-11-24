import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard } from 'lucide-react';
import {
  deleteInvoice,
  fetchInvoice,
  markInvoicePaid,
  recordPayment,
} from '../api/invoices.js';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  ErrorBanner,
  LoadingState,
  SuccessBanner,
} from '../components/States.jsx';
import { formatCurrency, formatDate, todayInput } from '../utils/format.js';

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'];

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [payment, setPayment] = useState({
    amount: '',
    method: 'Cash',
    date: todayInput(),
    note: '',
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchInvoice(id)
      .then((data) => {
        if (active) {
          setInvoice(data);
          setError('');
        }
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
  }, [id]);

  async function refresh() {
    const data = await fetchInvoice(id);
    setInvoice(data);
  }

  async function handleRecordPayment(event) {
    event.preventDefault();
    setBusy(true);
    setActionError('');
    setSuccess('');
    try {
      await recordPayment(id, {
        amount: Number(payment.amount),
        method: payment.method,
        date: payment.date,
        note: payment.note,
      });
      setSuccess('Payment recorded successfully.');
      setPayment({ amount: '', method: 'Cash', date: todayInput(), note: '' });
      await refresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkPaid() {
    const confirmed = window.confirm(
      `Record a payment of ${formatCurrency(invoice.remainingAmount)} for ${invoice.invoiceNumber}?`
    );
    if (!confirmed) return;

    setBusy(true);
    setActionError('');
    setSuccess('');
    try {
      await markInvoicePaid(id);
      setSuccess('Invoice marked as paid.');
      await refresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete ${invoice.invoiceNumber}? Its payment history will also be removed.`
    );
    if (!confirmed) return;

    setBusy(true);
    setActionError('');
    try {
      await deleteInvoice(id);
      navigate('/invoices');
    } catch (err) {
      setActionError(err.message);
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <LoadingState label="Loading invoice…" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="page">
        <ErrorBanner message={error || 'Invoice not found'} />
        <Link className="text-link" to="/invoices">
          <ArrowLeft size={15} />
          Back to invoices
        </Link>
      </div>
    );
  }

  const progress = invoice.amount > 0 ? Math.min((invoice.paidAmount / invoice.amount) * 100, 100) : 0;

  return (
    <div className="page">
      <Link className="back-link" to="/invoices">
        <ArrowLeft size={15} />
        Back to invoices
      </Link>

      <div className="page-header">
        <div>
          <div className="title-row">
            <h1>{invoice.invoiceNumber}</h1>
            <StatusBadge status={invoice.status} overdue={invoice.isOverdue} />
          </div>
          <p className="subtitle">
            {invoice.customerName} · Issued {formatDate(invoice.issueDate)}
          </p>
        </div>
        <div className="header-actions">
          <Link className="btn btn-secondary" to={`/invoices/${invoice._id}/edit`}>
            Edit
          </Link>
          {invoice.remainingAmount > 0 && (
            <button type="button" className="btn btn-primary" onClick={handleMarkPaid} disabled={busy}>
              Mark as paid
            </button>
          )}
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={busy}>
            Delete
          </button>
        </div>
      </div>

      {actionError && <ErrorBanner message={actionError} />}
      {success && <SuccessBanner message={success} />}

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-head">
              <h2>Invoice details</h2>
            </div>
            <dl className="detail-list">
              <div>
                <dt>Customer</dt>
                <dd>{invoice.customerName}</dd>
              </div>
              <div>
                <dt>Invoice amount</dt>
                <dd>{formatCurrency(invoice.amount)}</dd>
              </div>
              <div>
                <dt>Issue date</dt>
                <dd>{formatDate(invoice.issueDate)}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>{formatDate(invoice.dueDate)}</dd>
              </div>
              <div className="detail-full">
                <dt>Description</dt>
                <dd className="pre-line">{invoice.description}</dd>
              </div>
              {invoice.notes && (
                <div className="detail-full">
                  <dt>Notes</dt>
                  <dd className="pre-line">{invoice.notes}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Payment history</h2>
              <p>{invoice.payments.length === 0 ? 'No payments yet' : `${invoice.payments.length} payment(s)`}</p>
            </div>
            {invoice.payments.length === 0 ? (
              <p className="muted-note">Payments you record will appear here.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Note</th>
                      <th className="align-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.payments.map((entry) => (
                      <tr key={entry._id}>
                        <td className="nowrap">{formatDate(entry.date)}</td>
                        <td className="nowrap">{entry.method}</td>
                        <td className="muted">{entry.note || '—'}</td>
                        <td className="align-right nowrap">{formatCurrency(entry.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="detail-side">
          <section className="panel">
            <div className="panel-head">
              <h2>Payment summary</h2>
            </div>

            <div className="remaining-block">
              <span className="stat-label">Remaining balance</span>
              <strong className={invoice.remainingAmount > 0 ? 'remaining-value' : 'remaining-value paid'}>
                {formatCurrency(invoice.remainingAmount)}
              </strong>
              <div className="progress-track" aria-hidden="true">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="progress-caption">{progress.toFixed(0)}% collected</span>
            </div>

            <dl className="summary-list">
              <div>
                <dt>Invoice total</dt>
                <dd>{formatCurrency(invoice.amount)}</dd>
              </div>
              <div>
                <dt>Paid to date</dt>
                <dd className="paid-text">{formatCurrency(invoice.paidAmount)}</dd>
              </div>
              <div>
                <dt>Remaining</dt>
                <dd>{formatCurrency(invoice.remainingAmount)}</dd>
              </div>
            </dl>
          </section>

          {invoice.remainingAmount > 0 ? (
            <section className="panel">
              <div className="panel-head">
                <h2>Record payment</h2>
                <p>Partial payments are supported</p>
              </div>
              <form className="stack-form" onSubmit={handleRecordPayment}>
                <label className="field">
                  <span>Amount (INR)</span>
                  <input
                    type="number"
                    name="paymentAmount"
                    min="0.01"
                    max={invoice.remainingAmount}
                    step="0.01"
                    required
                    value={payment.amount}
                    onChange={(event) =>
                      setPayment((current) => ({ ...current, amount: event.target.value }))
                    }
                  />
                  <small>Remaining balance: {formatCurrency(invoice.remainingAmount)}</small>
                </label>

                <label className="field">
                  <span>Method</span>
                  <select
                    name="paymentMethod"
                    value={payment.method}
                    onChange={(event) =>
                      setPayment((current) => ({ ...current, method: event.target.value }))
                    }
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Payment date</span>
                  <input
                    type="date"
                    name="paymentDate"
                    required
                    value={payment.date}
                    onChange={(event) =>
                      setPayment((current) => ({ ...current, date: event.target.value }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Note (optional)</span>
                  <input
                    type="text"
                    name="paymentNote"
                    maxLength={200}
                    value={payment.note}
                    onChange={(event) =>
                      setPayment((current) => ({ ...current, note: event.target.value }))
                    }
                    placeholder="e.g. Advance payment"
                  />
                </label>

                <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                  <CreditCard size={16} />
                  Record payment
                </button>
              </form>
            </section>
          ) : (
            <section className="panel paid-panel">
              <CreditCard size={22} />
              <h2>Fully paid</h2>
              <p>Every rupee on this invoice has been received.</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
