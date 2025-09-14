'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Calculator,
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'

export default function NewValuationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    clientName: '',
    valuationType: '409A',
    valuationDate: '',
    purpose: '',
    methodology: 'DCF',
    shares: '',
    preferences: '',
    notes: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // In a real app, this would save to Supabase
      console.log('Saving valuation:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect back to valuations page
      router.push('/valuations')
    } catch (error) {
      console.error('Failed to save valuation:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link 
            href="/valuations"
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">New Valuation</h1>
            <p className="mt-1 text-muted-foreground">
              Create a new 409A or financial valuation
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card shadow rounded-lg border border-border">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-card-foreground mb-4 flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Valuation Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-card-foreground mb-1">
                    Client/Company *
                  </label>
                  <select
                    id="clientName"
                    name="clientName"
                    required
                    value={formData.clientName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                  >
                    <option value="">Select client</option>
                    <option value="TechStart Inc.">TechStart Inc.</option>
                    <option value="InnovateCorp">InnovateCorp</option>
                    <option value="StartupXYZ">StartupXYZ</option>
                    <option value="NextGen Solutions">NextGen Solutions</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="valuationType" className="block text-sm font-medium text-card-foreground mb-1">
                    Valuation Type *
                  </label>
                  <select
                    id="valuationType"
                    name="valuationType"
                    required
                    value={formData.valuationType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                  >
                    <option value="409A">409A Valuation</option>
                    <option value="Pre-Money">Pre-Money Valuation</option>
                    <option value="Post-Money">Post-Money Valuation</option>
                    <option value="Fairness Opinion">Fairness Opinion</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="valuationDate" className="block text-sm font-medium text-card-foreground mb-1">
                    Valuation Date *
                  </label>
                  <input
                    type="date"
                    id="valuationDate"
                    name="valuationDate"
                    required
                    value={formData.valuationDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                  />
                </div>
                <div>
                  <label htmlFor="methodology" className="block text-sm font-medium text-card-foreground mb-1">
                    Methodology
                  </label>
                  <select
                    id="methodology"
                    name="methodology"
                    value={formData.methodology}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                  >
                    <option value="DCF">Discounted Cash Flow (DCF)</option>
                    <option value="Market">Market Approach</option>
                    <option value="Asset">Asset Approach</option>
                    <option value="Hybrid">Hybrid Approach</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div>
              <h3 className="text-lg font-medium text-card-foreground mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Financial Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="shares" className="block text-sm font-medium text-card-foreground mb-1">
                    Outstanding Shares
                  </label>
                  <input
                    type="number"
                    id="shares"
                    name="shares"
                    value={formData.shares}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-card text-card-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                    placeholder="10,000,000"
                  />
                </div>
                <div>
                  <label htmlFor="preferences" className="block text-sm font-medium text-card-foreground mb-1">
                    Liquidation Preferences
                  </label>
                  <input
                    type="text"
                    id="preferences"
                    name="preferences"
                    value={formData.preferences}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-card text-card-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                    placeholder="1x non-participating"
                  />
                </div>
              </div>
            </div>

            {/* Purpose and Notes */}
            <div>
              <h3 className="text-lg font-medium text-card-foreground mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Additional Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="purpose" className="block text-sm font-medium text-card-foreground mb-1">
                    Purpose of Valuation
                  </label>
                  <select
                    id="purpose"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                  >
                    <option value="">Select purpose</option>
                    <option value="Stock Option Grants">Stock Option Grants</option>
                    <option value="Financial Reporting">Financial Reporting</option>
                    <option value="Tax Compliance">Tax Compliance</option>
                    <option value="Transaction Support">Transaction Support</option>
                    <option value="Board Resolution">Board Resolution</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-card-foreground mb-1">
                    Notes & Special Considerations
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-card text-card-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                    placeholder="Any special considerations, recent transactions, or market conditions to consider..."
                  />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-card-foreground mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Expected Timeline
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Draft valuation: 5-7 business days</p>
                <p>• Client review period: 3-5 business days</p>
                <p>• Final report delivery: 2-3 business days after approval</p>
                <p>• Total estimated time: 10-15 business days</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-border">
              <Link 
                href="/valuations"
                className="px-4 py-2 text-sm font-medium text-card-foreground bg-card border border-border rounded-md hover:bg-muted transition-colors"
              >
                Cancel
              </Link>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-card-foreground bg-card border border-border rounded-md hover:bg-muted transition-colors"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Valuation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}