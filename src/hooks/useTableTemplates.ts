import { useState, useEffect, useMemo } from 'react';
import {
  TABLE_TEMPLATES,
  TableTemplate,
  getTableTemplate,
  getTemplatesByCategory,
  populateTemplateWithData
} from '@/data/tableTemplates';

interface UseTableTemplatesOptions {
  category?: TableTemplate['category'];
  autoLoad?: boolean;
}

interface UseTableTemplatesReturn {
  // Templates
  templates: TableTemplate[];
  getTemplate: (id: string) => TableTemplate | undefined;
  getTemplatesByCategory: (category: TableTemplate['category']) => TableTemplate[];

  // Dynamic data population
  populateTemplate: (templateId: string, data: any[]) => TableTemplate | undefined;

  // State
  isLoading: boolean;
  error: string | null;
}

// Lightweight hook that replaces useReportTemplates without Supabase dependency
export function useTableTemplates({
  category,
  autoLoad = true
}: UseTableTemplatesOptions = {}): UseTableTemplatesReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter templates by category if specified
  const templates = useMemo(() => {
    if (category) {
      return getTemplatesByCategory(category);
    }
    return TABLE_TEMPLATES;
  }, [category]);

  // Simulate loading state for consistency with previous API
  useEffect(() => {
    if (autoLoad) {
      setIsLoading(true);
      // Simulate async loading (can be removed if not needed)
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [autoLoad, category]);

  const getTemplate = (id: string): TableTemplate | undefined => {
    return getTableTemplate(id);
  };

  const getTemplatesByCategoryFn = (cat: TableTemplate['category']): TableTemplate[] => {
    return getTemplatesByCategory(cat);
  };

  const populateTemplate = (templateId: string, data: any[]): TableTemplate | undefined => {
    const template = getTableTemplate(templateId);
    if (!template) return undefined;

    return populateTemplateWithData(template, data);
  };

  return {
    templates,
    getTemplate,
    getTemplatesByCategory: getTemplatesByCategoryFn,
    populateTemplate,
    isLoading,
    error
  };
}

// Helper hook for 409A specific templates
export function use409ATemplates() {
  return useTableTemplates({ category: '409a', autoLoad: true });
}

// Helper hook for cap table templates
export function useCapTableTemplates() {
  return useTableTemplates({ category: 'cap-table', autoLoad: true });
}

// Helper hook for waterfall templates
export function useWaterfallTemplates() {
  return useTableTemplates({ category: 'waterfall', autoLoad: true });
}

// Helper hook for analysis templates
export function useAnalysisTemplates() {
  return useTableTemplates({ category: 'analysis', autoLoad: true });
}