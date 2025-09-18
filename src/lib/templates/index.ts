export * from './types';
export * from './core';
export { default as standard409ATemplate } from './409a-template';
export { default as TemplateEngine } from './core';

// Sample data for testing and preview
export const sampleValuationData = {
  // Company Information
  company_name: 'TechStart Inc.',
  company_address: '123 Innovation Drive, San Francisco, CA 94105',
  company_ein: '12-3456789',
  company_state: 'Delaware',
  company_incorporation_date: '2020-03-15',
  company_fiscal_year_end: 'December 31',
  company_industry: 'Software Technology',
  company_stage: 'Series A',
  company_employees: 25,
  
  // Valuation Details
  valuation_date: '2024-12-31',
  report_date: '2025-01-15',
  valuation_purpose: 'Section 409A of the Internal Revenue Code',
  standard_of_value: 'Fair Market Value',
  premise_of_value: 'Going Concern',
  
  // Financial Metrics
  revenue_current: 2500000,
  revenue_prior: 1200000,
  revenue_growth: 108.33,
  gross_margin: 75,
  operating_margin: -15,
  cash_balance: 8500000,
  burn_rate: 350000,
  runway_months: 24,
  
  // Funding Information
  total_funding: 15000000,
  last_round_date: '2024-06-15',
  last_round_amount: 10000000,
  last_round_valuation: 40000000,
  preferred_liquidation: 15000000,
  
  // Valuation Results
  enterprise_value: 35000000,
  equity_value: 43500000,
  common_value_per_share: 2.15,
  preferred_value_per_share: 8.50,
  discount_lack_marketability: 30,
  discount_minority_interest: 0,
  
  // Share Information
  common_shares_outstanding: 15000000,
  preferred_shares_outstanding: 2500000,
  options_outstanding: 2000000,
  warrants_outstanding: 0,
  fully_diluted_shares: 20250000,
  option_pool_size: 15,
  
  // Methodology
  primary_methodology: 'Option Pricing Model',
  secondary_methodology: 'Market Approach',
  volatility: 65,
  risk_free_rate: 4.5,
  expected_term: 6,
  
  // Appraiser Information
  appraiser_name: 'John Smith, CPA, ABV',
  appraiser_firm: 'Valuation Partners LLC',
  appraiser_credentials: ', CPA, ABV, ASA'
};

// Helper function to get template by ID
export function getTemplateById(id: string) {
  switch (id) {
    case '409a-standard-v1':
      return standard409ATemplate;
    default:
      return null;
  }
}

// Helper function to get all available templates
export function getAllTemplates() {
  return [
    standard409ATemplate
  ];
}