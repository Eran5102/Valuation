import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, FormErrorBoundary, useErrorHandler } from '../ErrorBoundary';

// Test component that throws an error
function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
}

// Test component that throws an error after a state change
function ThrowErrorOnClick() {
  const [shouldThrow, setShouldThrow] = React.useState(false);

  if (shouldThrow) {
    throw new Error('Click triggered error');
  }

  return (
    <button onClick={() => setShouldThrow(true)}>
      Trigger Error
    </button>
  );
}

// Test component for useErrorHandler hook
function ErrorHandlerTest() {
  const handleError = useErrorHandler();

  const triggerError = () => {
    try {
      throw new Error('Hook test error');
    } catch (error) {
      handleError(error as Error, { componentStack: 'test stack' });
    }
  };

  return (
    <button onClick={triggerError}>
      Trigger Hook Error
    </button>
  );
}

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests since we're intentionally throwing errors
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Error Handling', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should render error UI when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument();
    });

    it('should show error details in development mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Error details \(development only\)/)).toBeInTheDocument();

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should hide error details in production mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/Error details \(development only\)/)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should call onError callback when error occurs', () => {
      const onErrorMock = jest.fn();

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object)
      );
    });
  });

  describe('Error Recovery', () => {
    it('should allow resetting error state with Try Again button', () => {
      render(
        <ErrorBoundary>
          <ThrowErrorOnClick />
        </ErrorBoundary>
      );

      // Initially no error
      expect(screen.getByText('Trigger Error')).toBeInTheDocument();

      // Trigger error
      fireEvent.click(screen.getByText('Trigger Error'));

      // Error UI should be shown
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Click Try Again
      fireEvent.click(screen.getByText('Try Again'));

      // Should show the original component again
      expect(screen.getByText('Trigger Error')).toBeInTheDocument();
    });

    it('should reload page when Reload Page button is clicked', () => {
      // Mock window.location.reload
      const originalReload = window.location.reload;
      const mockReload = jest.fn();
      Object.defineProperty(window.location, 'reload', {
        value: mockReload,
        writable: true
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('Reload Page'));

      expect(mockReload).toHaveBeenCalled();

      // Restore original
      window.location.reload = originalReload;
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('FormErrorBoundary', () => {
    it('should render form-specific error UI', () => {
      render(
        <FormErrorBoundary>
          <ThrowError shouldThrow={true} />
        </FormErrorBoundary>
      );

      expect(screen.getByText('Form Error')).toBeInTheDocument();
      expect(screen.getByText(/There was an error with the form/)).toBeInTheDocument();
    });

    it('should render children when no error occurs', () => {
      render(
        <FormErrorBoundary>
          <ThrowError shouldThrow={false} />
        </FormErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('useErrorHandler Hook', () => {
    it('should handle errors when called', () => {
      render(<ErrorHandlerTest />);

      fireEvent.click(screen.getByText('Trigger Hook Error'));

      // Should log error to console (mocked)
      expect(console.error).toHaveBeenCalledWith(
        'Error caught by error handler:',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should handle errors without error info', () => {
      const TestComponent = () => {
        const handleError = useErrorHandler();

        const triggerError = () => {
          handleError(new Error('Hook test without info'));
        };

        return <button onClick={triggerError}>Trigger Error</button>;
      };

      render(<TestComponent />);

      fireEvent.click(screen.getByText('Trigger Error'));

      expect(console.error).toHaveBeenCalledWith(
        'Error caught by error handler:',
        expect.any(Error),
        undefined
      );
    });
  });

  describe('Error Information Display', () => {
    it('should display error message in development', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Expand error details
      fireEvent.click(screen.getByText(/Error details \(development only\)/));

      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText(/Test error message/)).toBeInTheDocument();

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should show stack trace in development', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Expand error details
      fireEvent.click(screen.getByText(/Error details \(development only\)/));

      expect(screen.getByText(/Stack:/)).toBeInTheDocument();

      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('Multiple Errors', () => {
    it('should handle multiple consecutive errors', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // First error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Reset
      fireEvent.click(screen.getByText('Try Again'));

      // Second error with different component
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for error messages', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorContainer = screen.getByText(/We're sorry, but something unexpected happened/).closest('div');
      expect(errorContainer).toBeInTheDocument();

      // Check that buttons are focusable
      expect(screen.getByText('Try Again')).toHaveAttribute('type', 'button');
      expect(screen.getByText('Reload Page')).toHaveAttribute('type', 'button');
    });
  });
});