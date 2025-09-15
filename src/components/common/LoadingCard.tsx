"use client";

import { LoadingCardProps } from "@/types/common";
import { cn } from "@/lib/utils";

export function LoadingCard({
  className,
  rows = 3,
  showAvatar = false,
  showActions = false
}: LoadingCardProps) {
  return (
    <div className={cn("animate-pulse bg-white p-6 rounded-lg border border-gray-200", className)}>
      {/* Header with avatar if requested */}
      {showAvatar && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      )}
      
      {/* Content rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div 
              className={cn(
                "h-4 bg-gray-200 rounded",
                index === 0 ? "w-3/4" : index === rows - 1 ? "w-2/3" : "w-full"
              )}
            ></div>
            {index === 0 && (
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            )}
          </div>
        ))}
      </div>
      
      {/* Actions if requested */}
      {showActions && (
        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-100">
          <div className="h-8 bg-gray-200 rounded w-16"></div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
      )}
    </div>
  );
}

// Loading skeleton for table rows
export function LoadingTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-6 py-4 whitespace-nowrap">
          <div 
            className={cn(
              "h-4 bg-gray-200 rounded",
              index === 0 ? "w-3/4" : index === columns - 1 ? "w-1/2" : "w-full"
            )}
          ></div>
        </td>
      ))}
    </tr>
  );
}

// Loading skeleton for form fields
export function LoadingFormField() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
  );
}

// Loading skeleton for metrics/stats
export function LoadingMetric() {
  return (
    <div className="animate-pulse bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
      </div>
      <div className="mt-4">
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  );
}

// Loading skeleton for lists
export function LoadingList({ items = 5 }: { items?: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="p-4 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-gray-200 h-8 w-8"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Generic loading spinner
export function LoadingSpinner({ 
  size = "md", 
  className 
}: { 
  size?: "sm" | "md" | "lg"; 
  className?: string; 
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };
  
  return (
    <div className={cn("animate-spin rounded-full border-2 border-gray-300 border-t-blue-600", sizeClasses[size], className)}></div>
  );
}

// Re-export types for convenience
export type { LoadingCardProps };