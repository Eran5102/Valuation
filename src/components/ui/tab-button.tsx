import React from 'react';
import { cn } from '@/lib/utils';

export interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon?: React.ElementType;
  children: React.ReactNode;
  disabled?: boolean;
}

export const TabButton: React.FC<TabButtonProps> = ({ 
  active, 
  onClick, 
  icon: Icon, 
  children, 
  disabled = false 
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    )}
  >
    {Icon && <Icon className="h-4 w-4 mr-2" />}
    {children}
  </button>
);