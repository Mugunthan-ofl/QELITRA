import React from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 shadow-2xl backdrop-blur-md space-y-4 max-w-4xl mx-auto animate-fade-in">
          <div className="flex items-center gap-3 border-b border-rose-800/60 pb-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                {this.props.title || "Section Render Error"}
              </h3>
              <p className="text-xs text-rose-300">
                An unexpected error occurred while rendering this module.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-navy-950/90 border border-rose-900/60 font-mono text-xs text-rose-300 overflow-x-auto">
            <div className="font-bold text-rose-400 mb-1">
              {this.state.error?.name || "Error"}: {this.state.error?.message || String(this.state.error)}
            </div>
            {this.state.errorInfo?.componentStack && (
              <pre className="text-[11px] text-slate-400 mt-2 whitespace-pre-wrap leading-relaxed">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition shadow-md"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry Component</span>
            </button>
            {this.props.fallbackAction}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
