import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { deleteInvoice, fetchInvoices } from '../api/invoices.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { EmptyState, ErrorBanner, LoadingState, SuccessBanner } from '../components/States.jsx';
import { formatCurrency, formatDate, toInputDate } from '../utils/format.js';

const EMPTY_FILTERS = {
  search: '',
  status: '',
  from: '',
  to: '',
  minAmount: '',
  maxAmount: '',
  sort: 'newest',
};

function buildParams(filters) {
  const params = {};
  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.status) params.status = filters.status;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.minAmount !== '') params.minAmount = filters.minAmount;
  if (filters.maxAmount !== '') params.maxAmount = filters.maxAmount;
  if (filters.sort !== 'newest') params.sort = filters.sort;
  return params;
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setRefreshing(true);
    setError('');
    const timer = setTimeout(
      () => {
        fetchInvoices(buildParams(filters))
          .then((data) => {
            if (active) setInvoices(data);
          })
          .catch((err) => {
            if (active) setError(err.message);
          })
          .finally(() => {
            if (active) {
              setLoading(false);
              setRefreshing(false);
            }
          });
      },
      filters.search ? 300 : 0
    );

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filters, reloadKey]);

  const updateFilter = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const hasFilters =
    Boolean(filters.search || filters.status || filters.from || filters.to) ||
    filters.minAmount !== '' ||
    filters.maxAmount !== '' ||
    filters.sort !== 'newest';

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

  function exportCsv() {
    const header = [
      'Invoice',
      'Customer',
      'Description',
      'Issued',
      'Due',
      'Total',
      'Paid',
      'Remaining',
      'Status',
      'Overdue',
    ];
    const rows = invoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.customerName,
      invoice.description,
      toInputDate(invoice.issueDate),
      toInputDate(invoice.dueDate),
      invoice.amount.toFixed(2),
      invoice.paidAmount.toFixed(2),
      invoice.remainingAmount.toFixed(2),
      invoice.status,
      invoice.isOverdue ? 'Yes' : 'No',
    ]);
    const csv = `\uFEFF${[header, ...rows]
      .map((row) => row.map(csvCell).join(','))
      .join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const countLabel = `${invoices.length} ${invoices.length === 1 ? 'invoice' : 'invoices'}`;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p className="subtitle">
            {loading
              ? 'Loading invoices…'
              : `${countLabel} ${
                  hasFilters
                    ? invoices.length === 1
                      ? 'matches your filters'
                      : 'match your filters'
                    : 'in this workspace'
                }`}
            {refreshing && !loading ? ' · updating…' : ''}
          </p>
        </div>
        <Link className="btn btn-primary" to="/invoices/new">
          <Plus size={16} />
          New invoice
        </Link>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => setReloadKey((key) => key + 1)} />}
      {success && <SuccessBanner message={success} />}

      {loading ? (
        <LoadingState label="Loading invoices…" />
      ) : (
        <>
          <section className="panel filter-panel" aria-label="Invoice filters">
            <div className="filter-top">
              <div className="search-box">
                <Search size={16} aria-hidden="true" />
                <input
                  type="search"
                  name="invoiceSearch"
                  placeholder="Search invoices…"
                  aria-label="Search invoices"
                  value={filters.search}
                  onChange={(event) => updateFilter('search', event.target.value)}
                />
                {filters.search && (
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => updateFilter('search', '')}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="filter-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={exportCsv}
                  disabled={invoices.length === 0}
                >
                  <Download size={15} />
                  Export CSV
                </button>
                {hasFilters && (
                  <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                    <X size={15} />
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="filter-grid">
              <label className="field">
                <span>Status</span>
                <select
                  name="statusFilter"
                  value={filters.status}
                  onChange={(event) => updateFilter('status', event.target.value)}
                >
                  <option value="">All statuses</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partially paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </label>
              <label className="field">
                <span>Issued from</span>
                <input
                  type="date"
                  name="issueFrom"
                  value={filters.from}
                  onChange={(event) => updateFilter('from', event.target.value)}
                />
              </label>
              <label className="field">
                <span>Issued to</span>
                <input
                  type="date"
                  name="issueTo"
                  value={filters.to}
                  onChange={(event) => updateFilter('to', event.target.value)}
                />
              </label>
              <label className="field">
                <span>Min amount</span>
                <input
                  type="number"
                  name="minAmount"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(event) => updateFilter('minAmount', event.target.value)}
                />
              </label>
              <label className="field">
                <span>Max amount</span>
                <input
                  type="number"
                  name="maxAmount"
                  min="0"
                  step="0.01"
                  placeholder="Any"
                  value={filters.maxAmount}
                  onChange={(event) => updateFilter('maxAmount', event.target.value)}
                />
              </label>
              <label className="field">
                <span>Sort by</span>
                <select
                  name="invoiceSort"
                  value={filters.sort}
                  onChange={(event) => updateFilter('sort', event.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="amount-desc">Amount: high to low</option>
                  <option value="amount-asc">Amount: low to high</option>
                  <option value="due-asc">Due date: soonest</option>
                </select>
              </label>
            </div>
          </section>

          {invoices.length === 0 ? (
            error ? null : hasFilters ? (
              <EmptyState
                title="No matching invoices"
                description="Try a different search term, widen the date or amount range, or clear the filters."
                action={
                  <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                    <X size={15} />
                    Clear filters
                  </button>
                }
              />
            ) : (
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
            )
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
                        <td className="align-right nowrap paid-text col-optional">
                          {formatCurrency(invoice.paidAmount)}
                        </td>
                        <td className="align-right nowrap col-optional">
                          {formatCurrency(invoice.remainingAmount)}
                        </td>
                        <td>
                          <StatusBadge status={invoice.status} overdue={invoice.isOverdue} />
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
        </>
      )}
    </div>
  );
}
