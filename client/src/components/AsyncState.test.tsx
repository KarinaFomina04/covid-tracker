import { fireEvent, render, screen } from '@testing-library/react';
import AsyncState from './AsyncState';

describe('AsyncState', () => {
  it('announces progress while statistics are loading', () => {
    render(<AsyncState />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading statistics');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('displays a custom empty-state message', () => {
    render(<AsyncState message="No observations available" />);
    expect(screen.getByRole('status')).toHaveTextContent('No observations available');
  });

  it('renders an error and invokes the retry action', () => {
    const retry = jest.fn();
    render(<AsyncState error="Unable to contact the server" retry={retry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to contact the server');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('does not offer retry when the action is unavailable', () => {
    render(<AsyncState error="Access denied" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Access denied');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
