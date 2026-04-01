import { useState } from 'react';

const DISMISSED_KEY = 'plo-email-dismissed';
const SUBSCRIBED_KEY = 'plo-email-subscribed';

export default function EmailSubscribe() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1' || localStorage.getItem(SUBSCRIBED_KEY) === '1'
  );

  if (dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        localStorage.setItem(SUBSCRIBED_KEY, '1');
        setTimeout(() => setDismissed(true), 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setMessage('Could not connect. Try again later.');
    }
  }

  return (
    <div className="bg-surface-light rounded-xl border border-surface-lighter p-4 animate-slide-up">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-text-primary font-bold text-sm">Stay in the Loop</h3>
          <p className="text-text-muted text-xs">Optional for those who want updates</p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-text-muted hover:text-text-secondary text-lg leading-none px-1"
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>

      {status === 'success' ? (
        <div className="text-success text-sm py-2">{message}</div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 bg-surface border border-surface-lighter rounded-lg px-3 py-2 text-text-primary text-sm outline-none focus:border-gold transition-colors"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-4 py-2 bg-gold hover:bg-gold-light text-surface font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? '...' : 'Subscribe'}
          </button>
        </form>
      )}

      {status === 'error' && (
        <div className="text-danger text-xs mt-2">{message}</div>
      )}
    </div>
  );
}
