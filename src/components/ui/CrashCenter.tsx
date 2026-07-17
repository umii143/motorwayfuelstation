/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, TerminalSquare, ShieldAlert } from 'lucide-react';
import { logger } from '../../lib/logger';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class CrashCenter extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    logger.error("CrashCenter caught an error:", error, errorInfo);

    // Detect dynamic import or chunk loading failures (common after new deployments)
    const errorStr = String(error.message || error);
    const isChunkLoadFailed =
      error.name === 'ChunkLoadError' ||
      errorStr.includes('Failed to fetch dynamically imported module') ||
      errorStr.includes('error loading dynamically imported module') ||
      errorStr.includes('Loading chunk') ||
      errorStr.includes('Expected a JavaScript-or-Wasm module script');

    if (isChunkLoadFailed) {
      logger.warn("Dynamic import/chunk load failure detected. Reloading application to fetch the latest assets...");
      const lastReload = sessionStorage.getItem('chunk_load_fail_reload');
      const now = Date.now();
      // Restrict auto-reload to once every 15 seconds to avoid infinite loops if server is down
      if (!lastReload || now - Number(lastReload) > 15000) {
        sessionStorage.setItem('chunk_load_fail_reload', String(now));
        window.location.reload();
      }
    }
  }

  private handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] h-full w-full flex items-center justify-center bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-rose-100 shadow-sm animate-in fade-in duration-300">
          <div className="max-w-xl w-full bg-white dark:bg-[#151521] rounded-xl shadow-lg border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="bg-rose-600 px-6 py-4 flex items-center gap-3 text-white">
              <ShieldAlert className="w-8 h-8" />
              <div>
                <h2 className="text-lg font-black tracking-tight">System Interruption Detected</h2>
                <p className="text-rose-100 text-xs font-medium">The Enterprise Operating System prevented a full crash.</p>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-rose-900">
                      {this.props.fallbackMessage || 'A component encountered an unexpected error.'}
                    </h3>
                    <p className="text-xs text-rose-700 mt-1 font-mono">
                      {this.state.error?.message || 'any error occurred'}
                    </p>
                  </div>
                </div>
              </div>

              {process.env.NODE_ENV !== 'production' && this.state.errorInfo && (
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto max-h-[200px] overflow-y-auto">
                  <div className="flex items-center gap-2 mb-2 text-slate-400 border-b border-slate-800 pb-2">
                    <TerminalSquare className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Stack Trace</span>
                  </div>
                  <pre className="text-[10px] text-emerald-400 font-mono leading-relaxed">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  Dismiss & Reset
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Application
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
