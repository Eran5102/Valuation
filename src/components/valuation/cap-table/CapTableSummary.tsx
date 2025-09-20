'use client'

import React from 'react'
import { ShareClass, OptionsWarrants } from '@/types/models'
import { SummaryCard } from '@/components/common/SummaryCard'
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils'
import { DollarSign, TrendingUp, PieChart, Users } from 'lucide-react'

interface CapTableSummaryProps {
  shareClasses: ShareClass[]
  options: OptionsWarrants[]
  className?: string
}

export function CapTableSummary({ shareClasses, options, className }: CapTableSummaryProps) {
  // Calculate summary metrics
  const totalShares = shareClasses.reduce((sum, sc) => sum + sc.sharesOutstanding, 0)
  const totalOptionsShares = options.reduce((sum, opt) => sum + opt.numOptions, 0)
  const fullyDilutedShares = totalShares + totalOptionsShares

  const totalInvested = shareClasses.reduce((sum, sc) => sum + (sc.amountInvested || 0), 0)
  const totalLiquidationPreference = shareClasses
    .filter((sc) => sc.shareType === 'preferred')
    .reduce((sum, sc) => sum + (sc.amountInvested || 0) * sc.lpMultiple, 0)

  const totalOptionsValue = options.reduce(
    (sum, opt) => sum + opt.numOptions * opt.exercisePrice,
    0
  )

  const commonShares = shareClasses
    .filter((sc) => sc.shareType === 'common')
    .reduce((sum, sc) => sum + sc.sharesOutstanding, 0)

  const preferredShares = shareClasses
    .filter((sc) => sc.shareType === 'preferred')
    .reduce((sum, sc) => sum + sc.sharesOutstanding, 0)

  const commonOwnership = totalShares > 0 ? (commonShares / fullyDilutedShares) * 100 : 0
  const preferredOwnership = totalShares > 0 ? (preferredShares / fullyDilutedShares) * 100 : 0
  const optionsOwnership = totalShares > 0 ? (totalOptionsShares / fullyDilutedShares) * 100 : 0

  return (
    <div className={className}>
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Shares Outstanding"
          value={formatNumber(totalShares)}
          description="Common and preferred shares"
          icon={PieChart}
          trend={{
            direction: 'neutral',
            value: formatNumber(fullyDilutedShares),
            label: 'fully diluted',
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
            label: 'liquidation preference',
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
            label: 'exercise value',
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
            label: 'preferred ownership',
          }}
        />
      </div>

      {/* Ownership Breakdown */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Ownership Breakdown</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-4 w-4 rounded bg-blue-500"></div>
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
              <div className="h-4 w-4 rounded bg-purple-500"></div>
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
              <div className="h-4 w-4 rounded bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">Options/Warrants</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {formatNumber(totalOptionsShares)} shares ({formatPercentage(optionsOwnership)})
              </div>
            </div>
          </div>

          {/* Visual progress bar */}
          <div className="mt-4 h-3 w-full rounded-full bg-gray-200">
            <div className="flex h-3 overflow-hidden rounded-full">
              <div className="bg-blue-500" style={{ width: `${commonOwnership}%` }}></div>
              <div className="bg-purple-500" style={{ width: `${preferredOwnership}%` }}></div>
              <div className="bg-green-500" style={{ width: `${optionsOwnership}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
