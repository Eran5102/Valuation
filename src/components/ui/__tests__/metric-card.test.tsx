import { render, screen } from '@testing-library/react';
import { TrendingUp } from 'lucide-react';
import { MetricCard } from '../metric-card';

describe('MetricCard', () => {
  it('renders basic metric card with title and value', () => {
    render(<MetricCard title="Test Metric" value={100} />);
    
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders with string value', () => {
    render(<MetricCard title="Status" value="Active" />);
    
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(
      <MetricCard 
        title="Total Sales" 
        value={1500} 
        description="Monthly revenue"
      />
    );
    
    expect(screen.getByText('Total Sales')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('Monthly revenue')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    render(
      <MetricCard 
        title="Growth" 
        value={25} 
        icon={TrendingUp}
      />
    );
    
    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    // Icon should be rendered
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('applies correct trend styling for upward trend', () => {
    render(
      <MetricCard 
        title="Revenue" 
        value={2000} 
        trend="up"
      />
    );
    
    const container = screen.getByText('Revenue').closest('div')?.parentElement;
    expect(container).toHaveClass('bg-green-50', 'text-green-600');
    expect(screen.getByText('↗')).toBeInTheDocument();
  });

  it('applies correct trend styling for downward trend', () => {
    render(
      <MetricCard 
        title="Costs" 
        value={500} 
        trend="down"
      />
    );
    
    const container = screen.getByText('Costs').closest('div')?.parentElement;
    expect(container).toHaveClass('bg-red-50', 'text-red-600');
    expect(screen.getByText('↘')).toBeInTheDocument();
  });

  it('applies neutral styling when no trend is specified', () => {
    render(<MetricCard title="Neutral" value={100} />);
    
    const container = screen.getByText('Neutral').closest('div')?.parentElement;
    expect(container).toHaveClass('bg-blue-50', 'text-blue-600');
    expect(screen.queryByText('↗')).not.toBeInTheDocument();
    expect(screen.queryByText('↘')).not.toBeInTheDocument();
  });

  it('formats large numbers with commas', () => {
    render(<MetricCard title="Large Number" value={1000000} />);
    
    expect(screen.getByText('1,000,000')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <MetricCard 
        title="Custom" 
        value={50} 
        className="custom-class"
      />
    );
    
    const container = screen.getByText('Custom').closest('div')?.parentElement;
    expect(container).toHaveClass('custom-class');
  });
});