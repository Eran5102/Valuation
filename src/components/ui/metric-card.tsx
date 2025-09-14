import React from 'react';
import { cn } from '@/lib/utils';
import { MetricCardProps } from '@/types';

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}) => {
  const getColorClasses = () => {
    if (trend === 'up') return 'bg-green-50 text-green-600';
    if (trend === 'down') return 'bg-red-50 text-red-600';
    return 'bg-blue-50 text-blue-600';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    return null;
  };

  return (
    <div className={cn(
      "text-center p-4 rounded-lg",
      getColorClasses(),
      className
    )}>
      {Icon && (
        <div className="flex justify-center mb-2">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex items-center justify-center gap-1">
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {getTrendIcon() && (
          <span className="text-lg">{getTrendIcon()}</span>
        )}
      </div>
      <div className="text-sm text-muted-foreground mt-1">
        {title}
      </div>
      {description && (
        <div className="text-xs text-muted-foreground mt-1">
          {description}
        </div>
      )}
    </div>
  );
};