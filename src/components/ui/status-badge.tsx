import React from 'react';
import { cn } from '@/lib/utils';

export interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const getStatusColors = (status: string, variant: 'default' | 'outline') => {
  const colorMap: Record<string, { default: string; outline: string }> = {
    draft: {
      default: 'bg-gray-100 text-gray-800',
      outline: 'border-gray-300 text-gray-700 bg-transparent'
    },
    in_progress: {
      default: 'bg-blue-100 text-blue-800',
      outline: 'border-blue-300 text-blue-700 bg-transparent'
    },
    under_review: {
      default: 'bg-yellow-100 text-yellow-800',
      outline: 'border-yellow-300 text-yellow-700 bg-transparent'
    },
    completed: {
      default: 'bg-green-100 text-green-800',
      outline: 'border-green-300 text-green-700 bg-transparent'
    },
    on_hold: {
      default: 'bg-red-100 text-red-800',
      outline: 'border-red-300 text-red-700 bg-transparent'
    },
    Common: {
      default: 'bg-blue-100 text-blue-800',
      outline: 'border-blue-300 text-blue-700 bg-transparent'
    },
    Preferred: {
      default: 'bg-purple-100 text-purple-800',
      outline: 'border-purple-300 text-purple-700 bg-transparent'
    }
  };

  return colorMap[status]?.[variant] || colorMap.draft[variant];
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  variant = 'default',
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        sizeClasses[size],
        getStatusColors(status, variant),
        variant === 'outline' && 'border'
      )}
    >
      {typeof status === 'string' ? status.replace('_', ' ') : status}
    </span>
  );
};