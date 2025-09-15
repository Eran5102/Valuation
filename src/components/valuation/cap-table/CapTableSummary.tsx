"use client";

import React from 'react';
import { ShareClass, OptionsWarrants } from '@/types/models';
import { SummaryCard } from '@/components/common/SummaryCard';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import { DollarSign, TrendingUp, PieChart, Users } from 'lucide-react';

interface CapTableSummaryProps {
  shareClasses: ShareClass[];
  options: OptionsWarrants[];
  className?: string;
}

export function CapTableSummary({ shareClasses, options, className }: CapTableSummaryProps) {
  // Calculate summary metrics
  const totalShares = shareClasses.reduce((sum, sc) => sum + sc.sharesOutstanding, 0);
  const totalOptionsShares = options.reduce((sum, opt) => sum + opt.numOptions, 0);
  const fullyDilutedShares = totalShares + totalOptionsShares;
  
  const totalInvested = shareClasses.reduce((sum, sc) => sum + (sc.amountInvested || 0), 0);
  const totalLiquidationPreference = shareClasses
    .filter(sc => sc.shareType === 'preferred')
    .reduce((sum, sc) => sum + (sc.amountInvested || 0) * sc.lpMultiple, 0);
  
  const totalOptionsValue = options.reduce((sum, opt) => sum + (opt.numOptions * opt.exercisePrice), 0);
  
  const commonShares = shareClasses
    .filter(sc => sc.shareType === 'common')
    .reduce((sum, sc) => sum + sc.sharesOutstanding, 0);
  
  const preferredShares = shareClasses
    .filter(sc => sc.shareType === 'preferred')
    .reduce((sum, sc) => sum + sc.sharesOutstanding, 0);

  const commonOwnership = totalShares > 0 ? (commonShares / fullyDilutedShares) * 100 : 0;
  const preferredOwnership = totalShares > 0 ? (preferredShares / fullyDilutedShares) * 100 : 0;
  const optionsOwnership = totalShares > 0 ? (totalOptionsShares / fullyDilutedShares) * 100 : 0;

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard
          title="Total Shares Outstanding"
          value={formatNumber(totalShares)}
          description="Common and preferred shares"
          icon={PieChart}
          trend={{
            direction: 'neutral',
            value: formatNumber(fullyDilutedShares),
            label: 'fully diluted'
          }}
        />
        
        <SummaryCard
          title="Total Amount Invested"
          value={formatCurrency(totalInvested)}
          description="Capital raised to date"
          icon={DollarSign}
          trend={{
            direction: 'up',
            value: formatCurrency(totalLiquidationPreference),
            label: 'liquidation preference'
          }}
        />
        
        <SummaryCard
          title="Options Outstanding"
          value={formatNumber(totalOptionsShares)}
          description="Unexercised options/warrants"
          icon={Users}
          trend={{
            direction: 'neutral',
            value: formatCurrency(totalOptionsValue),
            label: 'exercise value'
          }}
        />
        
        <SummaryCard
          title="Common Ownership"
          value={formatPercentage(commonOwnership)}
          description="On fully diluted basis"
          icon={TrendingUp}
          trend={{
            direction: 'neutral',
            value: formatPercentage(preferredOwnership),
            label: 'preferred ownership'
          }}
        />
      </div>

      {/* Ownership Breakdown */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ownership Breakdown</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Common Stock</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {formatNumber(commonShares)} shares ({formatPercentage(commonOwnership)})
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Preferred Stock</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {formatNumber(preferredShares)} shares ({formatPercentage(preferredOwnership)})
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Options/Warrants</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {formatNumber(totalOptionsShares)} shares ({formatPercentage(optionsOwnership)})
              </div>
            </div>
          </div>
          
          {/* Visual progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
            <div className="flex h-3 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500" 
                style={{ width: `${commonOwnership}%` }}
              ></div>
              <div 
                className="bg-purple-500" 
                style={{ width: `${preferredOwnership}%` }}
              ></div>
              <div 
                className="bg-green-500" 
                style={{ width: `${optionsOwnership}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}