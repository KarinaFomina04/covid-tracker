import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unexpected interface error', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main id="main-content" tabIndex={-1} className="container page-content" role="alert">
          <div className="notice notice--error">
            <h1>Unable to display this page</h1>
            <p>An unexpected error occurred. Reload the page to try again.</p>
            <button type="button" className="text-button" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
