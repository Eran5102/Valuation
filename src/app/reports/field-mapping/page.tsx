'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/components/layout/AppLayout';
import { FieldMapping } from '@/components/templates/FieldMapping';
import type { TemplateVariable } from '@/lib/templates/types';

export default function FieldMappingPage() {
  const router = useRouter();

  const handleFieldSelect = (variable: TemplateVariable) => {
    // In a real implementation, this might copy to clipboard or show usage examples
    navigator.clipboard.writeText(`{{${variable.id}}}`);

    // Show temporary notification (you could use a toast library instead)
    const originalTitle = document.title;
    document.title = `Copied: {{${variable.id}}}`;
    setTimeout(() => {
      document.title = originalTitle;
    }, 2000);
  };

  const handleBackToEditor = () => {
    router.push('/reports/template-editor');
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToEditor}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Template Editor</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">409A Field Mapping</h1>
              <p className="text-muted-foreground">
                Comprehensive field reference for 409A valuation templates
              </p>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How to use:</strong> Click on any field to copy its placeholder syntax to clipboard.
            You can then paste it into your template blocks using the format <code className="bg-muted px-1 rounded">{"{{field_id}}"}</code>.
            Fields marked as "Required" should be included in your templates for complete 409A compliance.
          </AlertDescription>
        </Alert>

        {/* Field Mapping Component */}
        <FieldMapping onFieldSelect={handleFieldSelect} />
      </div>
    </AppLayout>
  );
}