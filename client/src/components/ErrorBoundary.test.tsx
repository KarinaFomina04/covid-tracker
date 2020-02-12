import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

function BrokenComponent(): JSX.Element {
  throw new Error('Rendering failed');
}

describe('ErrorBoundary', () => {
  it('shows the application fallback when a component crashes', () => {
    const originalError = console.error;
    console.error = jest.fn();
    try {
      render(<ErrorBoundary><BrokenComponent /></ErrorBoundary>);
      expect(screen.getByRole('alert')).toHaveTextContent('Unable to display this page');
      expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument();
    } finally {
      console.error = originalError;
    }
  });
});
