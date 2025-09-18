'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Filter, Search, Edit, Copy, Trash2 } from 'lucide-react';
import { useTableTemplates } from '@/hooks/useTableTemplates';
import AppLayout from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import dynamic from 'next/dynamic';

const DataTable = dynamic(() => import('@/components/ui/optimized-data-table').then(mod => ({ default: mod.OptimizedDataTable })), {
  loading: () => <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>,
  ssr: false
});
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableActionButtons } from '@/components/ui/table-action-buttons';
import { Card, CardContent } from '@/components/ui/card';

interface Template {
  id: string;
  name: string;
  description?: string;
  type: string;
  isSystem?: boolean;
  blocks?: any[];
  createdAt: string;
  updatedAt?: string;
}

export default function ReportLibraryPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const {
    templates,
    isLoading,
    error
  } = useTableTemplates({ autoLoad: true });

  const templateTypes = [
    { value: 'all', label: 'All Templates' },
    { value: '409a', label: '409A Valuation' },
    { value: 'board_deck', label: 'Board Deck' },
    { value: 'cap_table', label: 'Cap Table' },
    { value: 'investor_update', label: 'Investor Update' },
    { value: 'custom', label: 'Custom Reports' }
  ];

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || template.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [templates, searchTerm, selectedType]);

  const handleEditTemplate = (templateId: string) => {
    router.push(`/reports/library/templates?template=${templateId}`);
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    // Template duplication functionality temporarily disabled during cleanup
    console.log('Duplicate template:', templateId);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    // Template deletion functionality temporarily disabled during cleanup
    console.log('Delete template:', templateId);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case '409a': return 'bg-blue-100 text-blue-800';
      case 'board_deck': return 'bg-purple-100 text-purple-800';
      case 'cap_table': return 'bg-green-100 text-green-800';
      case 'investor_update': return 'bg-orange-100 text-orange-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns: ColumnDef<Template>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Template Name',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 p-2 rounded">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{row.original.name}</div>
            {row.original.description && (
              <div className="text-sm text-muted-foreground line-clamp-1">
                {row.original.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Badge className={getTypeColor(row.original.type)}>
            {row.original.type.replace('_', ' ')}
          </Badge>
          {row.original.isSystem && (
            <Badge variant="secondary">System</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'blocks',
      header: 'Sections',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.blocks?.length || 0} sections
        </span>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {new Date(row.original.updatedAt || row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <TableActionButtons
          actions={[
            {
              label: 'Edit',
              icon: Edit,
              onClick: () => handleEditTemplate(row.original.id),
              variant: 'default'
            },
            {
              label: 'Duplicate',
              icon: Copy,
              onClick: () => handleDuplicateTemplate(row.original.id),
              variant: 'secondary'
            },
            ...(row.original.isSystem ? [] : [{
              label: 'Delete',
              icon: Trash2,
              onClick: () => handleDeleteTemplate(row.original.id),
              variant: 'destructive' as const
            }])
          ]}
        />
      ),
    },
  ], []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading report library...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <PageHeader
          title="Report Library"
          description="Manage your report templates and create professional 409A valuations"
          actionButton={{
            href: '/reports/library/templates',
            icon: Plus,
            text: 'New Template'
          }}
        />

        {/* Search and Filter Section */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {templateTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {/* DataTable */}
        <Card>
          <CardContent className="p-6">
            <DataTable
              data={filteredTemplates}
              columns={columns}
              searchPlaceholder="Search templates..."
              emptyState={{
                title: filteredTemplates.length === 0 && (searchTerm || selectedType !== 'all')
                  ? 'No matching templates'
                  : 'No templates yet',
                description: filteredTemplates.length === 0 && (searchTerm || selectedType !== 'all')
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first report template.',
                action: (!searchTerm && selectedType === 'all' && filteredTemplates.length === 0) ? (
                  <Button onClick={() => router.push('/reports/library/templates')}>
                    Create Your First Template
                  </Button>
                ) : undefined
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}