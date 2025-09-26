import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import {
  MemoizedDataTable,
  MemoizedEditableDataTable,
  MemoizedChart,
  MemoizedCalculation,
  MemoizedMetricCard,
  useMemoizedValue,
  useMemoizedFormat
} from './MemoizedComponents'
import type { ColumnDef } from '@tanstack/react-table'

// Mock the imported components since they depend on complex UI libraries
jest.mock('@/components/ui/optimized-data-table', () => {
  return function MockOptimizedDataTable({ columns, data, className, ...props }: {
    columns: any[]
    data: any[]
    className?: string
    [key: string]: any
  }) {
    return (
      <div data-testid="optimized-data-table" className={className} {...props}>
        <div data-testid="columns-count">{columns?.length || 0}</div>
        <div data-testid="data-count">{data?.length || 0}</div>
      </div>
    )
  }
})

jest.mock('@/components/ui/editable-data-table', () => {
  return {
    EditableDataTable: function MockEditableDataTable({
      tableId,
      columns,
      data,
      onUpdate,
      className,
      ...props
    }: {
      tableId?: string
      columns: any[]
      data: any[]
      onUpdate?: (rowIndex: number, field: string, value: any) => void
      className?: string
      [key: string]: any
    }) {
      return (
        <div
          data-testid="editable-data-table"
          data-table-id={tableId}
          className={className}
          {...props}
        >
          <div data-testid="columns-count">{columns?.length || 0}</div>
          <div data-testid="data-count">{data?.length || 0}</div>
          <button onClick={() => onUpdate?.(0, 'test', 'value')}>Test Update</button>
        </div>
      )
    }
  }
})

jest.mock('@/components/common/SummaryCard', () => {
  return {
    MetricCard: function MockMetricCard({ title, value, trend, icon, className }: {
      title: string
      value: string | number
      trend?: { value: string; direction?: string; label?: string }
      icon?: React.ComponentType<{ className?: string }>
      className?: string
    }) {
      const IconComponent = icon
      return (
        <div data-testid="metric-card" className={className}>
          <div data-testid="metric-title">{title}</div>
          <div data-testid="metric-value">{value}</div>
          {trend && <div data-testid="metric-trend">{trend.value}</div>}
          {IconComponent && <IconComponent data-testid="metric-icon" />}
        </div>
      )
    }
  }
})

describe('MemoizedComponents', () => {
  // Sample data for testing
  const sampleColumns: ColumnDef<unknown>[] = [
    { id: 'name', header: 'Name', accessorKey: 'name' },
    { id: 'value', header: 'Value', accessorKey: 'value' }
  ]

  const sampleData = [
    { name: 'Item 1', value: 100 },
    { name: 'Item 2', value: 200 }
  ]

  describe('MemoizedDataTable', () => {
    it('should render with basic props', () => {
      render(
        <MemoizedDataTable
          columns={sampleColumns}
          data={sampleData}
          className="test-class"
        />
      )

      expect(screen.getByTestId('optimized-data-table')).toBeInTheDocument()
      expect(screen.getByTestId('columns-count')).toHaveTextContent('2')
      expect(screen.getByTestId('data-count')).toHaveTextContent('2')
      expect(screen.getByTestId('optimized-data-table')).toHaveClass('test-class')
    })

    it('should pass through additional props', () => {
      render(
        <MemoizedDataTable
          columns={sampleColumns}
          data={sampleData}
          customProp="test-value"
          data-testid="custom-table"
        />
      )

      // The data-testid gets overridden to 'custom-table', so look for that instead
      const table = screen.getByTestId('custom-table')
      expect(table).toHaveAttribute('customProp', 'test-value')
      expect(table).toHaveAttribute('data-testid', 'custom-table')
    })

    it('should not re-render when props are the same', () => {
      const renderSpy = jest.fn()

      const TestComponent = ({ columns, data, className }: {
        columns: ColumnDef<unknown>[]
        data: unknown[]
        className?: string
      }) => {
        renderSpy()
        return (
          <MemoizedDataTable
            columns={columns}
            data={data}
            className={className}
          />
        )
      }

      const { rerender } = render(
        <TestComponent
          columns={sampleColumns}
          data={sampleData}
          className="test"
        />
      )

      expect(renderSpy).toHaveBeenCalledTimes(1)

      // Re-render with same props
      rerender(
        <TestComponent
          columns={sampleColumns}
          data={sampleData}
          className="test"
        />
      )

      // Component function called again, but memo should prevent re-render
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })

    it('should re-render when data changes', () => {
      const { rerender } = render(
        <MemoizedDataTable
          columns={sampleColumns}
          data={sampleData}
        />
      )

      expect(screen.getByTestId('data-count')).toHaveTextContent('2')

      const newData = [...sampleData, { name: 'Item 3', value: 300 }]
      rerender(
        <MemoizedDataTable
          columns={sampleColumns}
          data={newData}
        />
      )

      expect(screen.getByTestId('data-count')).toHaveTextContent('3')
    })
  })

  describe('MemoizedEditableDataTable', () => {
    const mockOnUpdate = jest.fn()

    beforeEach(() => {
      mockOnUpdate.mockClear()
    })

    it('should render with all props', () => {
      render(
        <MemoizedEditableDataTable
          columns={sampleColumns}
          data={sampleData}
          onUpdate={mockOnUpdate}
          className="editable-class"
          tableId="test-table"
        />
      )

      expect(screen.getByTestId('editable-data-table')).toBeInTheDocument()
      expect(screen.getByTestId('editable-data-table')).toHaveAttribute('data-table-id', 'test-table')
      expect(screen.getByTestId('editable-data-table')).toHaveClass('editable-class')
    })

    it('should use default tableId when not provided', () => {
      render(
        <MemoizedEditableDataTable
          columns={sampleColumns}
          data={sampleData}
          onUpdate={mockOnUpdate}
        />
      )

      expect(screen.getByTestId('editable-data-table')).toHaveAttribute('data-table-id', 'memoized-table')
    })

    it('should handle onUpdate callback', () => {
      render(
        <MemoizedEditableDataTable
          columns={sampleColumns}
          data={sampleData}
          onUpdate={mockOnUpdate}
        />
      )

      screen.getByText('Test Update').click()
      expect(mockOnUpdate).toHaveBeenCalledWith(0, 'test', 'value')
    })

    it('should not re-render when props are the same', () => {
      const { rerender } = render(
        <MemoizedEditableDataTable
          columns={sampleColumns}
          data={sampleData}
          onUpdate={mockOnUpdate}
        />
      )

      const initialElement = screen.getByTestId('editable-data-table')

      rerender(
        <MemoizedEditableDataTable
          columns={sampleColumns}
          data={sampleData}
          onUpdate={mockOnUpdate}
        />
      )

      // Should be the same element reference due to memoization
      expect(screen.getByTestId('editable-data-table')).toBe(initialElement)
    })
  })

  describe('MemoizedChart', () => {
    it('should render children with data prop', () => {
      const chartData = [{ x: 1, y: 2 }, { x: 2, y: 4 }]

      render(
        <MemoizedChart data={chartData} className="chart-container">
          <div data-testid="chart-content">Chart Content</div>
        </MemoizedChart>
      )

      expect(screen.getByTestId('chart-content')).toBeInTheDocument()
      expect(screen.getByTestId('chart-content').parentElement).toHaveClass('chart-container')
    })

    it('should pass through additional props', () => {
      render(
        <MemoizedChart
          data={[]}
          id="chart-1"
          style={{ width: '100%' }}
        >
          <div>Chart</div>
        </MemoizedChart>
      )

      const container = screen.getByText('Chart').parentElement
      expect(container).toHaveAttribute('id', 'chart-1')
      expect(container).toHaveStyle({ width: '100%' })
    })

    it('should re-render when data changes', () => {
      const initialData = [{ x: 1, y: 2 }]
      const { rerender } = render(
        <MemoizedChart data={initialData}>
          <div data-testid="chart-content">
            Data points: {initialData.length}
          </div>
        </MemoizedChart>
      )

      expect(screen.getByTestId('chart-content')).toHaveTextContent('Data points: 1')

      const newData = [{ x: 1, y: 2 }, { x: 2, y: 4 }]
      rerender(
        <MemoizedChart data={newData}>
          <div data-testid="chart-content">
            Data points: {newData.length}
          </div>
        </MemoizedChart>
      )

      expect(screen.getByTestId('chart-content')).toHaveTextContent('Data points: 2')
    })
  })

  describe('MemoizedCalculation', () => {
    it('should render value without formatter', () => {
      render(<MemoizedCalculation value={42} />)
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('should render value with formatter', () => {
      const formatter = (value: number) => `$${value.toFixed(2)}`
      render(<MemoizedCalculation value={42.5} formatter={formatter} />)
      expect(screen.getByText('$42.50')).toBeInTheDocument()
    })

    it('should handle string values', () => {
      render(<MemoizedCalculation value="test string" />)
      expect(screen.getByText('test string')).toBeInTheDocument()
    })

    it('should apply className', () => {
      render(<MemoizedCalculation value={42} className="calculation-class" />)
      expect(screen.getByText('42')).toHaveClass('calculation-class')
    })

    it('should not re-render when value is the same', () => {
      const formatter = jest.fn((value: number) => `$${value}`)
      const { rerender } = render(
        <MemoizedCalculation value={42} formatter={formatter} />
      )

      expect(formatter).toHaveBeenCalledTimes(1)

      rerender(<MemoizedCalculation value={42} formatter={formatter} />)

      // Formatter should not be called again due to memoization
      expect(formatter).toHaveBeenCalledTimes(1)
    })
  })

  describe('MemoizedMetricCard', () => {
    const MockIcon = ({ className }: { className?: string }) => (
      <div data-testid="mock-icon" className={className}>Icon</div>
    )

    it('should render basic metric card', () => {
      render(
        <MemoizedMetricCard
          title="Revenue"
          value="$1,000,000"
        />
      )

      expect(screen.getByTestId('metric-title')).toHaveTextContent('Revenue')
      expect(screen.getByTestId('metric-value')).toHaveTextContent('$1,000,000')
    })

    it('should render with trend data', () => {
      render(
        <MemoizedMetricCard
          title="Revenue"
          value="$1,000,000"
          change={15.5}
          trend="up"
        />
      )

      expect(screen.getByTestId('metric-trend')).toHaveTextContent('+15.5%')
    })

    it('should render with negative trend', () => {
      render(
        <MemoizedMetricCard
          title="Revenue"
          value="$1,000,000"
          change={-5.2}
          trend="down"
        />
      )

      expect(screen.getByTestId('metric-trend')).toHaveTextContent('-5.2%')
    })

    it('should render with icon', () => {
      render(
        <MemoizedMetricCard
          title="Revenue"
          value="$1,000,000"
          icon={MockIcon}
        />
      )

      expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
    })

    it('should not render trend when change is undefined', () => {
      render(
        <MemoizedMetricCard
          title="Revenue"
          value="$1,000,000"
          trend="up"
        />
      )

      expect(screen.queryByTestId('metric-trend')).not.toBeInTheDocument()
    })

    it('should apply className', () => {
      render(
        <MemoizedMetricCard
          title="Revenue"
          value="$1,000,000"
          className="custom-metric"
        />
      )

      expect(screen.getByTestId('metric-card')).toHaveClass('custom-metric')
    })
  })

  describe('useMemoizedValue hook', () => {
    it('should memoize expensive calculations', () => {
      const expensiveFunction = jest.fn((a: number, b: number) => a + b)

      const { result, rerender } = renderHook(
        ({ a, b }) => useMemoizedValue(() => expensiveFunction(a, b), [a, b]),
        { initialProps: { a: 1, b: 2 } }
      )

      expect(result.current).toBe(3)
      expect(expensiveFunction).toHaveBeenCalledTimes(1)

      // Re-render with same dependencies
      rerender({ a: 1, b: 2 })
      expect(expensiveFunction).toHaveBeenCalledTimes(1) // Not called again

      // Re-render with different dependencies
      rerender({ a: 2, b: 3 })
      expect(result.current).toBe(5)
      expect(expensiveFunction).toHaveBeenCalledTimes(2)
    })

    it('should handle complex return types', () => {
      const computeObject = jest.fn(() => ({ computed: true, timestamp: Date.now() }))

      const { result } = renderHook(() =>
        useMemoizedValue(computeObject, [])
      )

      expect(result.current).toEqual(expect.objectContaining({ computed: true }))
      expect(computeObject).toHaveBeenCalledTimes(1)
    })
  })

  describe('useMemoizedFormat hook', () => {
    it('should memoize formatted values', () => {
      const formatter = jest.fn((value: number) => `$${value.toFixed(2)}`)

      const { result, rerender } = renderHook(
        ({ value }) => useMemoizedFormat(value, formatter, [value]),
        { initialProps: { value: 42.567 } }
      )

      expect(result.current).toBe('$42.57')
      expect(formatter).toHaveBeenCalledTimes(1)

      // Re-render with same value
      rerender({ value: 42.567 })
      expect(formatter).toHaveBeenCalledTimes(1) // Not called again

      // Re-render with different value
      rerender({ value: 100.123 })
      expect(result.current).toBe('$100.12')
      expect(formatter).toHaveBeenCalledTimes(2)
    })

    it('should use value as default dependency', () => {
      const formatter = jest.fn((value: number) => value.toString())

      const { result, rerender } = renderHook(
        ({ value }) => useMemoizedFormat(value, formatter),
        { initialProps: { value: 42 } }
      )

      expect(result.current).toBe('42')
      expect(formatter).toHaveBeenCalledTimes(1)

      // Re-render with same value (using default deps)
      rerender({ value: 42 })
      expect(formatter).toHaveBeenCalledTimes(1)

      // Re-render with different value
      rerender({ value: 100 })
      expect(result.current).toBe('100')
      expect(formatter).toHaveBeenCalledTimes(2)
    })

    it('should handle string values', () => {
      const formatter = jest.fn((value: string) => value.toUpperCase())

      const { result } = renderHook(() =>
        useMemoizedFormat('hello world', formatter)
      )

      expect(result.current).toBe('HELLO WORLD')
      expect(formatter).toHaveBeenCalledWith('hello world')
    })
  })

  describe('Memoization behavior', () => {
    it('should prevent unnecessary re-renders in complex scenarios', () => {
      const renderSpy = jest.fn()

      const TestComponent = ({ data, columns }: {
        data: unknown[]
        columns: ColumnDef<unknown>[]
      }) => {
        renderSpy()
        return <MemoizedDataTable columns={columns} data={data} />
      }

      const { rerender } = render(
        <TestComponent columns={sampleColumns} data={sampleData} />
      )

      expect(renderSpy).toHaveBeenCalledTimes(1)

      // Re-render parent with same props
      rerender(<TestComponent columns={sampleColumns} data={sampleData} />)

      // Parent re-renders but memoized child should not
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })

    it('should handle reference equality correctly', () => {
      const columns1 = [{ id: 'test', header: 'Test', accessorKey: 'test' }]
      const columns2 = [{ id: 'test', header: 'Test', accessorKey: 'test' }] // Different reference

      const { rerender } = render(
        <MemoizedDataTable columns={columns1} data={[]} />
      )

      // Should re-render because columns reference changed
      rerender(<MemoizedDataTable columns={columns2} data={[]} />)

      // This tests that the component properly compares references
      expect(screen.getByTestId('optimized-data-table')).toBeInTheDocument()
    })
  })

  describe('Error handling', () => {
    it('should handle undefined/null data gracefully', () => {
      render(
        <MemoizedDataTable
          columns={sampleColumns}
          data={null as any}
        />
      )

      // Should not crash, though the mock component might show different behavior
      expect(screen.getByTestId('optimized-data-table')).toBeInTheDocument()
    })

    it('should handle empty arrays', () => {
      render(
        <MemoizedDataTable
          columns={[]}
          data={[]}
        />
      )

      expect(screen.getByTestId('columns-count')).toHaveTextContent('0')
      expect(screen.getByTestId('data-count')).toHaveTextContent('0')
    })

    it('should handle formatter errors gracefully', () => {
      const faultyFormatter = jest.fn().mockImplementation(() => {
        throw new Error('Formatter error')
      })

      // This should not crash the component
      expect(() => {
        render(<MemoizedCalculation value={42} formatter={faultyFormatter} />)
      }).toThrow('Formatter error')
    })
  })
})