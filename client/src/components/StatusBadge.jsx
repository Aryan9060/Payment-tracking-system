const CLASSES = {
  Paid: 'badge badge-paid',
  'Partially Paid': 'badge badge-partial',
  Unpaid: 'badge badge-unpaid',
};

export default function StatusBadge({ status, overdue = false }) {
  return (
    <span className="badge-stack">
      <span className={CLASSES[status] || 'badge'}>
        <span className="badge-dot" />
        {status}
      </span>
      {overdue && status !== 'Paid' && (
        <span className="badge badge-overdue">
          <span className="badge-dot" />
          Overdue
        </span>
      )}
    </span>
  );
}
