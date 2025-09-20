import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  LoadingSpinner,
  FullPageLoader,
  CardLoader,
  TableLoader,
  FormLoader,
  ButtonLoader,
  SkeletonLoader,
  LoadingOverlay,
  LoadingState,
  ContentWithLoading
} from '../loading-spinner'

describe('LoadingSpinner', () => {
  it('should render default spinner', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveAttribute('aria-label', 'Loading...')
  })

  it('should apply size classes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />)
    let spinner = screen.getByRole('status')
    expect(spinner.firstChild).toHaveClass('h-4', 'w-4')

    rerender(<LoadingSpinner size="lg" />)
    spinner = screen.getByRole('status')
    expect(spinner.firstChild).toHaveClass('h-8', 'w-8')
  })

  it('should apply custom label', () => {
    render(<LoadingSpinner label="Processing..." />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('aria-label', 'Processing...')
  })

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-class" />)
    const container = screen.getByRole('status').parentElement
    expect(container).toHaveClass('custom-class')
  })

  it('should render full screen spinner when fullScreen is true', () => {
    render(<LoadingSpinner fullScreen />)
    const container = screen.getByRole('status').parentElement
    expect(container).toHaveClass('fixed', 'inset-0')
  })
})

describe('FullPageLoader', () => {
  it('should render full page loader with message', () => {
    render(<FullPageLoader message="Loading application..." />)
    expect(screen.getByText('Loading application...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should render without message', () => {
    render(<FullPageLoader />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<FullPageLoader message="Loading..." />)
    const container = screen.getByRole('status').parentElement?.parentElement
    expect(container).toHaveAttribute('role', 'alert')
    expect(container).toHaveAttribute('aria-busy', 'true')
    expect(container).toHaveAttribute('aria-live', 'polite')
  })
})

describe('CardLoader', () => {
  it('should render skeleton card', () => {
    render(<CardLoader />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should render multiple lines', () => {
    render(<CardLoader lines={4} />)
    const skeletonLines = screen.getAllByRole('status')
    expect(skeletonLines).toHaveLength(1) // Only one status role for the card
    const container = skeletonLines[0]
    const lines = container.querySelectorAll('.bg-muted')
    expect(lines.length).toBeGreaterThan(1)
  })

  it('should apply custom className', () => {
    render(<CardLoader className="custom-card" />)
    const card = screen.getByRole('status')
    expect(card).toHaveClass('custom-card')
  })
})

describe('TableLoader', () => {
  it('should render table skeleton with default rows and columns', () => {
    render(<TableLoader />)
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()

    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(6) // 1 header + 5 body rows
  })

  it('should render custom number of rows and columns', () => {
    render(<TableLoader rows={3} columns={2} />)
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(4) // 1 header + 3 body rows

    const headerCells = rows[0].querySelectorAll('th')
    expect(headerCells).toHaveLength(2)
  })

  it('should apply custom className', () => {
    render(<TableLoader className="custom-table" />)
    const container = screen.getByRole('table').parentElement
    expect(container).toHaveClass('custom-table')
  })
})

describe('FormLoader', () => {
  it('should render form skeleton with default fields', () => {
    render(<FormLoader />)
    const form = screen.getByRole('form')
    expect(form).toBeInTheDocument()

    const fields = form.querySelectorAll('.space-y-2')
    expect(fields.length).toBeGreaterThan(0)
  })

  it('should render custom number of fields', () => {
    render(<FormLoader fields={2} />)
    const form = screen.getByRole('form')
    const fields = form.querySelectorAll('.space-y-2')
    expect(fields).toHaveLength(2)
  })

  it('should render submit button skeleton', () => {
    render(<FormLoader />)
    const form = screen.getByRole('form')
    const button = form.querySelector('.h-10.w-32')
    expect(button).toBeInTheDocument()
  })
})

describe('ButtonLoader', () => {
  it('should render loading button', () => {
    render(<ButtonLoader>Save</ButtonLoader>)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('should apply variant styles', () => {
    render(<ButtonLoader variant="destructive">Delete</ButtonLoader>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('should apply size styles', () => {
    render(<ButtonLoader size="sm">Small</ButtonLoader>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-9')
  })
})

describe('SkeletonLoader', () => {
  it('should render skeleton with default width and height', () => {
    render(<SkeletonLoader />)
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('should apply custom dimensions', () => {
    render(<SkeletonLoader width="200px" height="50px" />)
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toHaveStyle({ width: '200px', height: '50px' })
  })

  it('should apply rounded style', () => {
    render(<SkeletonLoader rounded />)
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toHaveClass('rounded-full')
  })

  it('should apply custom className', () => {
    render(<SkeletonLoader className="custom-skeleton" />)
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toHaveClass('custom-skeleton')
  })
})

describe('LoadingOverlay', () => {
  it('should render overlay when visible', () => {
    render(<LoadingOverlay visible message="Processing..." />)
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should not render when not visible', () => {
    render(<LoadingOverlay visible={false} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('should use blur backdrop', () => {
    render(<LoadingOverlay visible blur />)
    const backdrop = document.querySelector('.backdrop-blur-sm')
    expect(backdrop).toBeInTheDocument()
  })

  it('should apply dark background', () => {
    render(<LoadingOverlay visible dark />)
    const overlay = document.querySelector('.bg-black\\/80')
    expect(overlay).toBeInTheDocument()
  })
})

describe('LoadingState', () => {
  it('should render loading spinner when isLoading is true', () => {
    render(
      <LoadingState isLoading>
        <div>Content</div>
      </LoadingState>
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('should render children when isLoading is false', () => {
    render(
      <LoadingState isLoading={false}>
        <div>Content</div>
      </LoadingState>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('should use custom loader component', () => {
    const CustomLoader = () => <div>Custom Loader</div>
    render(
      <LoadingState isLoading loader={<CustomLoader />}>
        <div>Content</div>
      </LoadingState>
    )
    expect(screen.getByText('Custom Loader')).toBeInTheDocument()
  })
})

describe('ContentWithLoading', () => {
  it('should show loading state initially', () => {
    render(
      <ContentWithLoading isLoading isEmpty={false}>
        <div>Content</div>
      </ContentWithLoading>
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should show empty state when isEmpty is true', () => {
    render(
      <ContentWithLoading
        isLoading={false}
        isEmpty
        emptyMessage="No data available"
      >
        <div>Content</div>
      </ContentWithLoading>
    )
    expect(screen.getByText('No data available')).toBeInTheDocument()
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('should show error state when error is provided', () => {
    render(
      <ContentWithLoading
        isLoading={false}
        isEmpty={false}
        error="Failed to load data"
      >
        <div>Content</div>
      </ContentWithLoading>
    )
    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('should show content when all conditions are false', () => {
    render(
      <ContentWithLoading isLoading={false} isEmpty={false}>
        <div>Content</div>
      </ContentWithLoading>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should use custom components', () => {
    const CustomLoader = () => <div>Loading...</div>
    const CustomEmpty = () => <div>Empty</div>
    const CustomError = () => <div>Error occurred</div>

    const { rerender } = render(
      <ContentWithLoading
        isLoading
        loadingComponent={<CustomLoader />}
      >
        <div>Content</div>
      </ContentWithLoading>
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    rerender(
      <ContentWithLoading
        isLoading={false}
        isEmpty
        emptyComponent={<CustomEmpty />}
      >
        <div>Content</div>
      </ContentWithLoading>
    )
    expect(screen.getByText('Empty')).toBeInTheDocument()

    rerender(
      <ContentWithLoading
        isLoading={false}
        isEmpty={false}
        error="error"
        errorComponent={<CustomError />}
      >
        <div>Content</div>
      </ContentWithLoading>
    )
    expect(screen.getByText('Error occurred')).toBeInTheDocument()
  })
})