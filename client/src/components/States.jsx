import { AlertCircle, Inbox } from 'lucide-react';

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="state-box">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  return (
    <div className="banner banner-error" role="alert">
      <AlertCircle size={18} />
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="banner-action" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function SuccessBanner({ message }) {
  return (
    <div className="banner banner-success" role="status">
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <Inbox size={32} strokeWidth={1.6} />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
