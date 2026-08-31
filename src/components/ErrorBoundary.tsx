import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1f2937',
          color: 'white',
          padding: 20,
          fontFamily: 'monospace',
        }}>
          <div style={{ maxWidth: 600, textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: 20 }}>⚠️ Erreur</h1>
            <p style={{ marginBottom: 20, color: '#9ca3af' }}>
              Une erreur est survenue au chargement de l'application.
            </p>
            <div style={{
              background: '#111827',
              padding: 16,
              borderRadius: 8,
              marginBottom: 20,
              textAlign: 'left',
              fontSize: '0.8rem',
              overflow: 'auto',
              maxHeight: 200,
            }}>
              {this.state.error?.message || 'Erreur inconnue'}
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
              style={{
                padding: '12px 24px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              🔄 Réinitialiser et recharger
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
