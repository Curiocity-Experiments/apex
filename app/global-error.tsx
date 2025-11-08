'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              maxWidth: '28rem',
              width: '100%',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '1.5rem',
            }}
          >
            <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>
              Something went wrong
            </h2>
            <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
              A critical error occurred. Please reload the page.
            </p>
            {error.message && (
              <details
                style={{
                  backgroundColor: '#f9fafb',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  marginBottom: '1rem',
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: '500',
                    color: '#374151',
                  }}
                >
                  Error details
                </summary>
                <pre
                  style={{
                    marginTop: '0.5rem',
                    overflow: 'auto',
                    fontSize: '0.75rem',
                    color: '#6b7280',
                  }}
                >
                  {error.message}
                </pre>
              </details>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
