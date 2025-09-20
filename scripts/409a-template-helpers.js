/**
 * 409A Valuation Report Template Helpers
 * Helper functions for working with the 409A valuation template
 */

// Template variable definitions with default values
const TEMPLATE_VARIABLES = {
  // Company Information
  COMPANY_NAME: 'Company Name',
  SECURITY: 'Ordinary Shares',
  VALUATION_DATE: 'January 1, 2024',
  EXPIRATION_DATE: 'January 1, 2025',
  REPORT_DATE: 'February 1, 2024',
  ENGAGEMENT_LETTER_DATE: 'December 15, 2023',

  // Contact Information
  DESIGNEE_FIRST_NAME: 'John',
  DESIGNEE_LAST_NAME: 'Smith',
  DESIGNEE_TITLE: 'Chief Executive Officer',
  DESIGNEE_PREFIX: 'Mr.',

  // Business Details
  BUSINESS_DESCRIPTION: 'Technology company focused on innovative solutions',
  INCORPORATION_YEAR: '2020',
  HEADQUARTERS: 'San Francisco, CA',
  BUSINESS_MODEL_DESCRIPTION: 'SaaS-based recurring revenue model',
  MARKET_DESCRIPTION: 'Enterprise software market targeting mid-market companies',
  STAGE_OF_DEVELOPMENT: 'Development Stage',
  STAGE_OF_DEVELOPMENT_DESCRIPTION: 'Company is in active product development with initial revenue',
  PRODUCTS: 'Cloud-based enterprise software platform',

  // Team Information
  MGMT_TEAM_NAME_1: 'John Smith',
  MGMT_TEAM_TITLE_1: 'Chief Executive Officer',
  MGMT_TEAM_NAME_2: 'Jane Doe',
  MGMT_TEAM_TITLE_2: 'Chief Technology Officer',
  MGMT_TEAM_NAME_3: 'Bob Johnson',
  MGMT_TEAM_TITLE_3: 'Chief Financial Officer',
  MGMT_TEAM_NAME_4: 'Sarah Wilson',
  MGMT_TEAM_TITLE_4: 'VP of Sales',

  // Investors
  INVESTOR_1: 'Venture Capital Fund A',
  INVESTOR_2: 'Strategic Investor B',
  INVESTOR_3: 'Angel Investor Group',
  INVESTOR_4: 'Corporate Venture Arm',

  // Valuation Results
  FMV: '$2.50',
  FMV_PRE_DLOM: '$3.00',

  // Financing Details
  LAST_ROUND_SECURITY: 'Series A Preferred',
  LAST_ROUND_DATE: 'October 1, 2023',
  LAST_ROUND_PPS: '1.55',

  // Valuation Methodology
  DECISION: 'Selected',
  BACKSOLVE_WEIGHT: '100%',
  PUBLIC_COMPS_WEIGHT: '0%',
  PREAQUS_WEIGHT: '0%',
  DCF_WEIGHT: '0%',
  CTR_WEIGHT: '0%',

  BACKSOLVE_EQUITY_VALUE: '$15,000,000',
  WEIGHTED_EQUITY_VALUE: '$15,000,000',
  NET_DEBT: '$0',
  VALUATION_WEIGHTING_TOTAL: '100%',

  // OPM Parameters
  VOLATILITY: '65%',
  VOLATILITY_INDUSTRY: 'Technology',
  VOLATILITY_GEOGRAPHY: 'United States',
  VOLATILITY_SOURCE: 'Guideline Public Company Analysis',
  OPM_TIME_TO_LIQUIDITY: '3.0',
  OPM_RISK_FREE_RATE: '4.5%',

  // Allocation Methodology
  OPM_WEIGHT: '100%',
  PWERM_WEIGHT: '0%',
  CVM_WEIGHT: '0%',
  HYBRID_WEIGHT: '0%',
  ALLOCATION_WEIGHTING_TOTAL: '100%',

  // DLOM Analysis
  CHAFFE_WEIGHT: '25%',
  CHAFFE_DLOM: '20%',
  FINNERTY_WEIGHT: '25%',
  FINNERTY_DLOM: '18%',
  GHAIDAROV_WEIGHT: '25%',
  GHAIDAROV_DLOM: '22%',
  LONGSTAFF_WEIGHT: '25%',
  LONGSTAFF_DLOM: '19%',
  MARKET_STUDIES_WEIGHT: '0%',
  MARKET_STUDIES_DLOM: '0%',
  CONCLUDED_DLOM: '20%',

  // Breakpoint Analysis (template placeholders)
  BREAKPOINT_1_DESCRIPTION: 'Liquidation Preference Threshold',
  BREAKPOINT_1_CLASSES: 'All Preferred Shares',
  BREAKPOINT_1_FROM: '$0',
  BREAKPOINT_1_TO: '$5M',
  BREAKPOINT_1_SC: '5,000,000',

  BREAKPOINT_2_DESCRIPTION: 'Conversion Threshold',
  BREAKPOINT_2_CLASSES: 'Series A & Common',
  BREAKPOINT_2_FROM: '$5M',
  BREAKPOINT_2_TO: '$15M',
  BREAKPOINT_2_SC: '10,000,000',

  BREAKPOINT_3_DESCRIPTION: 'Full Participation',
  BREAKPOINT_3_CLASSES: 'All Classes',
  BREAKPOINT_3_FROM: '$15M',
  BREAKPOINT_3_TO: 'Infinity',
  BREAKPOINT_3_SC: '15,000,000',

  BREAKPOINT_4_DESCRIPTION: '',
  BREAKPOINT_4_CLASSES: '',
  BREAKPOINT_4_FROM: '',
  BREAKPOINT_4_TO: '',
  BREAKPOINT_4_SC: '',

  BREAKPOINT_5_DESCRIPTION: '',
  BREAKPOINT_5_CLASSES: '',
  BREAKPOINT_5_FROM: '',
  BREAKPOINT_5_TO: '',
  BREAKPOINT_5_SC: '',

  // Appraiser Information
  APPRAISER_FIRST_NAME: 'Michael',
  APPRAISER_LAST_NAME: 'Johnson',
  APPRAISER_TITLE: 'Senior Managing Director',
  APPRAISER_BIO: 'Michael Johnson is a Senior Managing Director with over 15 years of experience in business valuation and financial analysis. He holds an MBA in Finance and is a Chartered Financial Analyst (CFA). Michael specializes in early-stage technology company valuations and has completed over 200 409A valuations for companies ranging from seed stage to pre-IPO.'
};

/**
 * Replace template variables in HTML content
 * @param {string} htmlContent - The HTML content with template variables
 * @param {object} values - Object containing variable values to replace
 * @returns {string} - HTML content with variables replaced
 */
function replaceTemplateVariables(htmlContent, values = {}) {
  let result = htmlContent;

  // Merge default values with provided values
  const allValues = { ...TEMPLATE_VARIABLES, ...values };

  // Replace each template variable
  Object.keys(allValues).forEach(key => {
    const templateVar = `{{${key}}}`;
    const value = allValues[key];
    const regex = new RegExp(templateVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, value);
  });

  return result;
}

/**
 * Get list of all template variables found in content
 * @param {string} content - HTML content to scan
 * @returns {array} - Array of template variable names found
 */
function extractTemplateVariables(content) {
  const regex = /\{\{([A-Z_][A-Z0-9_]*)\}\}/g;
  const variables = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

/**
 * Validate that all required template variables are provided
 * @param {object} values - Values object to validate
 * @returns {object} - Validation result with missing variables
 */
function validateTemplateVariables(values) {
  const requiredVars = [
    'COMPANY_NAME', 'SECURITY', 'VALUATION_DATE', 'FMV',
    'DESIGNEE_FIRST_NAME', 'DESIGNEE_LAST_NAME', 'REPORT_DATE'
  ];

  const missing = requiredVars.filter(varName =>
    !values[varName] || values[varName].trim() === ''
  );

  return {
    isValid: missing.length === 0,
    missingVariables: missing
  };
}

/**
 * Format currency values
 * @param {number} amount - Numeric amount
 * @returns {string} - Formatted currency string
 */
function formatCurrency(amount) {
  if (typeof amount === 'string') return amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/**
 * Format percentage values
 * @param {number} percent - Decimal percentage (0.25 = 25%)
 * @returns {string} - Formatted percentage string
 */
function formatPercentage(percent) {
  if (typeof percent === 'string') return percent;
  return `${(percent * 100).toFixed(1)}%`;
}

/**
 * Generate PDF using Puppeteer (Node.js function)
 * @param {string} htmlContent - HTML content to convert to PDF
 * @param {object} options - PDF generation options
 * @returns {Promise} - Promise resolving to PDF buffer
 */
async function generatePDF(htmlContent, options = {}) {
  // This would be used on the server-side with Puppeteer
  const defaultOptions = {
    format: 'A4',
    margin: {
      top: '1in',
      right: '1in',
      bottom: '1in',
      left: '1in'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 1in;">
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `
  };

  const pdfOptions = { ...defaultOptions, ...options };

  // Return configuration for Puppeteer usage
  return {
    html: htmlContent,
    options: pdfOptions
  };
}

/**
 * TinyMCE configuration for 409A template editing
 */
const TINYMCE_CONFIG = {
  height: 600,
  menubar: true,
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'help', 'wordcount', 'template'
  ],
  toolbar: 'undo redo | blocks | ' +
           'bold italic forecolor | alignleft aligncenter ' +
           'alignright alignjustify | bullist numlist outdent indent | ' +
           'removeformat | table | template | code | help',
  content_style: `
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #333;
    }
    .template-var {
      background: #fef3c7;
      padding: 2px 4px;
      border-radius: 3px;
      font-weight: bold;
      color: #92400e;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    table th, table td {
      border: 1px solid #ccc;
      padding: 8px;
      text-align: left;
    }
    table th {
      background-color: #2563eb;
      color: white;
      font-weight: bold;
    }
    .section-title {
      font-size: 24px;
      color: #2563eb;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 1em;
      padding-bottom: 0.5em;
      border-bottom: 2px solid #e5e7eb;
    }
  `,
  template_cdate_format: '[Date Created (CDATE): %m/%d/%Y : %H:%M:%S]',
  template_mdate_format: '[Date Modified (MDATE): %m/%d/%Y : %H:%M:%S]',
  template_selected_content_classes: 'template-content',
  templates: [
    {
      title: '409A Valuation Report',
      description: 'Complete 409A valuation report template',
      content: '' // This would be populated with the HTML template
    }
  ]
};

/**
 * Create a new 409A report instance
 * @param {object} companyData - Company-specific data for the report
 * @returns {object} - Report instance with methods
 */
function create409AReport(companyData = {}) {
  let templateData = { ...TEMPLATE_VARIABLES, ...companyData };

  return {
    // Update template data
    setData(key, value) {
      if (typeof key === 'object') {
        templateData = { ...templateData, ...key };
      } else {
        templateData[key] = value;
      }
    },

    // Get current template data
    getData() {
      return { ...templateData };
    },

    // Generate HTML with current data
    generateHTML(customTemplate = null) {
      // In a real implementation, you'd load the template HTML here
      // For now, return the data for external template processing
      return templateData;
    },

    // Validate current data
    validate() {
      return validateTemplateVariables(templateData);
    },

    // Export data as JSON
    exportJSON() {
      return JSON.stringify(templateData, null, 2);
    },

    // Import data from JSON
    importJSON(jsonString) {
      try {
        const importedData = JSON.parse(jsonString);
        templateData = { ...templateData, ...importedData };
        return true;
      } catch (error) {
        console.error('Error importing JSON:', error);
        return false;
      }
    }
  };
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TEMPLATE_VARIABLES,
    replaceTemplateVariables,
    extractTemplateVariables,
    validateTemplateVariables,
    formatCurrency,
    formatPercentage,
    generatePDF,
    TINYMCE_CONFIG,
    create409AReport
  };
} else if (typeof window !== 'undefined') {
  window.Report409A = {
    TEMPLATE_VARIABLES,
    replaceTemplateVariables,
    extractTemplateVariables,
    validateTemplateVariables,
    formatCurrency,
    formatPercentage,
    generatePDF,
    TINYMCE_CONFIG,
    create409AReport
  };
}