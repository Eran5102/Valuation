'use client';

import React, { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  Database,
  Hash,
  Calendar,
  DollarSign,
  Percent,
  Type,
  Building,
  TrendingUp,
  CreditCard,
  Target,
  Share,
  Calculator,
  UserCheck
} from 'lucide-react';
import type { TemplateVariable, VariableType } from '@/lib/templates/types';
import { standard409ATemplate } from '@/lib/templates/409a-template';

interface DraggableFieldProps {
  variable: TemplateVariable;
}

function DraggableField({ variable }: DraggableFieldProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `field-${variable.id}`,
    data: {
      field: variable,
      type: 'field'
    }
  });

  const getTypeIcon = (type: VariableType) => {
    switch (type) {
      case 'text': return Type;
      case 'number': return Hash;
      case 'date': return Calendar;
      case 'currency': return DollarSign;
      case 'percentage': return Percent;
      case 'boolean': return Target;
      default: return Database;
    }
  };

  const getTypeColor = (type: VariableType) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'number': return 'bg-green-100 text-green-800';
      case 'date': return 'bg-purple-100 text-purple-800';
      case 'currency': return 'bg-yellow-100 text-yellow-800';
      case 'percentage': return 'bg-pink-100 text-pink-800';
      case 'boolean': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'Company': return Building;
      case 'Valuation': return TrendingUp;
      case 'Financials': return DollarSign;
      case 'Funding': return CreditCard;
      case 'Results': return Target;
      case 'Shares': return Share;
      case 'Methodology': return Calculator;
      case 'Appraiser': return UserCheck;
      default: return Database;
    }
  };

  const TypeIcon = getTypeIcon(variable.type);
  const CategoryIcon = getCategoryIcon(variable.category);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`field-mapping-item group cursor-grab active:cursor-grabbing p-3 border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CategoryIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground truncate">
              {variable.name}
            </span>
            {variable.required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Badge className={getTypeColor(variable.type)}>
              <TypeIcon className="w-3 h-3 mr-1" />
              {variable.type}
            </Badge>
            {variable.category && (
              <Badge variant="outline" className="text-xs">
                {variable.category}
              </Badge>
            )}
          </div>

          <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {variable.description || 'No description available'}
          </div>

          <div className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
            {`{{${variable.id}}}`}
          </div>

          {variable.defaultValue && (
            <div className="text-xs text-muted-foreground mt-1">
              Default: {variable.defaultValue}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface FieldMappingProps {
  onFieldSelect?: (variable: TemplateVariable) => void;
  compact?: boolean;
  selectedCategory?: string;
  className?: string;
}

export function FieldMapping({
  onFieldSelect,
  compact = false,
  selectedCategory,
  className
}: FieldMappingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(selectedCategory || null);

  // Get all variables from the 409A template
  const allVariables = standard409ATemplate.variables;

  // Group variables by category
  const categories = useMemo(() => {
    const grouped = allVariables.reduce((acc, variable) => {
      const category = variable.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(variable);
      return acc;
    }, {} as Record<string, TemplateVariable[]>);

    return grouped;
  }, [allVariables]);

  // Filter variables based on search and category
  const filteredVariables = useMemo(() => {
    let filtered = allVariables;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(variable =>
        variable.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        variable.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        variable.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        variable.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by active category
    if (activeCategory) {
      filtered = filtered.filter(variable => variable.category === activeCategory);
    }

    return filtered;
  }, [allVariables, searchQuery, activeCategory]);

  const getCategoryStats = (categoryName: string) => {
    const categoryVars = categories[categoryName] || [];
    const required = categoryVars.filter(v => v.required).length;
    const total = categoryVars.length;
    return { required, total };
  };

  const handleFieldClick = (variable: TemplateVariable) => {
    onFieldSelect?.(variable);
  };

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base">
            <Database className="w-4 h-4 mr-2" />
            Field Mapping
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Drag fields to insert into blocks
          </p>
        </CardHeader>
        <CardContent className="h-[calc(100vh-320px)] overflow-y-auto space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-8"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-1">
            <Button
              variant={activeCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(null)}
              className="h-6 text-xs"
            >
              All ({allVariables.length})
            </Button>
            {Object.keys(categories).map((category) => {
              const stats = getCategoryStats(category);
              return (
                <Button
                  key={category}
                  variant={activeCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                  className="h-6 text-xs"
                >
                  {category} ({stats.total})
                </Button>
              );
            })}
          </div>

          {/* Fields */}
          <div className="space-y-2">
            {filteredVariables.map((variable) => (
              <DraggableField
                key={variable.id}
                variable={variable}
              />
            ))}
          </div>

          {filteredVariables.length === 0 && (
            <div className="text-center py-6">
              <Database className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No fields found</p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your search or filter
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Field Mapping</h2>
        <p className="text-muted-foreground">
          Comprehensive 409A valuation fields ({allVariables.length} total fields)
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search fields by name, ID, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button
          variant={activeCategory === null ? 'default' : 'outline'}
          onClick={() => setActiveCategory(null)}
        >
          All Categories ({allVariables.length})
        </Button>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Object.entries(categories).map(([categoryName, categoryVariables]) => {
          const stats = getCategoryStats(categoryName);
          const isActive = activeCategory === categoryName;

          return (
            <Card
              key={categoryName}
              className={`cursor-pointer transition-all ${
                isActive ? 'ring-2 ring-primary' : 'hover:shadow-md'
              }`}
              onClick={() => setActiveCategory(isActive ? null : categoryName)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{categoryName}</CardTitle>
                  <Badge variant="secondary">{stats.total}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {stats.required} required, {stats.total - stats.required} optional
                </div>
              </CardHeader>

              {isActive && (
                <CardContent className="pt-0">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {categoryVariables.map((variable) => (
                      <DraggableField
                        key={variable.id}
                        variable={variable}
                      />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Filtered Results (when searching or category selected) */}
      {(searchQuery.trim() || activeCategory) && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {searchQuery.trim()
              ? `Search Results (${filteredVariables.length} found)`
              : `${activeCategory} Fields (${filteredVariables.length})`
            }
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVariables.map((variable) => (
              <DraggableField
                key={variable.id}
                variable={variable}
              />
            ))}
          </div>

          {filteredVariables.length === 0 && (
            <div className="text-center py-12">
              <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No fields found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or browse different categories.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}