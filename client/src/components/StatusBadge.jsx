const CLASSES = {
  Paid: 'badge badge-paid',
  'Partially Paid': 'badge badge-partial',
  Unpaid: 'badge badge-unpaid',
};

export default function StatusBadge({ status }) {
  return (
    <span className={CLASSES[status] || 'badge'}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}
