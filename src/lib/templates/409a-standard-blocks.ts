import type { TemplateBlock } from './types'

/**
 * Predefined content blocks for 409A valuation reports
 * These are standard sections that appear in most 409A reports
 */

export const standard409ABlocks = {
  // Statement of Limiting Conditions
  limitingConditions: {
    id: 'limiting-conditions',
    name: 'Statement of Limiting Conditions',
    category: '409A Standards',
    blocks: [
      {
        id: 'lc-header',
        type: 'header' as const,
        content: 'STATEMENT OF LIMITING CONDITIONS',
        styling: {
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: '20px',
          textTransform: 'uppercase',
        },
      },
      {
        id: 'lc-intro',
        type: 'paragraph' as const,
        content: 'This valuation is subject to the following limiting conditions:',
        styling: {
          marginBottom: '15px',
        },
      },
      {
        id: 'lc-list',
        type: 'list' as const,
        content: [
          'This valuation is valid only for the specific purpose stated and as of the valuation date indicated. The value conclusion is subject to the terms and conditions specified herein.',
          'The valuation assumes that the Company will continue as a going concern and that current management will continue to operate the business in a competent manner.',
          "We have relied upon financial statements and other related information provided by the Company's management. We have not audited, compiled, or reviewed this information and express no opinion on it.",
          'Public information and industry data were obtained from sources we believe to be reliable. However, we make no representation as to the accuracy or completeness of such information.',
          'We do not provide assurance on the achievability of the results forecasted by the Company because events and circumstances frequently do not occur as expected, and the achievement of the forecasted results is dependent on the actions, plans, and assumptions of management.',
          'This valuation is not intended to represent the value that might be realized in an actual transaction, which could be materially different.',
          'The valuation does not constitute a solvency opinion, fairness opinion, or investment advice.',
          'This report and the conclusions arrived at herein are for the exclusive use of our client for the sole and specific purposes as noted herein. They may not be used for any other purpose or by any other party for any purpose.',
          'The valuation is based on historical and prospective financial information provided to us by management and other third parties. Should prospective financial information not be achieved, the valuation results could be significantly affected.',
          'We have no present or prospective interest in the Company valued, and our fee is not contingent on the results of our valuation.',
        ],
        styling: {
          paddingLeft: '20px',
          marginBottom: '15px',
        },
      },
    ],
  },

  // Appraiser's Certificate
  appraiserCertificate: {
    id: 'appraiser-certificate',
    name: "Appraiser's Certificate",
    category: '409A Standards',
    blocks: [
      {
        id: 'ac-header',
        type: 'header' as const,
        content: "APPRAISER'S CERTIFICATE",
        styling: {
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: '20px',
          textTransform: 'uppercase',
        },
      },
      {
        id: 'ac-intro',
        type: 'paragraph' as const,
        content: 'We certify that, to the best of our knowledge and belief:',
        styling: {
          marginBottom: '15px',
        },
      },
      {
        id: 'ac-list',
        type: 'list' as const,
        content: [
          'The statements of fact contained in this report are true and correct.',
          'The reported analyses, opinions, and conclusions are limited only by the reported assumptions and limiting conditions, and are our personal, impartial, and unbiased professional analyses, opinions, and conclusions.',
          'We have no present or prospective interest in the property that is the subject of this report, and we have no personal interest with respect to the parties involved.',
          'We have no bias with respect to the property that is the subject of this report or to the parties involved with this assignment.',
          'Our engagement in this assignment was not contingent upon developing or reporting predetermined results.',
          'Our compensation for completing this assignment is not contingent upon the development or reporting of a predetermined value or direction in value that favors the cause of the client, the amount of the value opinion, the attainment of a stipulated result, or the occurrence of a subsequent event directly related to the intended use of this appraisal.',
          'Our analyses, opinions, and conclusions were developed, and this report has been prepared, in conformity with the Uniform Standards of Professional Appraisal Practice (USPAP).',
          'The reported analyses, opinions, and conclusions were developed, and this report has been prepared, in conformity with the requirements of the Code of Professional Ethics and the Standards of Professional Appraisal Practice of the Appraisal Institute.',
        ],
        styling: {
          paddingLeft: '20px',
          marginBottom: '15px',
        },
      },
      {
        id: 'ac-signature',
        type: 'signatureBlock' as const,
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
        styling: {
          marginTop: '40px',
        },
      },
    ],
  },

  // Sources of Information
  sourcesOfInformation: {
    id: 'sources-of-information',
    name: 'Sources of Information',
    category: '409A Standards',
    blocks: [
      {
        id: 'soi-header',
        type: 'header' as const,
        content: 'SOURCES OF INFORMATION',
        styling: {
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: '20px',
          textTransform: 'uppercase',
        },
      },
      {
        id: 'soi-intro',
        type: 'paragraph' as const,
        content:
          'In conducting our valuation analysis, we relied upon the following sources of information:',
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'soi-financial',
        type: 'header' as const,
        content: 'Financial Information',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'soi-financial-list',
        type: 'list' as const,
        content: [
          'Audited/Unaudited financial statements for fiscal years {{financial_years}}',
          'Management-prepared financial statements for the period ended {{valuation_date}}',
          'Financial projections prepared by management for {{projection_period}}',
          'Monthly management reports and key performance indicators',
          'Accounts receivable and payable aging schedules',
          'Fixed asset and depreciation schedules',
          'Details of debt obligations and credit facilities',
        ],
        styling: {
          paddingLeft: '20px',
          marginBottom: '20px',
        },
      },
      {
        id: 'soi-corporate',
        type: 'header' as const,
        content: 'Corporate Documents',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'soi-corporate-list',
        type: 'list' as const,
        content: [
          'Certificate of Incorporation and all amendments',
          'Bylaws and all amendments',
          'Stock purchase agreements and related transaction documents',
          'Employee stock option plan and related agreements',
          'Board of Directors meeting minutes',
          'Capitalization table as of {{valuation_date}}',
          'Summary of all securities issued and outstanding',
        ],
        styling: {
          paddingLeft: '20px',
          marginBottom: '20px',
        },
      },
      {
        id: 'soi-market',
        type: 'header' as const,
        content: 'Market and Industry Data',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'soi-market-list',
        type: 'list' as const,
        content: [
          'S&P Capital IQ database',
          'PitchBook Data, Inc.',
          'Industry research reports from IBISWorld',
          'Public company filings from SEC EDGAR database',
          'Federal Reserve Economic Data (FRED)',
          "Professor Aswath Damodaran's data on risk premiums and betas",
          'Duff & Phelps Valuation Handbook',
        ],
        styling: {
          paddingLeft: '20px',
          marginBottom: '20px',
        },
      },
    ],
  },

  // Valuation Methodology Overview
  valuationMethodology: {
    id: 'valuation-methodology',
    name: 'Valuation Methodology Overview',
    category: '409A Standards',
    blocks: [
      {
        id: 'vm-header',
        type: 'header' as const,
        content: 'VALUATION METHODOLOGY',
        styling: {
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: '20px',
          textTransform: 'uppercase',
        },
      },
      {
        id: 'vm-intro',
        type: 'paragraph' as const,
        content:
          "In determining the fair market value of the Company's common stock, we considered the three primary valuation approaches: Income Approach, Market Approach, and Asset Approach.",
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'vm-income',
        type: 'header' as const,
        content: 'Income Approach',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'vm-income-text',
        type: 'paragraph' as const,
        content:
          "The Income Approach estimates value based on the present value of future economic benefits. We utilized the Discounted Cash Flow (DCF) method, which involves projecting the Company's future cash flows and discounting them to present value using an appropriate discount rate that reflects the risk associated with the investment.",
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'vm-market',
        type: 'header' as const,
        content: 'Market Approach',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'vm-market-text',
        type: 'paragraph' as const,
        content:
          'The Market Approach estimates value by comparing the subject company to similar companies. We considered two methods under this approach:',
        styling: {
          marginBottom: '10px',
        },
      },
      {
        id: 'vm-market-list',
        type: 'list' as const,
        content: [
          'Guideline Public Company Method: Analyzing trading multiples of publicly traded companies in similar industries',
          'Precedent Transaction Method: Analyzing multiples paid in acquisitions of comparable companies',
        ],
        styling: {
          paddingLeft: '20px',
          marginBottom: '20px',
        },
      },
      {
        id: 'vm-opm',
        type: 'header' as const,
        content: 'Option Pricing Method (OPM) Backsolve',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'vm-opm-text',
        type: 'paragraph' as const,
        content:
          "Given the Company's recent financing round, we employed the Option Pricing Method (OPM) Backsolve approach. This method infers the equity value implied by a recent transaction in the Company's own securities. The OPM treats each class of stock as a call option on the total equity value of the company, with exercise prices based on the liquidation preferences of the preferred stock.",
        styling: {
          marginBottom: '20px',
        },
      },
    ],
  },

  // 409A Compliance Statement
  compliance409A: {
    id: 'compliance-409a',
    name: '409A Compliance Statement',
    category: '409A Standards',
    blocks: [
      {
        id: '409a-header',
        type: 'header' as const,
        content: 'SECTION 409A COMPLIANCE',
        styling: {
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: '20px',
          textTransform: 'uppercase',
        },
      },
      {
        id: '409a-text',
        type: 'paragraph' as const,
        content:
          'This valuation has been prepared in accordance with Section 409A of the Internal Revenue Code and the final regulations issued thereunder. Section 409A provides that stock options and stock appreciation rights granted with an exercise price less than the fair market value of the underlying stock on the date of grant result in deferred compensation that may be subject to adverse tax consequences to the recipient.',
        styling: {
          marginBottom: '15px',
        },
      },
      {
        id: '409a-safe-harbor',
        type: 'paragraph' as const,
        content:
          'This valuation report is intended to satisfy the requirements for the "independent appraisal" safe harbor presumption described in Section 409A and the regulations thereunder. Specifically, this valuation:',
        styling: {
          marginBottom: '10px',
        },
      },
      {
        id: '409a-requirements',
        type: 'list' as const,
        content: [
          'Has been prepared by a qualified individual with significant knowledge, training, education, and experience in performing similar valuations',
          'Applies standard valuation approaches and methodologies',
          'Takes into consideration all available information material to the value of the corporation',
          'Is evidenced by this written report which summarizes the valuation methods employed, the material assumptions, and the reasoning supporting the determination',
        ],
        styling: {
          paddingLeft: '20px',
          marginBottom: '15px',
        },
      },
      {
        id: '409a-validity',
        type: 'paragraph' as const,
        content:
          'This valuation will be considered valid for stock option grants for a period of twelve (12) months from the valuation date, unless a material change in the business occurs, which would include but not be limited to a subsequent financing round, acquisition offer, or significant change in financial performance.',
        styling: {
          marginBottom: '15px',
          fontStyle: 'italic',
        },
      },
    ],
  },

  // Standard Assumptions
  standardAssumptions: {
    id: 'standard-assumptions',
    name: 'Standard Assumptions',
    category: '409A Standards',
    blocks: [
      {
        id: 'sa-header',
        type: 'header' as const,
        content: 'STANDARD ASSUMPTIONS',
        styling: {
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: '20px',
          textTransform: 'uppercase',
        },
      },
      {
        id: 'sa-intro',
        type: 'paragraph' as const,
        content: 'The following standard assumptions were applied in our valuation analysis:',
        styling: {
          marginBottom: '15px',
        },
      },
      {
        id: 'sa-list',
        type: 'list' as const,
        content: [
          'The Company will continue as a going concern',
          'The Company will continue to operate under current management',
          'There are no undisclosed assets or liabilities that would materially impact value',
          'The Company maintains all necessary licenses, permits, and regulatory approvals',
          "The financial statements fairly represent the Company's financial position",
          'The Company has clear title to all assets reflected in the financial statements',
          'The industry will not experience any major disruptions that would materially impact the Company',
          'Economic conditions will remain relatively stable',
          'The Company will be able to retain key employees and management',
          'Projected financial results are achievable given reasonable effort by management',
        ],
        styling: {
          paddingLeft: '20px',
          marginBottom: '20px',
        },
      },
    ],
  },

  // Definitions
  definitions: {
    id: 'definitions',
    name: 'Key Definitions',
    category: '409A Standards',
    blocks: [
      {
        id: 'def-header',
        type: 'header' as const,
        content: 'KEY DEFINITIONS',
        styling: {
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: '20px',
          textTransform: 'uppercase',
        },
      },
      {
        id: 'def-glossary',
        type: 'glossary' as const,
        content: {
          title: '',
          terms: [
            {
              term: 'Fair Market Value (FMV)',
              definition:
                'The price at which property would change hands between a willing buyer and a willing seller when the former is not under any compulsion to buy and the latter is not under any compulsion to sell, both parties having reasonable knowledge of relevant facts.',
            },
            {
              term: 'Enterprise Value',
              definition:
                "The total value of a company's equity and debt, less cash and cash equivalents.",
            },
            {
              term: 'Discount Rate',
              definition:
                'The rate of return used to discount future cash flows back to their present value.',
            },
            {
              term: 'DLOM',
              definition:
                'Discount for Lack of Marketability - a reduction applied to the value of an investment to reflect the fact that it cannot be readily sold or converted to cash.',
            },
            {
              term: 'DLOC',
              definition:
                'Discount for Lack of Control - a reduction applied to reflect the lack of control associated with a minority ownership position.',
            },
            {
              term: 'OPM',
              definition:
                "Option Pricing Method - a valuation method that treats each class of equity as a call option on the company's total equity value.",
            },
            {
              term: 'PWERM',
              definition:
                'Probability-Weighted Expected Return Method - a valuation method that considers various future exit scenarios.',
            },
            {
              term: 'Backsolve Method',
              definition:
                "A valuation method that infers the equity value implied by a recent transaction in the company's securities.",
            },
            {
              term: 'Liquidation Preference',
              definition:
                'The amount that preferred shareholders are entitled to receive before common shareholders in a liquidation event.',
            },
            {
              term: 'Participation Rights',
              definition:
                'Rights that allow preferred shareholders to participate with common shareholders in distributions after receiving their liquidation preference.',
            },
          ],
        },
        styling: {
          margin: '20px 0',
        },
      },
    ],
  },

  // Risk Factors
  riskFactors: {
    id: 'risk-factors',
    name: 'Risk Factors',
    category: '409A Standards',
    blocks: [
      {
        id: 'rf-header',
        type: 'header' as const,
        content: 'RISK FACTORS',
        styling: {
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: '20px',
          textTransform: 'uppercase',
        },
      },
      {
        id: 'rf-intro',
        type: 'paragraph' as const,
        content:
          'The following risk factors were considered in our valuation analysis and the determination of appropriate discount rates and marketability discounts:',
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'rf-business',
        type: 'header' as const,
        content: 'Business Risks',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'rf-business-list',
        type: 'list' as const,
        content: [
          'Customer concentration and dependency on key clients',
          'Competition from established players and new entrants',
          'Technology obsolescence and rapid industry changes',
          'Dependency on key personnel and management',
          'Limited operating history and uncertainty of future profitability',
          'Scalability challenges and execution risks',
        ],
        styling: {
          paddingLeft: '20px',
          marginBottom: '20px',
        },
      },
      {
        id: 'rf-financial',
        type: 'header' as const,
        content: 'Financial Risks',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'rf-financial-list',
        type: 'list' as const,
        content: [
          'Limited financial resources and dependency on external funding',
          'Negative cash flows and burn rate considerations',
          'Working capital requirements and liquidity constraints',
          'Revenue concentration and predictability',
          'Capital structure complexity and liquidation preferences',
        ],
        styling: {
          paddingLeft: '20px',
          marginBottom: '20px',
        },
      },
      {
        id: 'rf-market',
        type: 'header' as const,
        content: 'Market Risks',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'rf-market-list',
        type: 'list' as const,
        content: [
          'Overall economic conditions and market volatility',
          'Industry-specific challenges and disruptions',
          'Regulatory changes and compliance requirements',
          'Geographic concentration and expansion challenges',
          'Currency fluctuations and international operations risks',
        ],
        styling: {
          paddingLeft: '20px',
          marginBottom: '20px',
        },
      },
    ],
  },

  // Independence and Qualifications
  independenceStatement: {
    id: 'independence-statement',
    name: 'Independence and Qualifications',
    category: '409A Standards',
    blocks: [
      {
        id: 'ind-header',
        type: 'header' as const,
        content: 'INDEPENDENCE AND QUALIFICATIONS',
        styling: {
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: '20px',
          textTransform: 'uppercase',
        },
      },
      {
        id: 'ind-independence',
        type: 'header' as const,
        content: 'Independence',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'ind-independence-text',
        type: 'paragraph' as const,
        content:
          'We confirm that we are independent of {{company.name}} and have no financial interest in the Company. Our professional fees for this engagement are not contingent upon the value conclusion reached or the outcome of any transaction. We have not provided any other services to the Company that would impair our independence.',
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'ind-qualifications',
        type: 'header' as const,
        content: 'Qualifications',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'ind-qualifications-text',
        type: 'paragraph' as const,
        content:
          '{{firm_name}} is a professional valuation firm specializing in business valuations for tax, financial reporting, and transaction purposes. Our team includes professionals with the following credentials:',
        styling: {
          marginBottom: '10px',
        },
      },
      {
        id: 'ind-credentials',
        type: 'list' as const,
        content: [
          'Certified Public Accountant (CPA)',
          'Accredited Senior Appraiser (ASA) - American Society of Appraisers',
          'Certified Valuation Analyst (CVA) - National Association of Certified Valuators and Analysts',
          'Accredited in Business Valuation (ABV) - American Institute of CPAs',
          'Chartered Financial Analyst (CFA)',
        ],
        styling: {
          paddingLeft: '20px',
          marginBottom: '15px',
        },
      },
      {
        id: 'ind-experience',
        type: 'paragraph' as const,
        content:
          'Our professionals have extensive experience in valuing companies across various industries, with particular expertise in technology, healthcare, and emerging growth companies. We have performed hundreds of 409A valuations and are well-versed in the regulatory requirements and best practices.',
        styling: {
          marginBottom: '15px',
        },
      },
    ],
  },

  // Summary Valuation Results
  summaryValuationResults: {
    id: 'summary-valuation-results',
    name: 'Summary Valuation Results',
    category: '409A Standards',
    blocks: [
      {
        id: 'svr-header',
        type: 'header' as const,
        content: 'SUMMARY OF VALUATION RESULTS',
        styling: {
          fontSize: 20,
          fontWeight: 'bold',
          marginBottom: '20px',
          textTransform: 'uppercase',
          color: '#124E66',
        },
      },
      {
        id: 'svr-intro',
        type: 'paragraph' as const,
        content:
          'Based on our analysis and the valuation methodologies described herein, we have determined the fair market value of {{companyName}} common stock as follows:',
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'svr-table',
        type: 'valuationSummaryTable' as const,
        content: '',
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'svr-key-findings',
        type: 'header' as const,
        content: 'Key Valuation Findings',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginTop: '25px',
          marginBottom: '15px',
        },
      },
      {
        id: 'svr-findings-list',
        type: 'list' as const,
        content: [
          'Enterprise Value: ${{enterpriseValue}}',
          'Equity Value (pre-money): ${{equityValue}}',
          'Common Stock Price per Share: ${{commonSharePrice}}',
          'Preferred Stock Liquidation Preference: ${{liquidationPreference}}',
          'Discount for Lack of Marketability (DLOM): {{dlomPercentage}}%',
          'Volatility Assumption: {{volatility}}%',
          'Risk-Free Rate: {{riskFreeRate}}%',
          'Time to Liquidity Event: {{timeToExit}} years',
        ],
        styling: {
          paddingLeft: '20px',
          marginBottom: '20px',
        },
      },
      {
        id: 'svr-conclusion',
        type: 'paragraph' as const,
        content:
          'The concluded fair market value of the common stock represents a {{discountPercentage}}% discount to the most recent preferred stock financing price of ${{preferredPrice}} per share, which is reasonable given the superior rights and preferences of the preferred stock.',
        styling: {
          fontStyle: 'italic',
          marginTop: '20px',
        },
      },
    ],
  },

  // Company Overview
  companyOverview: {
    id: 'company-overview',
    name: 'Company Overview',
    category: '409A Standards',
    blocks: [
      {
        id: 'co-header',
        type: 'header' as const,
        content: 'COMPANY OVERVIEW',
        styling: {
          fontSize: 20,
          fontWeight: 'bold',
          marginBottom: '20px',
          textTransform: 'uppercase',
          color: '#124E66',
        },
      },
      {
        id: 'co-business-description-header',
        type: 'header' as const,
        content: 'Business Description',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'co-business-description',
        type: 'paragraph' as const,
        content:
          '{{companyName}} (the "Company") was incorporated in {{incorporationState}} on {{incorporationDate}}. The Company operates in the {{industry}} industry and provides {{productsServices}}.',
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'co-history-header',
        type: 'header' as const,
        content: 'Company History and Milestones',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'co-history',
        type: 'paragraph' as const,
        content: '{{companyHistory}}',
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'co-products-header',
        type: 'header' as const,
        content: 'Products and Services',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'co-products',
        type: 'paragraph' as const,
        content: '{{productDescription}}',
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'co-market-header',
        type: 'header' as const,
        content: 'Market Opportunity',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'co-market',
        type: 'paragraph' as const,
        content:
          'The Company operates in a market estimated at ${{marketSize}} billion, with an expected CAGR of {{marketGrowthRate}}% over the next {{forecastPeriod}} years. {{marketDescription}}',
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'co-competitive-header',
        type: 'header' as const,
        content: 'Competitive Landscape',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'co-competitive',
        type: 'paragraph' as const,
        content: '{{competitiveLandscape}}',
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'co-management-header',
        type: 'header' as const,
        content: 'Management Team',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'co-management',
        type: 'paragraph' as const,
        content:
          'The Company is led by {{ceoName}}, Chief Executive Officer, who brings {{ceoExperience}} years of experience in {{relevantIndustry}}. The management team consists of {{teamSize}} experienced professionals with backgrounds in {{teamBackgrounds}}.',
        styling: {
          marginBottom: '20px',
        },
      },
    ],
  },

  // Allocation of Value to Capital Structure
  allocationOfValue: {
    id: 'allocation-of-value',
    name: 'Allocation of Value to Capital Structure',
    category: '409A Standards',
    blocks: [
      {
        id: 'av-header',
        type: 'header' as const,
        content: 'ALLOCATION OF VALUE TO CAPITAL STRUCTURE',
        styling: {
          fontSize: 20,
          fontWeight: 'bold',
          marginBottom: '20px',
          textTransform: 'uppercase',
          color: '#124E66',
        },
      },
      {
        id: 'av-intro',
        type: 'paragraph' as const,
        content:
          "The allocation of the Company's equity value among the various classes of equity securities is based on the rights and preferences of each class, as specified in the Company's Certificate of Incorporation.",
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'av-methodology-header',
        type: 'header' as const,
        content: 'Allocation Methodology',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'av-methodology',
        type: 'paragraph' as const,
        content:
          "We utilized the Option Pricing Method (OPM) to allocate the enterprise value to the various classes of equity. The OPM treats common stock and preferred stock as call options on the total equity value of a company, with exercise prices based on the value thresholds at which the allocation among the various holders of the company's securities changes.",
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'av-capital-structure-header',
        type: 'header' as const,
        content: 'Current Capital Structure',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'av-capital-table',
        type: 'capitalStructureTable' as const,
        content: '',
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'av-breakpoints-header',
        type: 'header' as const,
        content: 'OPM Breakpoint Analysis',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'av-breakpoints-table',
        type: 'opmBreakpointsTable' as const,
        content: '',
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'av-allocation-results-header',
        type: 'header' as const,
        content: 'Value Allocation Results',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'av-allocation-table',
        type: 'opmAllocationTable' as const,
        content: '',
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'av-key-assumptions-header',
        type: 'header' as const,
        content: 'Key Assumptions',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'av-assumptions-list',
        type: 'list' as const,
        content: [
          'Time to Liquidity Event: {{timeToExit}} years',
          'Volatility: {{volatility}}% (based on analysis of comparable public companies)',
          'Risk-Free Rate: {{riskFreeRate}}% (based on U.S. Treasury securities with similar maturity)',
          'Dividend Yield: 0% (Company does not pay dividends)',
        ],
        styling: {
          paddingLeft: '20px',
          marginBottom: '20px',
        },
      },
      {
        id: 'av-conclusion',
        type: 'paragraph' as const,
        content:
          'Based on the OPM allocation, the fair market value per share of common stock is ${{commonSharePrice}}, which represents a {{discountPercentage}}% discount to the most recent preferred stock price.',
        styling: {
          fontStyle: 'italic',
          marginTop: '20px',
        },
      },
    ],
  },

  // Selected Valuation Methodologies
  selectedMethodologies: {
    id: 'selected-methodologies',
    name: 'Selected Valuation Methodologies',
    category: '409A Standards',
    blocks: [
      {
        id: 'sm-header',
        type: 'header' as const,
        content: 'SELECTED VALUATION METHODOLOGIES',
        styling: {
          fontSize: 20,
          fontWeight: 'bold',
          marginBottom: '20px',
          textTransform: 'uppercase',
          color: '#124E66',
        },
      },
      {
        id: 'sm-intro',
        type: 'paragraph' as const,
        content:
          "In determining the fair market value of the Company, we considered the three primary valuation approaches: the Income Approach, the Market Approach, and the Asset Approach. Based on the Company's stage of development and available information, we selected the following methodologies:",
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'sm-market-approach-header',
        type: 'header' as const,
        content: 'Market Approach',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'sm-backsolve-header',
        type: 'subheader' as const,
        content: 'Backsolve Method',
        styling: {
          fontSize: 14,
          fontWeight: 'bold',
          marginBottom: '10px',
          marginLeft: '20px',
        },
      },
      {
        id: 'sm-backsolve',
        type: 'paragraph' as const,
        content:
          "The Backsolve Method was selected as it derives the implied equity value from a recent transaction in the Company's own securities. The most recent financing occurred on {{lastFinancingDate}}, when the Company raised ${{amountRaised}} through the issuance of {{sharesIssued}} shares of {{seriesName}} Preferred Stock at ${{preferredPrice}} per share. Using the OPM, we solved for the total equity value that yields the observed transaction price.",
        styling: {
          marginBottom: '15px',
          marginLeft: '20px',
        },
      },
      {
        id: 'sm-guideline-header',
        type: 'subheader' as const,
        content: 'Guideline Public Company Method',
        styling: {
          fontSize: 14,
          fontWeight: 'bold',
          marginBottom: '10px',
          marginLeft: '20px',
        },
      },
      {
        id: 'sm-guideline',
        type: 'paragraph' as const,
        content:
          "We identified {{numberOfComps}} publicly traded companies operating in similar industries with comparable business models. Key valuation multiples were calculated including EV/Revenue and EV/EBITDA. After applying appropriate adjustments for size, growth, and profitability differences, we applied the selected multiples to the Company's financial metrics.",
        styling: {
          marginBottom: '15px',
          marginLeft: '20px',
        },
      },
      {
        id: 'sm-precedent-header',
        type: 'subheader' as const,
        content: 'Precedent Transaction Method',
        styling: {
          fontSize: 14,
          fontWeight: 'bold',
          marginBottom: '10px',
          marginLeft: '20px',
        },
      },
      {
        id: 'sm-precedent',
        type: 'paragraph' as const,
        content:
          'We analyzed {{numberOfTransactions}} recent M&A transactions involving companies in the {{industry}} industry. Transaction multiples were analyzed and adjusted for differences in market conditions, company size, and strategic value.',
        styling: {
          marginBottom: '20px',
          marginLeft: '20px',
        },
      },
      {
        id: 'sm-income-approach-header',
        type: 'header' as const,
        content: 'Income Approach',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'sm-dcf-header',
        type: 'subheader' as const,
        content: 'Discounted Cash Flow Method',
        styling: {
          fontSize: 14,
          fontWeight: 'bold',
          marginBottom: '10px',
          marginLeft: '20px',
        },
      },
      {
        id: 'sm-dcf',
        type: 'paragraph' as const,
        content:
          "The DCF method estimates value based on the present value of expected future cash flows. We utilized management's {{forecastPeriod}}-year financial projections and applied a discount rate of {{discountRate}}%, which reflects the Company's weighted average cost of capital (WACC). A terminal value was calculated using a perpetual growth rate of {{terminalGrowthRate}}%.",
        styling: {
          marginBottom: '20px',
          marginLeft: '20px',
        },
      },
      {
        id: 'sm-weighting-header',
        type: 'header' as const,
        content: 'Weighting of Valuation Methods',
        styling: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: '10px',
        },
      },
      {
        id: 'sm-weighting-table',
        type: 'methodWeightingTable' as const,
        content: '',
        styling: {
          marginBottom: '20px',
        },
      },
      {
        id: 'sm-conclusion',
        type: 'paragraph' as const,
        content:
          'Based on our analysis using the methodologies described above, we concluded an enterprise value of ${{enterpriseValue}} for the Company as of {{valuationDate}}.',
        styling: {
          fontWeight: 'bold',
          marginTop: '20px',
        },
      },
    ],
  },
}

// Export as an array for easy iteration
export const standard409ABlocksList = Object.values(standard409ABlocks)

// Helper function to create a full section from a block template
export function createSectionFromBlock(
  blockTemplate: (typeof standard409ABlocks)[keyof typeof standard409ABlocks]
) {
  return {
    id: `section-${blockTemplate.id}`,
    name: blockTemplate.name,
    type: 'content' as const,
    order: 999, // Will be set when added to template
    showInToc: true,
    pageBreakAfter: false,
    blocks: blockTemplate.blocks,
  }
}
