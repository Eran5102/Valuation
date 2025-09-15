"use client";

import React, { useState, useCallback } from 'react';
import { ShareClass } from '@/types/models';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Edit3, Check, X } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';

interface ShareClassRowProps {
  shareClass: ShareClass;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onUpdate: (field: keyof ShareClass, value: unknown) => void;
  onDelete: () => void;
  canDelete?: boolean;
}

export function ShareClassRow({
  shareClass,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onUpdate,
  onDelete,
  canDelete = true
}: ShareClassRowProps) {
  const [localValues, setLocalValues] = useState<Partial<ShareClass>>({});

  const handleFieldChange = useCallback((field: keyof ShareClass, value: unknown) => {
    if (isEditing) {
      setLocalValues(prev => ({ ...prev, [field]: value }));
    } else {
      onUpdate(field, value);
    }
  }, [isEditing, onUpdate]);

  const handleSave = useCallback(() => {
    // Apply all local changes
    Object.entries(localValues).forEach(([field, value]) => {
      onUpdate(field as keyof ShareClass, value);
    });
    setLocalValues({});
    onSaveEdit();
  }, [localValues, onUpdate, onSaveEdit]);

  const handleCancel = useCallback(() => {
    setLocalValues({});
    onCancelEdit();
  }, [onCancelEdit]);

  const getValue = useCallback((field: keyof ShareClass) => {
    return localValues[field] !== undefined ? localValues[field] : shareClass[field];
  }, [localValues, shareClass]);

  if (isEditing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <Input
            value={getValue('name') as string}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className="w-full"
            placeholder="Share class name"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Select
            value={getValue('shareType') as string}
            onValueChange={(value) => handleFieldChange('shareType', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="common">Common</SelectItem>
              <SelectItem value="preferred">Preferred</SelectItem>
            </SelectContent>
          </Select>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Input
            type="date"
            value={getValue('roundDate') as string}
            onChange={(e) => handleFieldChange('roundDate', e.target.value)}
            className="w-full"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Input
            type="number"
            value={getValue('sharesOutstanding') as number}
            onChange={(e) => handleFieldChange('sharesOutstanding', parseFloat(e.target.value) || 0)}
            className="w-full"
            placeholder="0"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Input
            type="number"
            step="0.01"
            value={getValue('pricePerShare') as number}
            onChange={(e) => handleFieldChange('pricePerShare', parseFloat(e.target.value) || 0)}
            className="w-full"
            placeholder="0.00"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-gray-900">
            {formatCurrency((getValue('sharesOutstanding') as number || 0) * (getValue('pricePerShare') as number || 0))}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Select
            value={getValue('preferenceType') as string}
            onValueChange={(value) => handleFieldChange('preferenceType', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="non-participating">Non-Participating</SelectItem>
              <SelectItem value="participating">Participating</SelectItem>
              <SelectItem value="participating-with-cap">Participating with Cap</SelectItem>
            </SelectContent>
          </Select>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Input
            type="number"
            step="0.1"
            value={getValue('lpMultiple') as number}
            onChange={(e) => handleFieldChange('lpMultiple', parseFloat(e.target.value) || 1)}
            className="w-full"
            placeholder="1.0"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Input
            type="number"
            value={getValue('seniority') as number}
            onChange={(e) => handleFieldChange('seniority', parseInt(e.target.value) || 0)}
            className="w-full"
            placeholder="0"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Input
            type="number"
            step="0.01"
            value={getValue('conversionRatio') as number}
            onChange={(e) => handleFieldChange('conversionRatio', parseFloat(e.target.value) || 1)}
            className="w-full"
            placeholder="1.0"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            <Switch
              checked={getValue('dividendsDeclared') as boolean}
              onCheckedChange={(checked) => handleFieldChange('dividendsDeclared', checked)}
            />
            <span className="text-sm">{getValue('dividendsDeclared') ? 'Yes' : 'No'}</span>
          </div>
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
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {shareClass.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          shareClass.shareType === 'common' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-purple-100 text-purple-800'
        }`}>
          {shareClass.shareType === 'common' ? 'Common' : 'Preferred'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(shareClass.roundDate).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatNumber(shareClass.sharesOutstanding)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatCurrency(shareClass.pricePerShare)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatCurrency(shareClass.amountInvested || 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {shareClass.preferenceType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {shareClass.lpMultiple}x
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {shareClass.seniority}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {shareClass.conversionRatio}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          shareClass.dividendsDeclared 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {shareClass.dividendsDeclared ? 'Yes' : 'No'}
        </span>
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