import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
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

const STATUS_COLORS = {
  Paid: '#16a34a',
  'Partially Paid': '#f59e0b',
  Unpaid: '#dc2626',
};
const METHOD_COLORS = ['#ea580c', '#f59e0b', '#0d9488', '#6366f1', '#78716c'];

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid #f0e2d6',
  fontSize: 13,
};

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

  const { totals, monthlySeries, statusDistribution, paymentMethods, recentInvoices } = data;
  const hasMonthlyActivity = monthlySeries.some(
    (month) => month.invoiced > 0 || month.collected > 0
  );
  const statusData = statusDistribution.filter((entry) => entry.value > 0);
  const methodData = paymentMethods.filter((entry) => entry.value > 0);
  const collectionRate = Math.min(totals.collectionRate, 100);

  const cards = [
    {
      label: 'Invoices',
      value: totals.invoiceCount,
      icon: ReceiptText,
      tone: 'orange',
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
      meta: `${collectionRate}% of invoiced value collected`,
    },
    {
      label: 'Outstanding',
      value: formatCurrency(totals.totalOutstanding),
      icon: Clock3,
      tone: 'amber',
      meta:
        totals.overdueCount > 0
          ? `${totals.overdueCount} overdue · ${formatCurrency(totals.overdueAmount)} past due`
          : 'Invoiced minus payments received',
      metaClass: totals.overdueCount > 0 ? 'overdue-text' : '',
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
        {cards.map(({ label, value, icon: Icon, tone, meta, metaClass }) => (
          <article className="stat-card" key={label}>
            <span className={`stat-icon tone-${tone}`}>
              <Icon size={20} />
            </span>
            <div className="stat-body">
              <span className="stat-label">{label}</span>
              <strong className="stat-value">{value}</strong>
              <span className={`stat-meta ${metaClass || ''}`}>{meta}</span>
            </div>
          </article>
        ))}
      </div>

      <section className="panel chart-panel">
        <div className="panel-head panel-head-row">
          <div>
            <h2>Invoiced vs collected</h2>
            <p>Invoice value and payments recorded per month over the last 6 months</p>
          </div>
          <span className="rate-pill">{collectionRate}% collected</span>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlySeries}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1e7dd" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#78716c', fontSize: 12 }}
              />
              <YAxis
                tickFormatter={formatCompactCurrency}
                tickLine={false}
                axisLine={false}
                width={64}
                tick={{ fill: '#78716c', fontSize: 12 }}
              />
              <Tooltip
                formatter={(value, name) => [formatCurrency(value), name]}
                cursor={{ fill: 'rgba(234, 88, 12, 0.06)' }}
                contentStyle={tooltipStyle}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="invoiced"
                name="Invoiced"
                fill="#a8a29e"
                radius={[6, 6, 0, 0]}
                maxBarSize={30}
                isAnimationActive={false}
              />
              <Bar
                dataKey="collected"
                name="Collected"
                fill="#ea580c"
                radius={[6, 6, 0, 0]}
                maxBarSize={30}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {!hasMonthlyActivity && (
          <p className="chart-note">No invoices or payments in the last 6 months yet.</p>
        )}
        <div className="collection-meter">
          <div className="collection-meter-head">
            <span>Collection progress</span>
            <strong>{collectionRate}%</strong>
          </div>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${collectionRate}%` }} />
          </div>
          <span className="progress-caption">
            {formatCurrency(totals.totalPaid)} collected of {formatCurrency(totals.totalInvoiced)}{' '}
            invoiced
          </span>
        </div>
      </section>

      <div className="chart-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Invoice status</h2>
            <p>How many invoices are paid, partial, or unpaid</p>
          </div>
          {statusData.length === 0 ? (
            <p className="chart-note">No invoices yet.</p>
          ) : (
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} invoice${value === 1 ? '' : 's'}`,
                      name,
                    ]}
                    contentStyle={tooltipStyle}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Payment methods</h2>
            <p>Amount received through each method, all time</p>
          </div>
          {methodData.length === 0 ? (
            <p className="chart-note">No payments recorded yet.</p>
          ) : (
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={methodData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {methodData.map((entry, index) => (
                      <Cell key={entry.name} fill={METHOD_COLORS[index % METHOD_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [formatCurrency(value), name]}
                    contentStyle={tooltipStyle}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

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
                      <StatusBadge status={invoice.status} overdue={invoice.isOverdue} />
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
