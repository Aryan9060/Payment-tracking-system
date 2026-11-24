import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { deleteInvoice, fetchInvoices } from '../api/invoices.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { EmptyState, ErrorBanner, LoadingState, SuccessBanner } from '../components/States.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetchInvoices()
      .then(setInvoices)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(invoice) {
    const confirmed = window.confirm(
      `Delete ${invoice.invoiceNumber}? Its payment history will also be removed.`
    );
    if (!confirmed) return;

    setDeletingId(invoice._id);
    setError('');
    setSuccess('');
    try {
      await deleteInvoice(invoice._id);
      setInvoices((current) => current.filter((item) => item._id !== invoice._id));
      setSuccess(`${invoice.invoiceNumber} was deleted.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p className="subtitle">
            {invoices.length === 1 ? '1 invoice' : `${invoices.length} invoices`} in this workspace
          </p>
        </div>
        <Link className="btn btn-primary" to="/invoices/new">
          <Plus size={16} />
          New invoice
        </Link>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {success && <SuccessBanner message={success} />}

      {loading ? (
        <LoadingState label="Loading invoices…" />
      ) : invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create an invoice, then record full or partial payments against it."
          action={
            <Link className="btn btn-primary" to="/invoices/new">
              <Plus size={16} />
              Create invoice
            </Link>
          }
        />
      ) : (
        <section className="panel panel-flush">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th className="col-mobile-hide">Customer</th>
                  <th className="col-optional">Description</th>
                  <th className="col-optional">Issued</th>
                  <th className="col-optional">Due</th>
                  <th className="align-right">Total</th>
                  <th className="align-right col-optional">Paid</th>
                  <th className="align-right col-optional">Remaining</th>
                  <th>Status</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td className="nowrap invoice-cell" data-customer={invoice.customerName}>
                      <Link className="table-link" to={`/invoices/${invoice._id}`}>
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="nowrap col-mobile-hide">{invoice.customerName}</td>
                    <td className="cell-desc col-optional" title={invoice.description}>
                      {invoice.description}
                    </td>
                    <td className="nowrap muted col-optional">{formatDate(invoice.issueDate)}</td>
                    <td className="nowrap muted col-optional">{formatDate(invoice.dueDate)}</td>
                    <td className="align-right nowrap">{formatCurrency(invoice.amount)}</td>
                    <td className="align-right nowrap paid-text col-optional">{formatCurrency(invoice.paidAmount)}</td>
                    <td className="align-right nowrap col-optional">{formatCurrency(invoice.remainingAmount)}</td>
                    <td>
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="align-right nowrap">
                      <div className="row-actions">
                        <Link
                          className="icon-btn"
                          to={`/invoices/${invoice._id}`}
                          title="View invoice"
                          aria-label={`View ${invoice.invoiceNumber}`}
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          className="icon-btn"
                          to={`/invoices/${invoice._id}/edit`}
                          title="Edit invoice"
                          aria-label={`Edit ${invoice.invoiceNumber}`}
                        >
                          <Pencil size={16} />
                        </Link>
                        <button
                          type="button"
                          className="icon-btn icon-btn-danger"
                          onClick={() => handleDelete(invoice)}
                          disabled={deletingId === invoice._id}
                          title="Delete invoice"
                          aria-label={`Delete ${invoice.invoiceNumber}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
