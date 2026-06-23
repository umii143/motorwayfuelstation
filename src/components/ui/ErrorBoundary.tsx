
import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '../../lib/logger';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // In production, you'd send this to an error tracking service (e.g., Sentry)
    logger.error('[ErrorBoundary] Caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h3 className="font-sans text-lg font-bold text-rose-900 mb-2">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h3>
          <p className="font-sans text-sm text-rose-700 max-w-md mb-6 leading-relaxed">
            {this.props.fallbackMessage ||
              'This section encountered an error. Your data is safe. Try refreshing or click below to retry.'}
          </p>
          {this.state.error && (
            <p className="font-mono text-xs text-rose-400 bg-rose-100 rounded-lg px-3 py-2 mb-6 max-w-sm truncate">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 font-sans text-sm font-bold text-white shadow-md hover:bg-rose-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
