import React from 'react';
import { cn } from '@/lib/utils';

interface ValidationErrorProps {
  error?: string | string[];
  className?: string;
  show?: boolean;
}

export function ValidationError({
  error,
  className,
  show = true
}: ValidationErrorProps) {
  if (!show || !error) {
    return null;
  }

  const errors = Array.isArray(error) ? error : [error];

  return (
    <div className={cn('mt-1', className)}>
      {errors.map((err, index) => (
        <p
          key={index}
          className="text-sm text-red-600 flex items-start gap-1"
          role="alert"
          aria-live="polite"
        >
          <span className="block w-1 h-1 rounded-full bg-red-600 mt-2 flex-shrink-0" />
          {err}
        </p>
      ))}
    </div>
  );
}

interface ValidationSummaryProps {
  errors: Record<string, string | string[]>;
  title?: string;
  className?: string;
  onFieldClick?: (fieldName: string) => void;
}

export function ValidationSummary({
  errors,
  title = 'Please correct the following errors:',
  className,
  onFieldClick
}: ValidationSummaryProps) {
  const errorEntries = Object.entries(errors).filter(([_, error]) => error);

  if (errorEntries.length === 0) {
    return null;
  }

  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  };

  return (
    <div className={cn('bg-red-50 border border-red-200 rounded-md p-4 mb-6', className)}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 w-full">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            {title}
          </h3>
          <ul className="text-sm text-red-700 space-y-1" role="alert">
            {errorEntries.map(([fieldName, error]) => {
              const errors = Array.isArray(error) ? error : [error];
              return errors.map((err, index) => (
                <li key={`${fieldName}-${index}`} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    <button
                      type="button"
                      onClick={() => onFieldClick?.(fieldName)}
                      className="font-medium hover:underline focus:outline-none focus:underline"
                    >
                      {formatFieldName(fieldName)}:
                    </button>
                    {' '}{err}
                  </span>
                </li>
              ));
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface ApiErrorProps {
  error: {
    message: string;
    type?: string;
    details?: Record<string, string | string[]>;
    status?: number;
  };
  onRetry?: () => void;
  className?: string;
}

export function ApiError({ error, onRetry, className }: ApiErrorProps) {
  const getErrorIcon = () => {
    if (error.status === 429) {
      return (
        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }

    return (
      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  };

  const getErrorTitle = () => {
    switch (error.status) {
      case 400:
        return 'Invalid Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Access Denied';
      case 404:
        return 'Not Found';
      case 429:
        return 'Rate Limited';
      case 500:
        return 'Server Error';
      default:
        return 'Error';
    }
  };

  const getBorderColor = () => {
    if (error.status === 429) return 'border-yellow-200';
    return 'border-red-200';
  };

  const getBackgroundColor = () => {
    if (error.status === 429) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <div className={cn(`${getBackgroundColor()} ${getBorderColor()} rounded-md p-4`, className)}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>
        <div className="ml-3 w-full">
          <h3 className={cn(
            'text-sm font-medium',
            error.status === 429 ? 'text-yellow-800' : 'text-red-800'
          )}>
            {getErrorTitle()}
          </h3>
          <p className={cn(
            'mt-1 text-sm',
            error.status === 429 ? 'text-yellow-700' : 'text-red-700'
          )}>
            {error.message}
          </p>

          {error.details && Object.keys(error.details).length > 0 && (
            <div className="mt-3">
              <ValidationSummary
                errors={error.details}
                title="Details:"
                className="bg-transparent border-0 p-0 mb-0"
              />
            </div>
          )}

          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className={cn(
                  'text-sm font-medium hover:underline focus:outline-none focus:underline',
                  error.status === 429 ? 'text-yellow-800' : 'text-red-800'
                )}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface LoadingErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function LoadingError({
  message = 'Failed to load data. Please try again.',
  onRetry,
  className
}: LoadingErrorProps) {
  return (
    <div className={cn('text-center py-8', className)}>
      <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Loading Error
      </h3>
      <p className="text-gray-600 mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Try Again
        </button>
      )}
    </div>
  );
}