export default function ErrorBanner({ message, onRetry, onDismiss }) {
  if (!message) return null;

  return (
    <div className="error" role="alert">
      <span>{message}</span>
      <div>
        <button className="link" onClick={onRetry}>Retry</button>
        <button className="link" onClick={onDismiss}>Dismiss</button>
      </div>
    </div>
  );
}