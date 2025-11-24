/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors in child components
 */

import React from 'react';
import Button from './Button';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Filter out generic "Script error" which is usually from external scripts
    // Don't set error state for script errors - they're usually non-critical
    if (error?.message === 'Script error.' || error?.message === 'Script error' ||
        (typeof error?.message === 'string' && error.message.includes('Script error'))) {
      console.warn('ErrorBoundary: Suppressing script error (likely external script/CORS issue):', error);
      return { hasError: false }; // Don't show error boundary
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Filter out generic "Script error" which is usually from external scripts
    if (error?.message === 'Script error.' || error?.message === 'Script error' ||
        (typeof error?.message === 'string' && error.message.includes('Script error'))) {
      console.warn('ErrorBoundary: Caught script error (likely external script/CORS issue):', {
        error,
        errorInfo
      });
      // Reset error state if it was set
      this.setState({ hasError: false, error: null, errorInfo: null });
      return;
    }
    
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">⚠️</div>
            <h2 className="error-boundary-title">Something went wrong</h2>
            <p className="error-boundary-message">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-boundary-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="error-boundary-actions">
              <Button variant="primary" onClick={this.handleReset}>
                Go to Home
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;





