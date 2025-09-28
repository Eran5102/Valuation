import type { ReportTemplate } from './types'

/**
 * Comprehensive 409A Valuation Report Template based on Value8 structure
 * This template includes all standard sections and tables for a complete 409A valuation
 */
export const value8Template409A: ReportTemplate = {
  id: 'value8-409a-comprehensive',
  name: 'Standard 409A Valuation Report (Value8)',
  description: 'Comprehensive 409A valuation report template based on Value8 methodology',
  category: 'financial',
  isActive: true,
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
    {
      id: 'company_state',
      name: 'State of Incorporation',
      type: 'text',
      required: true,
      category: 'Company',
    },
    { id: 'company_ein', name: 'EIN', type: 'text', required: false, category: 'Company' },
    { id: 'company_industry', name: 'Industry', type: 'text', required: true, category: 'Company' },
    {
      id: 'company_stage',
      name: 'Company Stage',
      type: 'text',
      required: true,
      category: 'Company',
    },
    {
      id: 'company_founded',
      name: 'Date Founded',
      type: 'date',
      required: true,
      category: 'Company',
    },

    // Valuation Information
    {
      id: 'valuation_date',
      name: 'Valuation Date',
      type: 'date',
      required: true,
      category: 'Valuation',
    },
    { id: 'report_date', name: 'Report Date', type: 'date', required: true, category: 'Valuation' },
    {
      id: 'common_fmv',
      name: 'Common Stock FMV',
      type: 'currency',
      required: true,
      category: 'Valuation',
    },
    {
      id: 'preferred_price',
      name: 'Latest Preferred Price',
      type: 'currency',
      required: true,
      category: 'Valuation',
    },
    {
      id: 'post_money_valuation',
      name: 'Post-Money Valuation',
      type: 'currency',
      required: true,
      category: 'Valuation',
    },
    {
      id: 'enterprise_value',
      name: 'Enterprise Value',
      type: 'currency',
      required: true,
      category: 'Valuation',
    },

    // Financial Metrics
    {
      id: 'revenue_ltm',
      name: 'LTM Revenue',
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
      id: 'burn_rate',
      name: 'Monthly Burn Rate',
      type: 'currency',
      required: false,
      category: 'Financials',
    },
    {
      id: 'cash_runway',
      name: 'Cash Runway (months)',
      type: 'number',
      required: false,
      category: 'Financials',
    },

    // Methodology Parameters
    {
      id: 'risk_free_rate',
      name: 'Risk-Free Rate',
      type: 'percentage',
      required: true,
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
      id: 'time_to_liquidity',
      name: 'Time to Liquidity (years)',
      type: 'number',
      required: true,
      category: 'Methodology',
    },
    {
      id: 'dlom_percentage',
      name: 'DLOM %',
      type: 'percentage',
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
      id: 'appraiser_title',
      name: 'Appraiser Title',
      type: 'text',
      required: true,
      category: 'Appraiser',
    },
    {
      id: 'appraiser_credentials',
      name: 'Credentials',
      type: 'text',
      required: true,
      category: 'Appraiser',
    },
    {
      id: 'firm_name',
      name: 'Valuation Firm',
      type: 'text',
      required: true,
      category: 'Appraiser',
    },
  ],
  sections: [
    // Cover Page
    {
      id: 'cover',
      name: 'Cover Page',
      type: 'cover',
      order: 1,
      showInToc: false,
      pageBreakAfter: true,
      blocks: [
        {
          id: 'cover-1',
          type: 'coverPage',
          content: {
            title: '409A VALUATION REPORT',
            subtitle: 'Fair Market Value Determination of Common Stock',
            showCompanyLogo: true,
            includeDate: true,
            includeConfidentiality: true,
          },
          styling: {
            textAlign: 'center',
            marginTop: '100px',
          },
        },
        {
          id: 'cover-2',
          type: 'paragraph',
          content: '{{company.name}}',
          styling: {
            fontSize: 32,
            fontWeight: 'bold',
            textAlign: 'center',
            marginTop: '60px',
          },
        },
        {
          id: 'cover-3',
          type: 'paragraph',
          content: 'As of {{valuation_date}}',
          styling: {
            fontSize: 20,
            textAlign: 'center',
            marginTop: '20px',
          },
        },
        {
          id: 'cover-4',
          type: 'paragraph',
          content: 'Prepared by:\n{{firm_name}}\n{{report_date}}',
          styling: {
            fontSize: 16,
            textAlign: 'center',
            marginTop: '80px',
          },
        },
        {
          id: 'cover-5',
          type: 'paragraph',
          content: 'CONFIDENTIAL - PROPRIETARY INFORMATION',
          styling: {
            fontSize: 14,
            fontWeight: 'bold',
            textAlign: 'center',
            marginTop: '100px',
            color: '#cc0000',
          },
        },
      ],
    },

    // Appraiser's Letter
    {
      id: 'letter',
      name: 'Appraiser Letter',
      type: 'content',
      order: 2,
      showInToc: false,
      pageBreakAfter: true,
      blocks: [
        {
          id: 'letter-header',
          type: 'header',
          content: {
            logoUrl: '',
            companyName: '{{firm_name}}',
            reportTitle: '',
            showDate: false,
          },
        },
        {
          id: 'letter-1',
          type: 'dateBlock',
          content: {
            dateField: 'report_date',
            format: 'MMMM DD, YYYY',
          },
          styling: {
            textAlign: 'right',
            marginBottom: '30px',
          },
        },
        {
          id: 'letter-2',
          type: 'paragraph',
          content: 'Board of Directors\n{{company.name}}\n{{company.address}}',
          styling: {
            marginBottom: '30px',
          },
        },
        {
          id: 'letter-3',
          type: 'paragraph',
          content: 'Dear Members of the Board:',
          styling: {
            marginBottom: '20px',
          },
        },
        {
          id: 'letter-4',
          type: 'paragraph',
          content:
            'We have completed our independent valuation analysis of the fair market value of the common stock of {{company.name}} (the "Company") as of {{valuation_date}} for purposes of Section 409A of the Internal Revenue Code and financial reporting under ASC 718.',
          styling: {
            marginBottom: '15px',
          },
        },
        {
          id: 'letter-5',
          type: 'paragraph',
          content:
            "Based on our analysis using the Option Pricing Method (OPM) backsolve methodology, and after applying an appropriate discount for lack of marketability, we have determined the fair market value of the Company's common stock to be {{common_fmv}} per share as of the valuation date.",
          styling: {
            marginBottom: '15px',
          },
        },
        {
          id: 'letter-6',
          type: 'paragraph',
          content:
            'This valuation was performed in accordance with the guidelines set forth in the AICPA Practice Guide "Valuation of Privately-Held-Company Equity Securities Issued as Compensation" and complies with Section 409A safe harbor provisions.',
          styling: {
            marginBottom: '15px',
          },
        },
        {
          id: 'letter-7',
          type: 'paragraph',
          content:
            'The accompanying report provides detailed information regarding our valuation methodology, key assumptions, and supporting analyses.',
          styling: {
            marginBottom: '40px',
          },
        },
        {
          id: 'letter-8',
          type: 'signatureBlock',
          content: {
            signatories: [
              {
                name: '{{appraiser_name}}',
                title: '{{appraiser_title}}',
                credentials: '{{appraiser_credentials}}',
                date: '{{report_date}}',
              },
            ],
            includeDisclaimer: false,
          },
        },
      ],
    },

    // Table of Contents
    {
      id: 'toc',
      name: 'Table of Contents',
      type: 'toc',
      order: 3,
      showInToc: false,
      pageBreakAfter: true,
      blocks: [
        {
          id: 'toc-1',
          type: 'tableOfContents',
          content: {
            title: 'TABLE OF CONTENTS',
            depth: 3,
            showPageNumbers: true,
            includeAppendices: true,
          },
          styling: {
            margin: '40px 0',
          },
        },
      ],
    },

    // Executive Summary
    {
      id: 'executive-summary',
      name: 'Executive Summary',
      type: 'content',
      order: 4,
      showInToc: true,
      pageBreakAfter: true,
      blocks: [
        {
          id: 'exec-1',
          type: 'header',
          content: 'EXECUTIVE SUMMARY',
          styling: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: '30px',
          },
        },
        {
          id: 'exec-2',
          type: 'header',
          content: 'Valuation Conclusion',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: '20px',
            marginBottom: '15px',
          },
        },
        {
          id: 'exec-3',
          type: 'valuationSummary',
          content: {
            dataSource: 'valuation.summary',
            includeMultiples: false,
            includeDCF: false,
            includeComparables: false,
          },
        },
        {
          id: 'exec-4',
          type: 'header',
          content: 'Key Valuation Parameters',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: '30px',
            marginBottom: '15px',
          },
        },
        {
          id: 'exec-5',
          type: 'list',
          content: [
            'Valuation Date: {{valuation_date}}',
            'Common Stock FMV: {{common_fmv}} per share',
            'Latest Preferred Price: {{preferred_price}} per share',
            'Post-Money Valuation: {{post_money_valuation}}',
            'DLOM Applied: {{dlom_percentage}}',
            'Volatility: {{volatility}}',
            'Time to Liquidity: {{time_to_liquidity}} years',
          ],
        },
        {
          id: 'exec-6',
          type: 'header',
          content: 'Valuation Methodology',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: '30px',
            marginBottom: '15px',
          },
        },
        {
          id: 'exec-7',
          type: 'paragraph',
          content:
            "We utilized the Option Pricing Method (OPM) backsolve approach to determine the fair market value of the Company's common stock. This method was selected as most appropriate given the Company's stage of development and recent financing round.",
        },
      ],
    },

    // Introduction
    {
      id: 'introduction',
      name: 'Introduction',
      type: 'content',
      order: 5,
      showInToc: true,
      pageBreakAfter: true,
      blocks: [
        {
          id: 'intro-1',
          type: 'header',
          content: 'INTRODUCTION',
          styling: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: '30px',
          },
        },
        {
          id: 'intro-2',
          type: 'header',
          content: 'Purpose of Valuation',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: '15px',
          },
        },
        {
          id: 'intro-3',
          type: 'paragraph',
          content:
            "This valuation report has been prepared to determine the fair market value of {{company.name}}'s common stock for the following purposes:",
          styling: {
            marginBottom: '15px',
          },
        },
        {
          id: 'intro-4',
          type: 'list',
          content: [
            'Compliance with Section 409A of the Internal Revenue Code',
            'Financial reporting under ASC 718 (Stock-Based Compensation)',
            'Establishing exercise prices for stock options',
            "Supporting Board of Directors' determination of fair market value",
          ],
        },
        {
          id: 'intro-5',
          type: 'header',
          content: 'Scope of Analysis',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: '30px',
            marginBottom: '15px',
          },
        },
        {
          id: 'intro-6',
          type: 'paragraph',
          content: 'Our analysis included review and consideration of the following:',
          styling: {
            marginBottom: '15px',
          },
        },
        {
          id: 'intro-7',
          type: 'list',
          content: [
            'Historical and projected financial statements',
            'Capital structure and rights/preferences of securities',
            'Recent financing transactions',
            'Market conditions and comparable company data',
            'Management business plan and projections',
            'Industry and economic factors',
          ],
        },
        {
          id: 'intro-8',
          type: 'header',
          content: 'Standards of Value',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: '30px',
            marginBottom: '15px',
          },
        },
        {
          id: 'intro-9',
          type: 'paragraph',
          content:
            'Fair Market Value is defined as the price at which property would change hands between a willing buyer and a willing seller, neither being under any compulsion to buy or sell and both having reasonable knowledge of relevant facts.',
        },
      ],
    },

    // Company Overview
    {
      id: 'company-overview',
      name: 'Company Overview',
      type: 'content',
      order: 6,
      showInToc: true,
      pageBreakAfter: true,
      blocks: [
        {
          id: 'company-1',
          type: 'header',
          content: 'COMPANY OVERVIEW',
          styling: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: '30px',
          },
        },
        {
          id: 'company-2',
          type: 'header',
          content: 'Company Background',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: '15px',
          },
        },
        {
          id: 'company-3',
          type: 'paragraph',
          content:
            '{{company.name}} was founded in {{company.founded}} and is headquartered in {{company.address}}. The Company operates in the {{company.industry}} industry and is currently in the {{company.stage}} stage of development.',
          styling: {
            marginBottom: '20px',
          },
        },
        {
          id: 'company-4',
          type: 'header',
          content: 'Capital Structure',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: '30px',
            marginBottom: '15px',
          },
        },
        {
          id: 'company-5',
          type: 'capitalStructureTable',
          content: {
            title: 'Current Capital Structure',
            dataSource: 'valuation.capital_structure',
            showTotals: true,
          },
        },
        {
          id: 'company-6',
          type: 'header',
          content: 'Rights and Preferences',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: '30px',
            marginBottom: '15px',
          },
        },
        {
          id: 'company-7',
          type: 'rightsPreferencesTable',
          content: {
            title: 'Summary of Rights and Preferences',
            dataSource: 'valuation.rights_preferences',
          },
        },
      ],
    },

    // Financial Analysis
    {
      id: 'financial-analysis',
      name: 'Financial Analysis',
      type: 'content',
      order: 7,
      showInToc: true,
      pageBreakAfter: true,
      blocks: [
        {
          id: 'fin-1',
          type: 'header',
          content: 'FINANCIAL ANALYSIS',
          styling: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: '30px',
          },
        },
        {
          id: 'fin-2',
          type: 'header',
          content: 'Historical Performance',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: '15px',
          },
        },
        {
          id: 'fin-3',
          type: 'paragraph',
          content:
            "The Company's historical financial performance shows the following key metrics:",
          styling: {
            marginBottom: '15px',
          },
        },
        {
          id: 'fin-4',
          type: 'list',
          content: [
            'LTM Revenue: {{revenue_ltm}}',
            'Revenue Growth: {{revenue_growth}}',
            'Gross Margin: {{gross_margin}}',
            'Monthly Burn Rate: {{burn_rate}}',
            'Cash Runway: {{cash_runway}} months',
          ],
        },
        {
          id: 'fin-5',
          type: 'header',
          content: 'Financial Projections',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: '30px',
            marginBottom: '15px',
          },
        },
        {
          id: 'fin-6',
          type: 'financialProjectionsTable',
          content: {
            title: '5-Year Financial Projections',
            dataSource: 'valuation.projections',
            years: 5,
            showGrowthRates: true,
            showCAGR: true,
          },
        },
      ],
    },

    // Valuation Methodology
    {
      id: 'methodology',
      name: 'Valuation Methodology',
      type: 'content',
      order: 8,
      showInToc: true,
      pageBreakAfter: true,
      blocks: [
        {
          id: 'method-1',
          type: 'header',
          content: 'VALUATION METHODOLOGY',
          styling: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: '30px',
          },
        },
        {
          id: 'method-2',
          type: 'header',
          content: 'Option Pricing Method (OPM) Backsolve',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: '15px',
          },
        },
        {
          id: 'method-3',
          type: 'paragraph',
          content:
            'We employed the Option Pricing Method (OPM) backsolve approach, which uses the price of a recent financing round to infer the total equity value of the Company. The OPM treats each class of equity as a call option on the enterprise value with exercise prices based on the liquidation preferences.',
          styling: {
            marginBottom: '20px',
          },
        },
        {
          id: 'method-4',
          type: 'header',
          content: 'Key Assumptions',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: '30px',
            marginBottom: '15px',
          },
        },
        {
          id: 'method-5',
          type: 'list',
          content: [
            'Risk-Free Rate: {{risk_free_rate}}',
            'Volatility: {{volatility}}',
            'Time to Liquidity: {{time_to_liquidity}} years',
            'Recent Preferred Price: {{preferred_price}} per share',
          ],
        },
        {
          id: 'method-6',
          type: 'header',
          content: 'Breakpoint Analysis',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: '30px',
            marginBottom: '15px',
          },
        },
        {
          id: 'method-7',
          type: 'opmBreakpointsTable',
          content: {
            title: 'OPM Breakpoint Analysis',
            dataSource: 'valuation.opm_breakpoints',
            showCalculations: true,
          },
        },
      ],
    },

    // Discount for Lack of Marketability
    {
      id: 'dlom',
      name: 'Discount for Lack of Marketability',
      type: 'content',
      order: 9,
      showInToc: true,
      pageBreakAfter: true,
      blocks: [
        {
          id: 'dlom-1',
          type: 'header',
          content: 'DISCOUNT FOR LACK OF MARKETABILITY',
          styling: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: '30px',
          },
        },
        {
          id: 'dlom-2',
          type: 'paragraph',
          content:
            "A discount for lack of marketability (DLOM) is applied to reflect the illiquidity of the Company's common stock compared to publicly traded securities.",
          styling: {
            marginBottom: '20px',
          },
        },
        {
          id: 'dlom-3',
          type: 'header',
          content: 'DLOM Methodology',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: '15px',
          },
        },
        {
          id: 'dlom-4',
          type: 'paragraph',
          content: 'We considered multiple approaches to determine an appropriate DLOM, including:',
          styling: {
            marginBottom: '15px',
          },
        },
        {
          id: 'dlom-5',
          type: 'dlomTable',
          content: {
            title: 'DLOM Analysis Summary',
            dataSource: 'valuation.dlom',
            showMethodology: true,
            showSummary: true,
          },
        },
        {
          id: 'dlom-6',
          type: 'paragraph',
          content:
            'Based on our analysis, we applied a DLOM of {{dlom_percentage}} to the common stock value.',
          styling: {
            marginTop: '20px',
            fontWeight: 'bold',
          },
        },
      ],
    },

    // Market Approach
    {
      id: 'market-approach',
      name: 'Market Approach',
      type: 'content',
      order: 10,
      showInToc: true,
      pageBreakAfter: true,
      blocks: [
        {
          id: 'market-1',
          type: 'header',
          content: 'MARKET APPROACH',
          styling: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: '30px',
          },
        },
        {
          id: 'market-2',
          type: 'header',
          content: 'Comparable Company Analysis',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: '15px',
          },
        },
        {
          id: 'market-3',
          type: 'paragraph',
          content:
            'We identified and analyzed publicly traded companies operating in similar industries to provide market-based reference points for our valuation.',
          styling: {
            marginBottom: '20px',
          },
        },
        {
          id: 'market-4',
          type: 'comparableCompaniesTable',
          content: {
            title: 'Comparable Public Companies',
            dataSource: 'valuation.comparables',
            showStatistics: true,
            highlightSubject: true,
          },
        },
        {
          id: 'market-5',
          type: 'header',
          content: 'Precedent Transactions',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: '30px',
            marginBottom: '15px',
          },
        },
        {
          id: 'market-6',
          type: 'transactionCompsTable',
          content: {
            title: 'Comparable M&A Transactions',
            dataSource: 'valuation.transactions',
            dateRange: 'last_24_months',
            showMedian: true,
          },
        },
      ],
    },

    // Valuation Conclusion
    {
      id: 'conclusion',
      name: 'Valuation Conclusion',
      type: 'content',
      order: 11,
      showInToc: true,
      pageBreakAfter: true,
      blocks: [
        {
          id: 'concl-1',
          type: 'header',
          content: 'VALUATION CONCLUSION',
          styling: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: '30px',
          },
        },
        {
          id: 'concl-2',
          type: 'header',
          content: 'Summary of Valuation Results',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: '15px',
          },
        },
        {
          id: 'concl-3',
          type: 'weightedAverageTable',
          content: {
            title: 'Valuation Summary',
            dataSource: 'valuation.weighting',
            showTotal: true,
            showPerShareValue: true,
          },
        },
        {
          id: 'concl-4',
          type: 'header',
          content: 'Final Conclusion',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: '30px',
            marginBottom: '15px',
          },
        },
        {
          id: 'concl-5',
          type: 'paragraph',
          content:
            "Based on our comprehensive analysis, we have determined the fair market value of {{company.name}}'s common stock to be:",
          styling: {
            marginBottom: '20px',
          },
        },
        {
          id: 'concl-6',
          type: 'quote',
          content: '{{common_fmv}} per share',
          styling: {
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            borderLeft: '4px solid #007acc',
            paddingLeft: '20px',
            margin: '30px 0',
          },
        },
        {
          id: 'concl-7',
          type: 'paragraph',
          content: 'as of {{valuation_date}}',
          styling: {
            textAlign: 'center',
            fontSize: 18,
            marginBottom: '30px',
          },
        },
        {
          id: 'concl-8',
          type: 'header',
          content: 'Sensitivity Analysis',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: '40px',
            marginBottom: '15px',
          },
        },
        {
          id: 'concl-9',
          type: 'sensitivityAnalysisTable',
          content: {
            title: 'Valuation Sensitivity Analysis',
            dataSource: 'valuation.sensitivity',
            primaryVariable: 'volatility',
            secondaryVariable: 'time_to_liquidity',
            showHeatmap: true,
            highlightBaseCase: true,
          },
        },
      ],
    },

    // Appendices
    {
      id: 'appendices',
      name: 'Appendices',
      type: 'appendix',
      order: 12,
      showInToc: true,
      pageBreakBefore: true,
      blocks: [
        {
          id: 'app-1',
          type: 'header',
          content: 'APPENDICES',
          styling: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: '30px',
          },
        },
        {
          id: 'app-2',
          type: 'header',
          content: 'Appendix A: Limiting Conditions',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: '15px',
          },
        },
        {
          id: 'app-3',
          type: 'list',
          content: [
            'This valuation is valid only for the specific purpose stated and as of the valuation date indicated.',
            'The valuation assumes that the Company will continue as a going concern.',
            'We have relied upon financial and other information provided by management without independent verification.',
            'Future actual results may vary from projections, and the variations may be material.',
            'This valuation does not constitute a fairness opinion or investment advice.',
          ],
        },
        {
          id: 'app-4',
          type: 'header',
          content: 'Appendix B: Sources of Information',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: '30px',
            marginBottom: '15px',
          },
        },
        {
          id: 'app-5',
          type: 'list',
          content: [
            'Company financial statements and management accounts',
            'Capital structure and stock option plan documents',
            'Board minutes and financing documents',
            'Management business plan and financial projections',
            'Industry research reports and market data',
            'Public company filings and transaction databases',
          ],
        },
        {
          id: 'app-6',
          type: 'header',
          content: 'Appendix C: Glossary of Terms',
          styling: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: '30px',
            marginBottom: '15px',
          },
        },
        {
          id: 'app-7',
          type: 'glossary',
          content: {
            title: '',
            terms: [
              {
                term: 'FMV',
                definition:
                  'Fair Market Value - The price at which property would change hands between a willing buyer and seller',
              },
              {
                term: 'DLOM',
                definition:
                  'Discount for Lack of Marketability - A reduction applied to reflect illiquidity',
              },
              {
                term: 'OPM',
                definition:
                  'Option Pricing Method - A valuation method using Black-Scholes option pricing theory',
              },
              {
                term: '409A',
                definition: 'Section of the Internal Revenue Code governing deferred compensation',
              },
              {
                term: 'ASC 718',
                definition: 'Accounting Standards Codification for stock-based compensation',
              },
              {
                term: 'Backsolve',
                definition: 'Method that infers total equity value from a recent transaction price',
              },
            ],
          },
        },
      ],
    },
  ],
  settings: {
    pageSize: 'letter',
    orientation: 'portrait',
    margins: {
      top: 1,
      right: 1,
      bottom: 1,
      left: 1,
    },
    theme: {
      primaryColor: '#007acc',
      secondaryColor: '#0056a3',
      fontFamily: 'Arial, sans-serif',
      headerFontFamily: 'Arial, sans-serif',
      fontSize: 11,
      headerFontSize: 14,
      lineHeight: 1.6,
    },
    watermark: {
      enabled: true,
      text: 'DRAFT - CONFIDENTIAL',
      opacity: 0.1,
      angle: -45,
    },
    header: {
      enabled: true,
      showOnFirstPage: false,
      content: '{{company.name}} - 409A Valuation Report',
      alignment: 'center',
    },
    footer: {
      enabled: true,
      showPageNumbers: true,
      content: 'Page {{page}} of {{total}}',
      alignment: 'center',
    },
  },
  metadata: {
    version: '1.0.0',
    lastModified: new Date().toISOString(),
    author: 'Value8',
    tags: ['409A', 'valuation', 'comprehensive', 'standard'],
  },
}
