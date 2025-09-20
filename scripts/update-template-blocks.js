const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xxqdqqglkemclosqzswh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4cWRxcWdsa2VtY2xvc3F6c3doIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc1MTc1NCwiZXhwIjoyMDczMzI3NzU0fQ.RZ0dy1vyr8b1lEgU-z7kt_F83xOV_Rxueimz344lEyE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Comprehensive 409A Template as structured blocks
const comprehensiveBlocks = [
  {
    id: "cover-page",
    type: "cover",
    style: {
      textAlign: "center",
      marginBottom: "3em",
      pageBreak: "after"
    },
    content: `
      <div class="header">
        <h1 style="font-size: 48px; color: #124E66; font-weight: bold; letter-spacing: 2px; margin-bottom: 0.5em;">
          409A VALUATION
        </h1>
        <div style="font-size: 16px; color: #666; margin-bottom: 2em; line-height: 1.6;">
          Per share Fair Value of {{valuation.security_type}} of<br>
          {{company.name}} in connection with the requirements<br>
          of Internal Revenue Code Section 409A as of<br>
          {{valuation.date}}
        </div>
        <div style="font-size: 24px; color: #124E66; font-weight: bold; margin-top: 2em;">
          VALUE8.AI
        </div>
        <div style="margin-top: 2em;">
          <strong>{{report.date}}</strong><br>
          {{company.name}} PREPARED BY DATE
        </div>
      </div>
    `
  },
  {
    id: "letter-section",
    type: "section",
    style: {
      pageBreak: "before"
    },
    title: "Letter to Management",
    content: `
      <p style="margin-bottom: 2em;">
        {{designee.first_name}} {{designee.last_name}}<br>
        {{designee.title}}<br>
        {{company.name}}
      </p>

      <p style="margin-bottom: 1em;">Dear {{designee.prefix}} {{designee.last_name}},</p>

      <p style="margin-bottom: 1em;">
        At the request of {{company.name}} ("Company"), Value8 ("Value8") estimated the fair value of the Company's {{valuation.security_type}} (the "Subject Security"), as of {{valuation.date}} ("Valuation Date") on a non-controlling, non-marketable basis ("Engagement"). Our analysis was prepared solely for the information and use of Company's management ("Management"). Our engagement is limited solely to performing this valuation, in accordance with our terms and conditions in Exhibit A of our letter of engagement dated {{engagement.letter_date}}. While Management may use the results of this valuation for financial and/or tax reporting purposes including Internal Revenue Code Section 409A ("IRC 409A") and FASB Accounting Standards Codification Topic 718 – Stock Compensation ("ASC 718"), Value8 does not assume any liability in furnishing this estimation and opinion.
      </p>

      <h3 style="color: #124E66; margin: 1.5em 0 0.5em 0;">DEFINITION OF VALUE</h3>
      <p style="margin-bottom: 1em;">
        The standard of value we applied in this opinion is fair value. The term "fair value" is defined per Accounting Standards Codification Topic 820, Fair Value Measurements:
      </p>
      <p style="font-style: italic; margin-bottom: 1em;">
        …the price that would be received to sell an asset or paid to transfer a liability in an orderly transaction between market participants at the measurement date.
      </p>

      <h3 style="color: #124E66; margin: 1.5em 0 0.5em 0;">ADDITIONAL ANALYSIS</h3>
      <div style="margin: 1em 0;">
        {{custom.content}}
      </div>

      <h3 style="color: #124E66; margin: 1.5em 0 0.5em 0;">CONCLUSION</h3>
      <p style="margin-bottom: 2em;">
        Based on the assumptions and limiting conditions as described in this report, as well as the facts and circumstances as of the Valuation Date, Value8 estimated the fair market value of the Company's {{valuation.security_type}} to be approximately {{valuation.fair_market_value}} per share as of the Valuation Date, on a non-marketable, minority-interest basis.
      </p>

      <p>Sincerely,<br><br>Value8</p>
    `
  },
  {
    id: "summary-valuation",
    type: "section",
    style: {
      pageBreak: "before"
    },
    title: "Summary Valuation Results",
    content: `
      <div style="display: flex; justify-content: space-between; gap: 2em; margin: 2em 0;">
        <div style="flex: 1; text-align: center; padding: 2em; border: 2px solid #e5e7eb; border-radius: 10px;">
          <div style="font-size: 48px; color: #124E66; margin-bottom: 1em;">$</div>
          <div style="font-size: 16px; font-weight: bold; color: #374151; margin-bottom: 1em;">{{valuation.security_type}} VALUE</div>
          <div style="font-size: 20px; font-weight: bold; color: #124E66; padding: 10px; background: #f1f5f9; border-radius: 5px;">{{valuation.fair_market_value}}</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 2em; border: 2px solid #e5e7eb; border-radius: 10px;">
          <div style="font-size: 48px; color: #124E66; margin-bottom: 1em;">📅</div>
          <div style="font-size: 16px; font-weight: bold; color: #374151; margin-bottom: 1em;">VALUATION DATE</div>
          <div style="font-size: 20px; font-weight: bold; color: #124E66; padding: 10px; background: #f1f5f9; border-radius: 5px;">{{valuation.date}}</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 2em; border: 2px solid #e5e7eb; border-radius: 10px;">
          <div style="font-size: 48px; color: #124E66; margin-bottom: 1em;">⏭</div>
          <div style="font-size: 16px; font-weight: bold; color: #374151; margin-bottom: 1em;">EXPIRATION DATE</div>
          <div style="font-size: 20px; font-weight: bold; color: #124E66; padding: 10px; background: #f1f5f9; border-radius: 5px;">{{valuation.expiration_date}}</div>
        </div>
      </div>
    `
  },
  {
    id: "company-overview",
    type: "section",
    style: {
      pageBreak: "before"
    },
    title: "Company Overview",
    content: `
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2em; margin: 2em 0;">
        <div style="padding: 1.5em; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc;">
          <h3 style="color: #124E66; font-size: 14px; font-weight: bold; margin-bottom: 1em;">📋 BUSINESS DESCRIPTION</h3>
          <p><strong>About:</strong> {{company.description}}</p>
          <p><strong>Founded:</strong> {{company.incorporation_year}}</p>
          <p><strong>Headquarters:</strong> {{company.headquarters}}</p>
          <p><strong>Business model:</strong> {{company.business_model}}</p>
        </div>

        <div style="padding: 1.5em; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc;">
          <h3 style="color: #124E66; font-size: 14px; font-weight: bold; margin-bottom: 1em;">🎯 MARKET FOCUS</h3>
          <p>{{company.market_description}}</p>
        </div>

        <div style="padding: 1.5em; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc;">
          <h3 style="color: #124E66; font-size: 14px; font-weight: bold; margin-bottom: 1em;">📈 STAGE OF DEVELOPMENT</h3>
          <p>The American Institute of Certified Public Accountants (AICPA) defines six stages of enterprise development. In this hierarchy, Value8 categorizes the Company as a {{company.stage_of_development}} company.</p>
          <p>{{company.stage_description}}</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2em; margin: 2em 0;">
        <div style="padding: 1.5em; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc;">
          <h3 style="color: #124E66; font-size: 14px; font-weight: bold; margin-bottom: 1em;">🚀 PRODUCTS</h3>
          <p>{{company.products}}</p>
        </div>

        <div style="padding: 1.5em; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc;">
          <h3 style="color: #124E66; font-size: 14px; font-weight: bold; margin-bottom: 1em;">👥 MANAGEMENT TEAM</h3>
          <ul style="font-size: 10px;">
            <li>{{management.member_1_name}}, {{management.member_1_title}}</li>
            <li>{{management.member_2_name}}, {{management.member_2_title}}</li>
            <li>{{management.member_3_name}}, {{management.member_3_title}}</li>
            <li>{{management.member_4_name}}, {{management.member_4_title}}</li>
          </ul>
        </div>

        <div style="padding: 1.5em; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc;">
          <h3 style="color: #124E66; font-size: 14px; font-weight: bold; margin-bottom: 1em;">💰 LEADING INVESTORS</h3>
          <ul style="font-size: 10px;">
            <li>{{investors.investor_1}}</li>
            <li>{{investors.investor_2}}</li>
            <li>{{investors.investor_3}}</li>
            <li>{{investors.investor_4}}</li>
          </ul>
        </div>
      </div>
    `
  },
  {
    id: "capital-structure",
    type: "section",
    style: {
      pageBreak: "before"
    },
    title: "Capital Structure and Financing History",
    content: `
      <table style="width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 10px; border: 1px solid #ccc;">
        <thead>
          <tr style="background-color: #124E66; color: white;">
            <th style="padding: 8px; text-align: left; border: 1px solid #124E66;">SHARES AND ROUND INFORMATION</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #124E66;">SHARES</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #124E66;">OPTIONS</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #124E66;">WARRANTS</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #124E66;">TOTAL OUTSTANDING</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #124E66;">TOTAL FULLY DILUTED</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #124E66;">% FD</th>
          </tr>
        </thead>
        <tbody>
          {{capital_structure.table_rows}}
        </tbody>
      </table>
    `
  },
  {
    id: "valuation-methodologies",
    type: "section",
    style: {
      pageBreak: "before"
    },
    title: "Selected Valuation Methodologies",
    content: `
      <table style="width: 100%; border-collapse: collapse; margin: 2em 0; font-size: 10px; border: 1px solid #ccc;">
        <thead>
          <tr style="background-color: #0f3b57; color: white;">
            <th style="padding: 8px; text-align: left; border: 1px solid #0f3b57;">METHOD</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #0f3b57; width: 60%;">DESCRIPTION</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #0f3b57;">DECISION & WEIGHT</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background: #dcfce7;">
            <td style="padding: 6px 8px; border: 1px solid #ccc;"><strong>Market Approach – OPM Backsolve</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">According to the AICPA guidelines, recent securities transactions should be considered as a relevant input for computing the enterprise valuation. The primary advantage of this method is that it establishes a value for equity compensation based on the support of the latest round of financing or transaction. Given that the most recent financing round was very recently ({{financing.last_round_date}}), we chose to utilize the backsolve method. After consideration a weight of 100% was selected.</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc; text-align: center; font-weight: bold;">✓ 100%</td>
          </tr>
          <tr style="background: #fef2f2; opacity: 0.7;">
            <td style="padding: 6px 8px; border: 1px solid #ccc;"><strong>Market Approach – Public Comparables</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">The basic premise of the comparables approach is that an equity's value should bear some resemblance to other equities in a similar class. In the case of the Company, it has a very unique product in a very new industry which makes it particularly difficult to establish an appropriate peer group. Due to substantial difference (relative to peer group) in size and stage of development of the Company, this methodology was considered and not used, as it does not accurately represent the going concern value of the subject Company.</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc; text-align: center; font-weight: bold;">✗ 0%</td>
          </tr>
          <tr style="background: #fef2f2; opacity: 0.7;">
            <td style="padding: 6px 8px; border: 1px solid #ccc;"><strong>Income Approach</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">DCF method allows us to consider explicitly the potential growth prospects and future cash flow streams. The Income Approach is the most informative valuation methodology, however it is not always suitable for early-stage companies where revenue projections have no historical basis, are often too speculative or otherwise unreliable to be relied upon for this valuation methodology. Based on the Company's stage of development, lack of operating history, and the great level of variability surrounding its innovative product and therefore long-term forecast, we did not consider the Income Approach in this analysis for the Company.</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc; text-align: center; font-weight: bold;">✗ 0%</td>
          </tr>
          <tr style="background: #fef2f2; opacity: 0.7;">
            <td style="padding: 6px 8px; border: 1px solid #ccc;"><strong>Asset Approach</strong></td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">The Company is not a capital-intensive business. We therefore concluded that other valuation approaches would better capture the fair market value than would the Asset Approach. Consequently, this methodology was considered and not used, as it does not accurately represent the going concern value of the subject Company.</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc; text-align: center; font-weight: bold;">✗ 0%</td>
          </tr>
        </tbody>
      </table>
    `
  },
  {
    id: "opm-backsolve",
    type: "section",
    style: {
      pageBreak: "before"
    },
    title: "Application of the OPM Backsolve Approach",
    content: `
      <h3 style="color: #124E66; margin: 1.5em 0 1em 0;">EQUITY VALUE CALCULATION METHODOLOGY</h3>
      <p style="margin-bottom: 2em;">
        As noted above, this analysis considers the {{financing.last_round_security}} transaction closed on {{financing.last_round_date}}, specifically the price per share paid in exchange for each share of {{financing.last_round_security}}. To determine the implied equity value from the transacted price, we used the Black Scholes OPM to allocate value to the various share classes such that the probability weighted {{financing.last_round_security}} per share value equals its Original Issued Price.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 10px; border: 1px solid #ccc;">
        <thead>
          <tr style="background-color: #124E66; color: white;">
            <th style="padding: 8px; text-align: left; border: 1px solid #124E66;">SUMMARY BACKSOLVE INPUTS</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #124E66; width: 60%;">DESCRIPTION</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #124E66;">VALUE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">Equity value (spot price)</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">Total consideration of the most recent transaction – we backsolved to an equity value that results in a value per share for the financing round</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{valuation.backsolve_equity_value}}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 6px 8px; border: 1px solid #ccc;">Volatility</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">Volatility - expected volatility, over the estimated terms, was estimated based upon an analysis of the historical volatility of guideline public companies in the {{valuation.volatility_industry}} in {{valuation.volatility_geography}}, as performed by {{valuation.volatility_source}}</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{valuation.volatility}}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">Time to Liquidity Event (Years)</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">An estimate for when liquidity will be achieved, either through dissolution, strategic sale, or IPO, reasonably estimated by reference to the subject Company's life cycle stage, funding needs, and strategic outlook</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{valuation.time_to_liquidity}}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 6px 8px; border: 1px solid #ccc;">Risk Free Interest Rate</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">A risk-free rate was applied which represents the US Treasury rate as of the Valuation Date. The risk free rate used is the constant maturity US Treasury rate corresponding to the applicable time to liquidity</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{valuation.risk_free_rate}}</td>
          </tr>
        </tbody>
      </table>
    `
  },
  {
    id: "dlom-analysis",
    type: "section",
    style: {
      pageBreak: "before"
    },
    title: "Discount for Lack of Marketability (Quantitative)",
    content: `
      <table style="width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 10px; border: 1px solid #ccc;">
        <thead>
          <tr style="background-color: #0f3b57; color: white;">
            <th colspan="2" style="padding: 8px; text-align: left; border: 1px solid #0f3b57;">DLOM INPUTS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">Equity Value (Spot Price)</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{valuation.weighted_equity_value}}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 6px 8px; border: 1px solid #ccc;">Strike Price</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{valuation.weighted_equity_value}}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">Risk Free Rate</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{valuation.risk_free_rate}}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 6px 8px; border: 1px solid #ccc;">Volatility</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{valuation.volatility}}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">Time to Liquidity (Years)</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{valuation.time_to_liquidity}}</td>
          </tr>
        </tbody>
      </table>

      <table style="width: 100%; border-collapse: collapse; margin: 2em 0; font-size: 10px; border: 1px solid #ccc;">
        <thead>
          <tr style="background-color: #124E66; color: white;">
            <th style="padding: 8px; text-align: left; border: 1px solid #124E66;">DLOM METHODOLOGY</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #124E66;">WEIGHT</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #124E66;">DLOM ARRIVED</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">The Chaffe Protective Put Model</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{dlom.chaffe_weight}}</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{dlom.chaffe_dlom}}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 6px 8px; border: 1px solid #ccc;">Finnerty Average Strike 2012 Model</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{dlom.finnerty_weight}}</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{dlom.finnerty_dlom}}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">Ghaidarov Average Strike Model</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{dlom.ghaidarov_weight}}</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{dlom.ghaidarov_dlom}}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 6px 8px; border: 1px solid #ccc;">Longstaff Lookback Put Option</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{dlom.longstaff_weight}}</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{dlom.longstaff_dlom}}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">DLOM - FMV Restricted Stock Studies</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{dlom.market_studies_weight}}</td>
            <td style="padding: 6px 8px; border: 1px solid #ccc;">{{dlom.market_studies_dlom}}</td>
          </tr>
          <tr style="background: #124E66; color: white; font-weight: bold;">
            <td style="padding: 6px 8px; border: 1px solid #124E66;">CONCLUDED DLOM</td>
            <td style="padding: 6px 8px; border: 1px solid #124E66;"></td>
            <td style="padding: 6px 8px; border: 1px solid #124E66;">{{dlom.concluded_dlom}}</td>
          </tr>
        </tbody>
      </table>
    `
  },
  {
    id: "appraiser-bio",
    type: "section",
    style: {
      pageBreak: "before"
    },
    title: "Appraiser Bio and Credentials",
    content: `
      <div style="padding: 2em; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc;">
        <p>{{appraiser.bio}}</p>

        <div style="margin-top: 2em;">
          <p><strong>Appraiser:</strong></p>
          <p>{{appraiser.first_name}} {{appraiser.last_name}}; {{appraiser.title}}</p>
        </div>
      </div>
    `
  }
];

// Comprehensive variables schema using the correct naming convention
const comprehensiveVariablesSchema = {
  company: {
    name: { type: "string", description: "Company Name", required: true },
    description: { type: "string", description: "Business Description" },
    incorporation_year: { type: "number", description: "Year of Incorporation" },
    headquarters: { type: "string", description: "Headquarters Location" },
    business_model: { type: "string", description: "Business Model Description" },
    market_description: { type: "string", description: "Market Focus Description" },
    stage_of_development: { type: "string", description: "Stage of Development" },
    stage_description: { type: "string", description: "Stage of Development Description" },
    products: { type: "string", description: "Products Description" }
  },
  valuation: {
    date: { type: "date", description: "Valuation Date", required: true },
    security_type: { type: "string", description: "Security Type (e.g., Common Stock)", required: true },
    fair_market_value: { type: "currency", description: "Fair Market Value per Share", required: true },
    expiration_date: { type: "date", description: "Valuation Expiration Date" },
    backsolve_equity_value: { type: "currency", description: "Backsolve Equity Value" },
    volatility: { type: "percentage", description: "Volatility Percentage" },
    volatility_industry: { type: "string", description: "Volatility Industry" },
    volatility_geography: { type: "string", description: "Volatility Geography" },
    volatility_source: { type: "string", description: "Volatility Source" },
    time_to_liquidity: { type: "number", description: "Time to Liquidity (Years)" },
    risk_free_rate: { type: "percentage", description: "Risk Free Interest Rate" },
    weighted_equity_value: { type: "currency", description: "Weighted Equity Value" }
  },
  management: {
    member_1_name: { type: "string", description: "Management Team Member 1 Name" },
    member_1_title: { type: "string", description: "Management Team Member 1 Title" },
    member_2_name: { type: "string", description: "Management Team Member 2 Name" },
    member_2_title: { type: "string", description: "Management Team Member 2 Title" },
    member_3_name: { type: "string", description: "Management Team Member 3 Name" },
    member_3_title: { type: "string", description: "Management Team Member 3 Title" },
    member_4_name: { type: "string", description: "Management Team Member 4 Name" },
    member_4_title: { type: "string", description: "Management Team Member 4 Title" }
  },
  investors: {
    investor_1: { type: "string", description: "Leading Investor 1" },
    investor_2: { type: "string", description: "Leading Investor 2" },
    investor_3: { type: "string", description: "Leading Investor 3" },
    investor_4: { type: "string", description: "Leading Investor 4" }
  },
  designee: {
    first_name: { type: "string", description: "Designee First Name" },
    last_name: { type: "string", description: "Designee Last Name" },
    title: { type: "string", description: "Designee Title" },
    prefix: { type: "string", description: "Designee Prefix (Mr./Ms./Dr.)" }
  },
  financing: {
    last_round_date: { type: "date", description: "Last Financing Round Date" },
    last_round_security: { type: "string", description: "Last Round Security Type" },
    last_round_pps: { type: "currency", description: "Last Round Price Per Share" }
  },
  dlom: {
    chaffe_weight: { type: "percentage", description: "Chaffe Model Weight" },
    chaffe_dlom: { type: "percentage", description: "Chaffe Model DLOM" },
    finnerty_weight: { type: "percentage", description: "Finnerty Model Weight" },
    finnerty_dlom: { type: "percentage", description: "Finnerty Model DLOM" },
    ghaidarov_weight: { type: "percentage", description: "Ghaidarov Model Weight" },
    ghaidarov_dlom: { type: "percentage", description: "Ghaidarov Model DLOM" },
    longstaff_weight: { type: "percentage", description: "Longstaff Model Weight" },
    longstaff_dlom: { type: "percentage", description: "Longstaff Model DLOM" },
    market_studies_weight: { type: "percentage", description: "Market Studies Weight" },
    market_studies_dlom: { type: "percentage", description: "Market Studies DLOM" },
    concluded_dlom: { type: "percentage", description: "Concluded DLOM" }
  },
  appraiser: {
    first_name: { type: "string", description: "Appraiser First Name" },
    last_name: { type: "string", description: "Appraiser Last Name" },
    title: { type: "string", description: "Appraiser Title" },
    bio: { type: "text", description: "Appraiser Bio and Credentials" }
  },
  engagement: {
    letter_date: { type: "date", description: "Engagement Letter Date" }
  },
  report: {
    date: { type: "date", description: "Report Date" }
  },
  capital_structure: {
    table_rows: { type: "html", description: "Capital Structure Table Rows" }
  },
  custom: {
    content: { type: "html", description: "Custom Additional Analysis Content" }
  }
};

async function updateTemplateWithBlocks() {
  try {
    console.log('Updating 409A template with comprehensive structured blocks...');

    // Get the template ID first
    const { data: template, error: fetchError } = await supabase
      .from('report_templates')
      .select('id')
      .eq('name', 'Standard 409A Valuation Report')
      .single();

    if (fetchError) {
      console.error('Error fetching template:', fetchError);
      return;
    }

    console.log('Found template with ID:', template.id);

    // Update the template with new blocks and variables schema
    const { error: updateError } = await supabase
      .from('report_templates')
      .update({
        blocks: comprehensiveBlocks,
        variables_schema: comprehensiveVariablesSchema,
        branding: {
          fontFamily: "Times New Roman",
          primaryColor: "#124E66",
          secondaryColor: "#2E8BC0",
          footerEnabled: true,
          headerEnabled: true
        },
        description: "A comprehensive 409A valuation report template with all professional sections including cover page, management letter, company overview, capital structure, valuation methodologies, OPM backsolve analysis, DLOM calculations, and appraiser credentials",
        updated_at: new Date().toISOString()
      })
      .eq('id', template.id);

    if (updateError) {
      console.error('Error updating template:', updateError);
      return;
    }

    console.log('Template blocks updated successfully!');

    // Verify the update
    const { data: updatedTemplate, error: verifyError } = await supabase
      .from('report_templates')
      .select('*')
      .eq('id', template.id)
      .single();

    if (verifyError) {
      console.error('Error verifying update:', verifyError);
      return;
    }

    console.log('\nVerification:');
    console.log('Template name:', updatedTemplate.name);
    console.log('Number of blocks:', updatedTemplate.blocks.length);
    console.log('Variable categories:', Object.keys(updatedTemplate.variables_schema));
    console.log('Primary color:', updatedTemplate.branding.primaryColor);

    // Count total variables
    let totalVars = 0;
    Object.values(updatedTemplate.variables_schema).forEach(category => {
      totalVars += Object.keys(category).length;
    });
    console.log('Total variables defined:', totalVars);

    console.log('\nTemplate update completed successfully!');

  } catch (error) {
    console.error('Error updating template:', error);
  }
}

updateTemplateWithBlocks();