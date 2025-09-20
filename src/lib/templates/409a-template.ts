import type { ReportTemplate } from './types'

/**
 * Standard 409A Valuation Report Template
 * Based on value8 report template new4.pdf
 */
export const standard409ATemplate: ReportTemplate = {
  id: '409a-standard-v1',
  name: 'Standard 409A Valuation Report',
  description: 'Comprehensive 409A valuation report template with all required sections',
  category: 'financial',
  version: '1.0.0',

  variables: [
    // Company Information
    { id: 'company_name', name: 'Company Name', type: 'text', required: true, category: 'Company' },
    {
      id: 'company_address',
      name: 'Company Address',
      type: 'text',
      required: true,
      category: 'Company',
    },
    { id: 'company_ein', name: 'EIN', type: 'text', required: false, category: 'Company' },
    {
      id: 'company_state',
      name: 'State of Incorporation',
      type: 'text',
      required: true,
      category: 'Company',
    },
    {
      id: 'company_incorporation_date',
      name: 'Date of Incorporation',
      type: 'date',
      required: true,
      category: 'Company',
      format: 'MM/DD/YYYY',
    },
    {
      id: 'company_fiscal_year_end',
      name: 'Fiscal Year End',
      type: 'text',
      required: true,
      category: 'Company',
    },
    { id: 'company_industry', name: 'Industry', type: 'text', required: true, category: 'Company' },
    {
      id: 'company_stage',
      name: 'Company Stage',
      type: 'text',
      required: true,
      category: 'Company',
    },
    {
      id: 'company_employees',
      name: 'Number of Employees',
      type: 'number',
      required: true,
      category: 'Company',
    },

    // Valuation Details
    {
      id: 'valuation_date',
      name: 'Valuation Date',
      type: 'date',
      required: true,
      category: 'Valuation',
      format: 'MMMM DD, YYYY',
    },
    {
      id: 'report_date',
      name: 'Report Date',
      type: 'date',
      required: true,
      category: 'Valuation',
      format: 'MMMM DD, YYYY',
    },
    {
      id: 'valuation_purpose',
      name: 'Valuation Purpose',
      type: 'text',
      required: true,
      defaultValue: 'Section 409A of the Internal Revenue Code',
      category: 'Valuation',
    },
    {
      id: 'standard_of_value',
      name: 'Standard of Value',
      type: 'text',
      required: true,
      defaultValue: 'Fair Market Value',
      category: 'Valuation',
    },
    {
      id: 'premise_of_value',
      name: 'Premise of Value',
      type: 'text',
      required: true,
      defaultValue: 'Going Concern',
      category: 'Valuation',
    },

    // Financial Metrics
    {
      id: 'revenue_current',
      name: 'Current Year Revenue',
      type: 'currency',
      required: false,
      category: 'Financials',
    },
    {
      id: 'revenue_prior',
      name: 'Prior Year Revenue',
      type: 'currency',
      required: false,
      category: 'Financials',
    },
    {
      id: 'revenue_growth',
      name: 'Revenue Growth Rate',
      type: 'percentage',
      required: false,
      category: 'Financials',
    },
    {
      id: 'gross_margin',
      name: 'Gross Margin',
      type: 'percentage',
      required: false,
      category: 'Financials',
    },
    {
      id: 'operating_margin',
      name: 'Operating Margin',
      type: 'percentage',
      required: false,
      category: 'Financials',
    },
    {
      id: 'cash_balance',
      name: 'Cash Balance',
      type: 'currency',
      required: true,
      category: 'Financials',
    },
    {
      id: 'burn_rate',
      name: 'Monthly Burn Rate',
      type: 'currency',
      required: false,
      category: 'Financials',
    },
    {
      id: 'runway_months',
      name: 'Runway (Months)',
      type: 'number',
      required: false,
      category: 'Financials',
    },

    // Funding Information
    {
      id: 'total_funding',
      name: 'Total Funding Raised',
      type: 'currency',
      required: true,
      category: 'Funding',
    },
    {
      id: 'last_round_date',
      name: 'Last Round Date',
      type: 'date',
      required: false,
      category: 'Funding',
      format: 'MM/DD/YYYY',
    },
    {
      id: 'last_round_amount',
      name: 'Last Round Amount',
      type: 'currency',
      required: false,
      category: 'Funding',
    },
    {
      id: 'last_round_valuation',
      name: 'Last Round Valuation',
      type: 'currency',
      required: false,
      category: 'Funding',
    },
    {
      id: 'preferred_liquidation',
      name: 'Preferred Liquidation Preference',
      type: 'currency',
      required: true,
      category: 'Funding',
    },

    // Valuation Results
    {
      id: 'enterprise_value',
      name: 'Enterprise Value',
      type: 'currency',
      required: true,
      category: 'Results',
    },
    {
      id: 'equity_value',
      name: 'Equity Value',
      type: 'currency',
      required: true,
      category: 'Results',
    },
    {
      id: 'common_value_per_share',
      name: 'Common Stock Value per Share',
      type: 'currency',
      required: true,
      category: 'Results',
    },
    {
      id: 'preferred_value_per_share',
      name: 'Preferred Stock Value per Share',
      type: 'currency',
      required: false,
      category: 'Results',
    },
    {
      id: 'discount_lack_marketability',
      name: 'Discount for Lack of Marketability',
      type: 'percentage',
      required: true,
      defaultValue: '30%',
      category: 'Results',
    },
    {
      id: 'discount_minority_interest',
      name: 'Discount for Minority Interest',
      type: 'percentage',
      required: false,
      category: 'Results',
    },

    // Share Information
    {
      id: 'common_shares_outstanding',
      name: 'Common Shares Outstanding',
      type: 'number',
      required: true,
      category: 'Shares',
    },
    {
      id: 'preferred_shares_outstanding',
      name: 'Preferred Shares Outstanding',
      type: 'number',
      required: false,
      category: 'Shares',
    },
    {
      id: 'options_outstanding',
      name: 'Options Outstanding',
      type: 'number',
      required: true,
      category: 'Shares',
    },
    {
      id: 'warrants_outstanding',
      name: 'Warrants Outstanding',
      type: 'number',
      required: false,
      category: 'Shares',
    },
    {
      id: 'fully_diluted_shares',
      name: 'Fully Diluted Shares',
      type: 'number',
      required: true,
      category: 'Shares',
    },
    {
      id: 'option_pool_size',
      name: 'Option Pool Size',
      type: 'percentage',
      required: true,
      category: 'Shares',
    },

    // Methodology
    {
      id: 'primary_methodology',
      name: 'Primary Valuation Method',
      type: 'text',
      required: true,
      defaultValue: 'Option Pricing Model',
      category: 'Methodology',
    },
    {
      id: 'secondary_methodology',
      name: 'Secondary Valuation Method',
      type: 'text',
      required: false,
      category: 'Methodology',
    },
    {
      id: 'volatility',
      name: 'Volatility',
      type: 'percentage',
      required: true,
      category: 'Methodology',
    },
    {
      id: 'risk_free_rate',
      name: 'Risk-Free Rate',
      type: 'percentage',
      required: true,
      category: 'Methodology',
    },
    {
      id: 'expected_term',
      name: 'Expected Term (Years)',
      type: 'number',
      required: true,
      category: 'Methodology',
    },

    // Appraiser Information
    {
      id: 'appraiser_name',
      name: 'Appraiser Name',
      type: 'text',
      required: true,
      category: 'Appraiser',
    },
    {
      id: 'appraiser_firm',
      name: 'Appraiser Firm',
      type: 'text',
      required: true,
      category: 'Appraiser',
    },
    {
      id: 'appraiser_credentials',
      name: 'Appraiser Credentials',
      type: 'text',
      required: false,
      category: 'Appraiser',
    },
  ],

  sections: [
    {
      id: 'cover',
      title: 'Cover Page',
      pageBreakAfter: true,
      blocks: [
        {
          id: 'cover-header',
          type: 'header',
          content: 'VALUATION REPORT',
          styling: {
            fontSize: 32,
            fontWeight: 'bold',
            textAlign: 'center',
            margin: '60px 0 40px 0',
          },
        },
        {
          id: 'cover-company',
          type: 'header',
          content: '{{company_name}}',
          styling: {
            fontSize: 28,
            fontWeight: 'bold',
            textAlign: 'center',
            margin: '0 0 20px 0',
          },
        },
        {
          id: 'cover-purpose',
          type: 'paragraph',
          content: 'Valuation of Common Stock for Purposes of {{valuation_purpose}}',
          styling: {
            fontSize: 18,
            textAlign: 'center',
            margin: '0 0 40px 0',
          },
        },
        {
          id: 'cover-date',
          type: 'paragraph',
          content: 'As of {{valuation_date}}',
          styling: {
            fontSize: 16,
            textAlign: 'center',
            margin: '0 0 60px 0',
          },
        },
        {
          id: 'cover-prepared',
          type: 'paragraph',
          content: 'Prepared by:\n{{appraiser_firm}}\n{{report_date}}',
          styling: {
            fontSize: 14,
            textAlign: 'center',
            margin: '40px 0',
          },
        },
      ],
    },
    {
      id: 'executive-summary',
      title: 'Executive Summary',
      pageBreakBefore: true,
      blocks: [
        {
          id: 'exec-header',
          type: 'header',
          content: 'EXECUTIVE SUMMARY',
          styling: {
            fontSize: 24,
            fontWeight: 'bold',
            margin: '0 0 30px 0',
          },
        },
        {
          id: 'exec-intro',
          type: 'paragraph',
          content:
            '{{appraiser_firm}} ("we" or "Valuation Firm") has been engaged by {{company_name}} (the "Company") to estimate the fair market value of the Company\'s common stock as of {{valuation_date}} (the "Valuation Date") for purposes of {{valuation_purpose}}.',
          styling: {
            margin: '0 0 20px 0',
          },
        },
        {
          id: 'exec-opinion',
          type: 'paragraph',
          content:
            "Based on our analysis, and subject to the assumptions, qualifications, and limiting conditions set forth in this report, it is our opinion that the fair market value of one share of the Company's common stock as of the Valuation Date is {{common_value_per_share}}.",
          styling: {
            margin: '0 0 20px 0',
            fontWeight: 'bold',
          },
        },
        {
          id: 'exec-methodology',
          type: 'paragraph',
          content:
            "In reaching our opinion of value, we utilized the {{primary_methodology}} as our primary valuation approach. We considered various factors including the Company's financial condition, funding history, market position, and growth prospects.",
          styling: {
            margin: '0 0 20px 0',
          },
        },
        {
          id: 'exec-company-overview',
          type: 'header',
          content: 'Company Overview',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            margin: '30px 0 15px 0',
          },
        },
        {
          id: 'exec-company-desc',
          type: 'paragraph',
          content:
            '{{company_name}} is a {{company_stage}} stage company incorporated in {{company_state}} on {{company_incorporation_date}}. The Company operates in the {{company_industry}} industry and currently has {{company_employees}} employees.',
          styling: {
            margin: '0 0 20px 0',
          },
        },
        {
          id: 'exec-key-factors',
          type: 'header',
          content: 'Key Valuation Factors',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            margin: '30px 0 15px 0',
          },
        },
        {
          id: 'exec-factors-list',
          type: 'list',
          content: [
            'Enterprise Value: {{enterprise_value}}',
            'Equity Value: {{equity_value}}',
            'Fully Diluted Shares Outstanding: {{fully_diluted_shares}}',
            'Common Stock Value per Share: {{common_value_per_share}}',
            'Discount for Lack of Marketability Applied: {{discount_lack_marketability}}',
          ],
        },
      ],
    },
    {
      id: 'company-background',
      title: 'Company Background',
      pageBreakBefore: true,
      blocks: [
        {
          id: 'background-header',
          type: 'header',
          content: 'COMPANY BACKGROUND',
          styling: {
            fontSize: 24,
            fontWeight: 'bold',
            margin: '0 0 30px 0',
          },
        },
        {
          id: 'background-overview',
          type: 'header',
          content: 'Business Overview',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            margin: '0 0 15px 0',
          },
        },
        {
          id: 'background-desc',
          type: 'paragraph',
          content:
            '{{company_name}} was incorporated in {{company_state}} on {{company_incorporation_date}}. The Company is classified as a {{company_stage}} stage company operating in the {{company_industry}} industry.',
          styling: {
            margin: '0 0 20px 0',
          },
        },
        {
          id: 'background-operations',
          type: 'paragraph',
          content:
            "The Company's fiscal year ends on {{company_fiscal_year_end}}. As of the Valuation Date, the Company had {{company_employees}} full-time employees.",
          styling: {
            margin: '0 0 20px 0',
          },
        },
        {
          id: 'background-funding-header',
          type: 'header',
          content: 'Funding History',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            margin: '30px 0 15px 0',
          },
        },
        {
          id: 'background-funding',
          type: 'paragraph',
          content:
            'To date, the Company has raised a total of {{total_funding}} in funding. The most recent financing round was completed on {{last_round_date}}, raising {{last_round_amount}} at a post-money valuation of {{last_round_valuation}}.',
          styling: {
            margin: '0 0 20px 0',
          },
          conditionalDisplay: {
            variable: 'last_round_date',
            condition: 'exists',
          },
        },
        {
          id: 'background-financial-header',
          type: 'header',
          content: 'Financial Performance',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            margin: '30px 0 15px 0',
          },
        },
        {
          id: 'background-financial',
          type: 'paragraph',
          content:
            "The Company's current annual revenue is {{revenue_current}}, representing a {{revenue_growth}} growth rate from the prior year revenue of {{revenue_prior}}. The Company maintains a cash balance of {{cash_balance}} as of the Valuation Date.",
          styling: {
            margin: '0 0 20px 0',
          },
          conditionalDisplay: {
            variable: 'revenue_current',
            condition: 'exists',
          },
        },
        {
          id: 'background-burn',
          type: 'paragraph',
          content:
            "The Company's current monthly burn rate is approximately {{burn_rate}}, providing a runway of {{runway_months}} months based on current cash reserves.",
          styling: {
            margin: '0 0 20px 0',
          },
          conditionalDisplay: {
            variable: 'burn_rate',
            condition: 'exists',
          },
        },
      ],
    },
    {
      id: 'valuation-methodology',
      title: 'Valuation Methodology',
      pageBreakBefore: true,
      blocks: [
        {
          id: 'method-header',
          type: 'header',
          content: 'VALUATION METHODOLOGY',
          styling: {
            fontSize: 24,
            fontWeight: 'bold',
            margin: '0 0 30px 0',
          },
        },
        {
          id: 'method-approach-header',
          type: 'header',
          content: 'Valuation Approaches',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            margin: '0 0 15px 0',
          },
        },
        {
          id: 'method-intro',
          type: 'paragraph',
          content:
            "In determining the fair market value of the Company's common stock, we considered three general approaches to valuation: the income approach, the market approach, and the asset-based approach.",
          styling: {
            margin: '0 0 20px 0',
          },
        },
        {
          id: 'method-selected',
          type: 'paragraph',
          content:
            "For this valuation, we have relied primarily on the {{primary_methodology}} method. This method is appropriate given the Company's stage of development and the availability of relevant data.",
          styling: {
            margin: '0 0 20px 0',
          },
        },
        {
          id: 'method-opm-header',
          type: 'header',
          content: 'Option Pricing Model',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            margin: '30px 0 15px 0',
          },
          conditionalDisplay: {
            variable: 'primary_methodology',
            condition: 'equals',
            value: 'Option Pricing Model',
          },
        },
        {
          id: 'method-opm-desc',
          type: 'paragraph',
          content:
            'The Option Pricing Model (OPM) treats common stock and preferred stock as call options on the total equity value of a company. The model considers the various liquidation preferences and conversion rights of the preferred stock to determine the allocation of equity value between preferred and common stockholders.',
          styling: {
            margin: '0 0 20px 0',
          },
          conditionalDisplay: {
            variable: 'primary_methodology',
            condition: 'equals',
            value: 'Option Pricing Model',
          },
        },
        {
          id: 'method-opm-inputs',
          type: 'paragraph',
          content:
            'Key inputs used in the OPM include:\n• Volatility: {{volatility}}\n• Risk-Free Rate: {{risk_free_rate}}\n• Expected Term: {{expected_term}} years\n• Current Enterprise Value: {{enterprise_value}}',
          styling: {
            margin: '0 0 20px 0',
          },
          conditionalDisplay: {
            variable: 'primary_methodology',
            condition: 'equals',
            value: 'Option Pricing Model',
          },
        },
        {
          id: 'method-dlom-header',
          type: 'header',
          content: 'Discount for Lack of Marketability',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            margin: '30px 0 15px 0',
          },
        },
        {
          id: 'method-dlom',
          type: 'paragraph',
          content:
            "A discount for lack of marketability (DLOM) of {{discount_lack_marketability}} has been applied to reflect the fact that there is no ready market for the Company's common stock. This discount was determined based on empirical studies of restricted stock transactions and pre-IPO studies.",
          styling: {
            margin: '0 0 20px 0',
          },
        },
      ],
    },
    {
      id: 'valuation-conclusion',
      title: 'Valuation Conclusion',
      pageBreakBefore: true,
      blocks: [
        {
          id: 'conclusion-header',
          type: 'header',
          content: 'VALUATION CONCLUSION',
          styling: {
            fontSize: 24,
            fontWeight: 'bold',
            margin: '0 0 30px 0',
          },
        },
        {
          id: 'conclusion-summary',
          type: 'paragraph',
          content:
            "Based on the procedures followed, the data reviewed, and the valuation methods employed, we have concluded that the fair market value of the Company's common stock as of {{valuation_date}} is as follows:",
          styling: {
            margin: '0 0 30px 0',
          },
        },
        {
          id: 'conclusion-value',
          type: 'paragraph',
          content: 'Fair Market Value per Share of Common Stock: {{common_value_per_share}}',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#f3f4f6',
            margin: '0 0 30px 0',
          },
        },
        {
          id: 'conclusion-summary-table-header',
          type: 'header',
          content: 'Summary of Key Metrics',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            margin: '30px 0 15px 0',
          },
        },
        {
          id: 'conclusion-metrics',
          type: 'list',
          content: [
            'Enterprise Value: {{enterprise_value}}',
            'Less: Debt and Debt-Like Instruments: $0',
            'Plus: Cash and Cash Equivalents: {{cash_balance}}',
            'Equity Value: {{equity_value}}',
            'Fully Diluted Shares: {{fully_diluted_shares}}',
            'Value per Share (before DLOM): $X.XX',
            'Discount for Lack of Marketability: {{discount_lack_marketability}}',
            'Fair Market Value per Common Share: {{common_value_per_share}}',
          ],
        },
        {
          id: 'conclusion-certification',
          type: 'paragraph',
          content:
            "This valuation has been prepared in accordance with the American Institute of Certified Public Accountants' Statement on Standards for Valuation Services and complies with Revenue Ruling 59-60 and Section 409A of the Internal Revenue Code.",
          styling: {
            margin: '30px 0 20px 0',
          },
        },
      ],
    },
    {
      id: 'limiting-conditions',
      title: 'Limiting Conditions',
      pageBreakBefore: true,
      blocks: [
        {
          id: 'limiting-header',
          type: 'header',
          content: 'LIMITING CONDITIONS AND ASSUMPTIONS',
          styling: {
            fontSize: 24,
            fontWeight: 'bold',
            margin: '0 0 30px 0',
          },
        },
        {
          id: 'limiting-intro',
          type: 'paragraph',
          content:
            'This valuation is subject to the following limiting conditions and assumptions:',
          styling: {
            margin: '0 0 20px 0',
          },
        },
        {
          id: 'limiting-list',
          type: 'list',
          content: [
            'This valuation is valid only for the stated purpose as of the Valuation Date. The value conclusion should not be used for any other purpose or as of any other date.',
            "We have relied upon financial statements and other information provided by the Company's management. We have not audited, reviewed, or compiled the financial information provided to us and, accordingly, we express no opinion or any other form of assurance on this information.",
            'We have assumed that the Company will continue as a going concern and that management will continue to operate the Company in a competent manner.',
            'The valuation assumes that there are no undisclosed material assets or liabilities, no unusual obligations or substantial commitments, other than in the ordinary course of business, nor any substantial litigation pending or threatened.',
            'The fee for this valuation is not contingent upon the results of the valuation or the amount of the value estimate.',
            'No opinion is intended to be expressed for matters that require legal or other specialized expertise, investigation, or knowledge beyond that customarily employed by valuation professionals.',
            'The valuation is based on the facts and circumstances as they existed on the Valuation Date. Events occurring after the Valuation Date could materially affect the assumptions used in preparing this valuation.',
          ],
        },
        {
          id: 'limiting-signature',
          type: 'paragraph',
          content:
            '{{appraiser_firm}}\n{{appraiser_name}}{{appraiser_credentials}}\n{{report_date}}',
          styling: {
            margin: '40px 0 20px 0',
          },
        },
      ],
    },
  ],

  metadata: {
    createdAt: new Date().toISOString(),
    author: 'System',
    tags: ['409A', 'valuation', 'standard'],
  },

  settings: {
    paperSize: 'letter',
    orientation: 'portrait',
    margins: {
      top: '1in',
      right: '1in',
      bottom: '1in',
      left: '1in',
    },
    watermark: {
      enabled: false,
      text: 'DRAFT',
      opacity: 0.1,
    },
  },
}

export default standard409ATemplate
