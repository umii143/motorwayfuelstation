import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { logger } from '../../lib/logger';
import { eventBus, EOC_EVENTS } from '../../services/core/eventBus';

interface Props {
  children: ReactNode;
  reportId: string;
  widgetName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class WidgetErrorBoundary extends React.Component<Props, State> {
  public state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error(`[WidgetErrorBoundary] Error in widget ${this.props.reportId}:`, error, errorInfo);
    
    // Emit engine health fault for monitoring
    eventBus.emit(
      EOC_EVENTS.INTEGRITY_WARNING,
      {
        type: 'WIDGET_FAULT',
        reportId: this.props.reportId,
        widgetName: this.props.widgetName || 'Unknown Widget',
        message: error.message
      },
      'system',
      'system',
      'WidgetErrorBoundary'
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[120px] w-full flex-col items-center justify-center rounded-xl border border-rose-100 bg-rose-50/30 p-4 text-center">
          <AlertCircle className="h-6 w-6 text-rose-500 mb-2" />
          <h4 className="font-sans text-sm font-semibold text-rose-800">
            {this.props.widgetName || 'Widget'} Unavailable
          </h4>
          <p className="font-mono text-[10px] text-rose-600/70 mt-1 mb-3 uppercase tracking-wider">
            {this.props.reportId}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 rounded bg-white px-3 py-1.5 font-sans text-xs font-medium text-rose-600 shadow-sm ring-1 ring-inset ring-rose-200 hover:bg-rose-50"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WidgetErrorBoundary;
