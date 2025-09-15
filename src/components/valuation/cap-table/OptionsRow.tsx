"use client";

import React, { useState, useCallback } from 'react';
import { OptionsWarrants, OptionsType } from '@/types/models';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Edit3, Check, X } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface OptionsRowProps {
  option: OptionsWarrants;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onUpdate: (field: keyof OptionsWarrants, value: unknown) => void;
  onDelete: () => void;
  canDelete?: boolean;
}

export function OptionsRow({
  option,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onUpdate,
  onDelete,
  canDelete = true
}: OptionsRowProps) {
  const [localValues, setLocalValues] = useState<Partial<OptionsWarrants>>({});

  const handleFieldChange = useCallback((field: keyof OptionsWarrants, value: unknown) => {
    if (isEditing) {
      setLocalValues(prev => ({ ...prev, [field]: value }));
    } else {
      onUpdate(field, value);
    }
  }, [isEditing, onUpdate]);

  const handleSave = useCallback(() => {
    // Apply all local changes
    Object.entries(localValues).forEach(([field, value]) => {
      onUpdate(field as keyof OptionsWarrants, value);
    });
    setLocalValues({});
    onSaveEdit();
  }, [localValues, onUpdate, onSaveEdit]);

  const handleCancel = useCallback(() => {
    setLocalValues({});
    onCancelEdit();
  }, [onCancelEdit]);

  const getValue = useCallback((field: keyof OptionsWarrants) => {
    return localValues[field] !== undefined ? localValues[field] : option[field];
  }, [localValues, option]);

  const getTypeColor = (type: OptionsType): string => {
    switch (type) {
      case 'Options':
        return 'bg-blue-100 text-blue-800';
      case 'Warrants':
        return 'bg-green-100 text-green-800';
      case 'RSUs':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <Select
            value={getValue('type') as string}
            onValueChange={(value) => handleFieldChange('type', value as OptionsType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Options">Options</SelectItem>
              <SelectItem value="Warrants">Warrants</SelectItem>
              <SelectItem value="RSUs">RSUs</SelectItem>
            </SelectContent>
          </Select>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Input
            type="number"
            value={getValue('numOptions') as number}
            onChange={(e) => handleFieldChange('numOptions', parseFloat(e.target.value) || 0)}
            className="w-full"
            placeholder="0"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Input
            type="number"
            step="0.01"
            value={getValue('exercisePrice') as number}
            onChange={(e) => handleFieldChange('exercisePrice', parseFloat(e.target.value) || 0)}
            className="w-full"
            placeholder="0.00"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-gray-900">
            {formatCurrency((getValue('numOptions') as number || 0) * (getValue('exercisePrice') as number || 0))}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex space-x-2">
            <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(option.type)}`}>
          {option.type}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatNumber(option.numOptions)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatCurrency(option.exercisePrice)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatCurrency(option.numOptions * option.exercisePrice)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={onStartEdit}>
            <Edit3 className="h-4 w-4" />
          </Button>
          {canDelete && (
            <Button size="sm" variant="outline" onClick={onDelete} className="text-red-600 hover:text-red-700">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}