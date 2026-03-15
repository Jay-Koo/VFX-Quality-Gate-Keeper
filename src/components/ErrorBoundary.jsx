import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary]', this.props.name || 'Unknown', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    handleCopyError = () => {
        const text = `[${this.props.name || 'App'}] ${this.state.error?.message}\n${this.state.error?.stack}`;
        navigator.clipboard.writeText(text);
    };

    render() {
        if (this.state.hasError) {
            if (this.props.level === 'app') {
                return (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                        background: '#0a0a1a',
                        color: '#ff4444',
                        fontFamily: 'monospace',
                        gap: '16px'
                    }}>
                        <p style={{ fontSize: '1.2rem' }}>App Error</p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '8px 24px',
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid #ff4444',
                                color: '#ff4444',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Reload
                        </button>
                    </div>
                );
            }

            return (
                <div style={{
                    padding: '24px',
                    background: 'rgba(255,68,68,0.08)',
                    border: '1px solid rgba(255,68,68,0.3)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    color: '#ccc',
                    fontFamily: 'monospace'
                }}>
                    <p style={{ fontSize: '1rem', color: '#ff4444', marginBottom: '8px' }}>
                        Error in {this.props.name || 'this section'}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '16px' }}>
                        {this.state.error?.message}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                            onClick={this.handleReset}
                            style={{
                                padding: '6px 16px',
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid #555',
                                color: '#ccc',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            Retry
                        </button>
                        <button
                            onClick={this.handleCopyError}
                            style={{
                                padding: '6px 16px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid #444',
                                color: '#888',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            Copy Error
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
