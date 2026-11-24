import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, Clock3, IndianRupee, Plus, ReceiptText, Wallet } from 'lucide-react';
import { fetchDashboard } from '../api/invoices.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { EmptyState, ErrorBanner, LoadingState } from '../components/States.jsx';
import { formatCompactCurrency, formatCurrency, formatDate } from '../utils/format.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetchDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p className="subtitle">Your invoicing overview</p>
          </div>
        </div>
        <LoadingState label="Loading dashboard…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p className="subtitle">Your invoicing overview</p>
          </div>
        </div>
        <ErrorBanner message={error} onRetry={load} />
      </div>
    );
  }

  const { totals, monthlyPayments, recentInvoices } = data;
  const hasMonthlyPayments = monthlyPayments.some((month) => month.amount > 0);

  const cards = [
    {
      label: 'Invoices',
      value: totals.invoiceCount,
      icon: ReceiptText,
      tone: 'indigo',
      meta: `${totals.paidCount} paid · ${totals.partialCount} partial · ${totals.unpaidCount} unpaid`,
    },
    {
      label: 'Total invoiced',
      value: formatCurrency(totals.totalInvoiced),
      icon: IndianRupee,
      tone: 'blue',
      meta: 'Across all invoices',
    },
    {
      label: 'Payments received',
      value: formatCurrency(totals.totalPaid),
      icon: Wallet,
      tone: 'green',
      meta: 'Sum of recorded payments',
    },
    {
      label: 'Outstanding',
      value: formatCurrency(totals.totalOutstanding),
      icon: Clock3,
      tone: 'amber',
      meta: 'Invoiced minus payments received',
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Track what you have invoiced, collected, and what is still due.</p>
        </div>
        <Link className="btn btn-primary" to="/invoices/new">
          <Plus size={16} />
          New invoice
        </Link>
      </div>

      <div className="stat-grid">
        {cards.map(({ label, value, icon: Icon, tone, meta }) => (
          <article className="stat-card" key={label}>
            <span className={`stat-icon tone-${tone}`}>
              <Icon size={20} />
            </span>
            <div className="stat-body">
              <span className="stat-label">{label}</span>
              <strong className="stat-value">{value}</strong>
              <span className="stat-meta">{meta}</span>
            </div>
          </article>
        ))}
      </div>

      <section className="panel chart-panel">
        <div className="panel-head">
          <div>
            <h2>Payments received</h2>
            <p>Total payments recorded per month over the last 6 months</p>
          </div>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyPayments} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf5" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                tickFormatter={formatCompactCurrency}
                tickLine={false}
                axisLine={false}
                width={64}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                cursor={{ fill: 'rgba(79, 70, 229, 0.06)' }}
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  fontSize: 13,
                }}
              />
              <Bar
                dataKey="amount"
                name="Payments"
                fill="#4f46e5"
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {!hasMonthlyPayments && (
          <p className="chart-note">No payments recorded in the last 6 months yet.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-head panel-head-row">
          <div>
            <h2>Recent invoices</h2>
            <p>The five most recently created invoices</p>
          </div>
          <Link className="text-link" to="/invoices">
            View all
            <ArrowRight size={15} />
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            description="Create your first invoice to start tracking payments."
            action={
              <Link className="btn btn-primary" to="/invoices/new">
                <Plus size={16} />
                Create invoice
              </Link>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th className="col-mobile-hide">Customer</th>
                  <th className="col-optional">Issued</th>
                  <th className="align-right">Total</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td className="nowrap strong invoice-cell" data-customer={invoice.customerName}>
                      {invoice.invoiceNumber}
                    </td>
                    <td className="col-mobile-hide">{invoice.customerName}</td>
                    <td className="nowrap muted col-optional">{formatDate(invoice.issueDate)}</td>
                    <td className="align-right nowrap">{formatCurrency(invoice.amount)}</td>
                    <td>
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="align-right">
                      <Link className="text-link" to={`/invoices/${invoice._id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
