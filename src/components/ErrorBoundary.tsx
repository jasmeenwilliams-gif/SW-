import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  operationSummary: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
      operationSummary: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let message = error.message || 'An unexpected application error occurred.';
    let operationSummary: string | null = null;

    try {
      const parsed = JSON.parse(error.message) as {
        error?: string;
        operationType?: string;
        path?: string | null;
      };
      if (parsed && typeof parsed.error === 'string') {
        message = parsed.error;
        if (parsed.operationType || parsed.path) {
          operationSummary = `Operation: ${parsed.operationType ?? 'unknown'}${
            parsed.path ? ` (${parsed.path})` : ''
          }`;
        }
      }
    } catch {
      // Plain error message
    }

    return {
      hasError: true,
      message,
      operationSummary,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      message: '',
      operationSummary: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center p-4 sm:p-8">
          <div className="max-w-lg w-full bg-surface-container-lowest rounded border border-brass/40 shadow-lg p-6 sm:p-8 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded bg-primary-container text-secondary-fixed flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
                  Southern Well Senior Concierge
                </p>
                <h1 className="font-editorial text-2xl font-semibold text-primary-container mt-0.5">
                  Unable to Complete Request
                </h1>
              </div>
            </div>

            <div className="p-4 rounded bg-surface-container-low border border-brass/25 space-y-1.5 text-sm text-on-surface-variant">
              <p className="text-primary-container font-medium leading-relaxed">
                {this.state.message}
              </p>
              {this.state.operationSummary && (
                <p className="text-xs text-on-surface-variant font-mono">
                  {this.state.operationSummary}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="min-h-[44px] px-4 py-2.5 rounded bg-primary-container text-secondary-fixed text-xs font-semibold uppercase tracking-wider hover:bg-tertiary-container transition-colors inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="min-h-[44px] px-4 py-2.5 rounded bg-surface-container-low border border-brass/30 text-primary-container text-xs font-semibold uppercase tracking-wider hover:bg-surface-container transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
