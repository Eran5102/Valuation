'use client';

import React, { ReactNode, useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface GlobalErrorHandlerProps {
  children: ReactNode;
}

export function GlobalErrorHandler({ children }: GlobalErrorHandlerProps) {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);

      if (process.env.NODE_ENV === 'production') {
        // TODO: Log to external service
        console.error('Production unhandled rejection:', {
          reason: event.reason,
          stack: event.reason?.stack,
          timestamp: new Date().toISOString()
        });
      }

      // Prevent the default browser behavior (logging to console)
      event.preventDefault();
    };

    // Handle global JavaScript errors
    const handleError = (event: ErrorEvent) => {
      console.error('Global JavaScript error:', event.error);

      if (process.env.NODE_ENV === 'production') {
        // TODO: Log to external service
        console.error('Production global error:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  const handleBoundaryError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('React Error Boundary:', error, errorInfo);

    if (process.env.NODE_ENV === 'production') {
      // TODO: Log to external service
      console.error('Production React error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <ErrorBoundary onError={handleBoundaryError}>
      {children}
    </ErrorBoundary>
  );
}

// Error reporting utilities
export class ErrorReporter {
  private static instance: ErrorReporter;
  private queue: Array<{
    error: Error;
    context?: any;
    timestamp: Date;
  }> = [];
  private isReporting = false;

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  report(error: Error, context?: any) {
    const errorEntry = {
      error,
      context,
      timestamp: new Date()
    };

    this.queue.push(errorEntry);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isReporting || this.queue.length === 0) {
      return;
    }

    this.isReporting = true;

    try {
      const errors = this.queue.splice(0, 10); // Process up to 10 errors at once

      if (process.env.NODE_ENV === 'production') {
        // TODO: Send to external error reporting service
        await this.sendToExternalService(errors);
      } else {
        // Development: just log to console
        errors.forEach(({ error, context, timestamp }) => {
          console.group(`Error Report - ${timestamp.toISOString()}`);
          console.error('Error:', error);
          if (context) {
            console.error('Context:', context);
          }
          console.groupEnd();
        });
      }
    } catch (reportingError) {
      console.error('Failed to report errors:', reportingError);
      // Re-queue the errors for retry
      this.queue.unshift(...this.queue);
    } finally {
      this.isReporting = false;

      // Process remaining queue items
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 5000); // Retry after 5 seconds
      }
    }
  }

  private async sendToExternalService(errors: Array<{
    error: Error;
    context?: any;
    timestamp: Date;
  }>) {
    // TODO: Implement actual external service integration
    // Example: Sentry, LogRocket, Bugsnag, etc.

    const payload = errors.map(({ error, context, timestamp }) => ({
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      timestamp: timestamp.toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: 'anonymous', // TODO: Get from auth context
      sessionId: this.getSessionId()
    }));

    // Mock API call - replace with actual service
    console.log('Would send to error reporting service:', payload);

    // Example implementation:
    /*
    await fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    */
  }

  private getSessionId(): string {
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('error-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('error-session-id', sessionId);
    }
    return sessionId;
  }
}

// Hook for manual error reporting
export function useErrorReporter() {
  const reporter = ErrorReporter.getInstance();

  const reportError = React.useCallback((error: Error, context?: any) => {
    reporter.report(error, context);
  }, [reporter]);

  return { reportError };
}