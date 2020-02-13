import { render, screen } from '@testing-library/react';
import StatisticsCard from './StatisticsCard';

describe('StatisticsCard', () => {
  it('formats accumulated values and daily changes', () => {
    render(<StatisticsCard title="Confirmed cases" value={1234567} change={420} />);
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
    expect(screen.getByText(/420 new reported/)).toBeInTheDocument();
  });

  it('shows missing observations without adding a unit or a false change', () => {
    render(<StatisticsCard title="Fatality ratio" value={null} suffix="%" />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText(/new reported/)).not.toBeInTheDocument();
    expect(screen.queryByText('—%')).not.toBeInTheDocument();
  });

  it('retains negative corrections and requested numeric precision', () => {
    render(<StatisticsCard title="Deaths per million" value={15.487} change={-2} precision={1} />);
    expect(screen.getByText('15.5')).toBeInTheDocument();
    expect(screen.getByText(/-2 new reported/)).toBeInTheDocument();
  });
});
