const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xxqdqqglkemclosqzswh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4cWRxcWdsa2VtY2xvc3F6c3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NTE3NTQsImV4cCI6MjA3MzMyNzc1NH0.dsR-OVEFXOKVmNiVovJ48iSjvSOVwqnf4P4d6-X2V1k'

const supabase = createClient(supabaseUrl, supabaseKey)

// Comprehensive 409A Template from the professional template found
const comprehensiveTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>409A Valuation Report</title>
    <style>
        @page {
            size: A4;
            margin: 1in;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            background: #fff;
        }

        .container {
            max-width: 8.5in;
            margin: 0 auto;
            background: white;
        }

        .header {
            text-align: center;
            margin-bottom: 2em;
            padding: 2em 0;
            border-bottom: 3px solid #124E66;
        }

        .header h1 {
            font-size: 48px;
            color: #124E66;
            font-weight: bold;
            letter-spacing: 2px;
            margin-bottom: 0.5em;
        }

        .header .subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 2em;
            line-height: 1.6;
        }

        .value8-logo {
            font-size: 24px;
            color: #124E66;
            font-weight: bold;
            margin-top: 2em;
        }

        .section {
            margin-bottom: 3em;
            page-break-inside: avoid;
        }

        .section-title {
            font-size: 24px;
            color: #124E66;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 1em;
            padding-bottom: 0.5em;
            border-bottom: 2px solid #e5e7eb;
        }

        .section-number {
            display: inline-block;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #124E66;
            color: white;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            line-height: 60px;
            margin-right: 1em;
            float: left;
            margin-top: -10px;
        }

        .section-content {
            margin-left: 80px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1em 0;
            font-size: 10px;
        }

        table.data-table {
            border: 1px solid #ccc;
        }

        table.data-table th {
            background-color: #124E66;
            color: white;
            font-weight: bold;
            padding: 8px;
            text-align: left;
            border: 1px solid #124E66;
        }

        table.data-table td {
            padding: 6px 8px;
            border: 1px solid #ccc;
            text-align: left;
        }

        table.data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .summary-cards {
            display: flex;
            justify-content: space-between;
            gap: 2em;
            margin: 2em 0;
        }

        .summary-card {
            flex: 1;
            text-align: center;
            padding: 2em;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
        }

        .summary-card-icon {
            font-size: 48px;
            color: #124E66;
            margin-bottom: 1em;
        }

        .summary-card-title {
            font-size: 16px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 1em;
        }

        .summary-card-value {
            font-size: 20px;
            font-weight: bold;
            color: #124E66;
            padding: 10px;
            background: #f1f5f9;
            border-radius: 5px;
        }

        .overview-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 2em;
            margin: 2em 0;
        }

        .overview-card {
            padding: 1.5em;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #f8fafc;
        }

        .overview-card h3 {
            color: #124E66;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 1em;
            display: flex;
            align-items: center;
        }

        .overview-card-icon {
            margin-right: 0.5em;
            font-size: 16px;
        }

        ul {
            margin: 1em 0;
            padding-left: 1.5em;
        }

        li {
            margin-bottom: 0.5em;
        }

        .page-break {
            page-break-before: always;
        }

        .footer {
            margin-top: 3em;
            padding-top: 2em;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 10px;
            color: #666;
        }

        .methodology-table {
            margin: 2em 0;
        }

        .methodology-table th {
            background: #0f3b57 !important;
        }

        .weight-column {
            text-align: center;
            font-weight: bold;
        }

        .selected {
            background: #dcfce7 !important;
        }

        .not-selected {
            background: #fef2f2 !important;
            opacity: 0.7;
        }

        .breakpoint-table {
            font-size: 9px;
        }

        .breakpoint-table th,
        .breakpoint-table td {
            padding: 4px 6px;
        }

        @media print {
            .page-break {
                page-break-before: always;
            }

            .section {
                page-break-inside: avoid;
            }

            table {
                page-break-inside: avoid;
            }
        }

        .template-var {
            background: #fef3c7;
            padding: 2px 4px;
            border-radius: 3px;
            font-weight: bold;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Cover Page -->
        <div class="header">
            <h1>409A VALUATION</h1>
            <div class="subtitle">
                Per share Fair Value of <span class="template-var">{{SECURITY}}</span> of<br>
                <span class="template-var">{{COMPANY_NAME}}</span> in connection with the requirements<br>
                of Internal Revenue Code Section 409A as of<br>
                <span class="template-var">{{VALUATION_DATE}}</span>
            </div>
            <div class="value8-logo">VALUE8.AI</div>
            <div style="margin-top: 2em;">
                <strong><span class="template-var">{{REPORT_DATE}}</span></strong><br>
                <span class="template-var">{{COMPANY_NAME}}</span> PREPARED BY DATE
            </div>
        </div>

        <!-- Letter Page -->
        <div class="page-break"></div>
        <div class="section">
            <p style="margin-bottom: 2em;">
                <span class="template-var">{{DESIGNEE_FIRST_NAME}} {{DESIGNEE_LAST_NAME}}</span><br>
                <span class="template-var">{{DESIGNEE_TITLE}}</span><br>
                <span class="template-var">{{COMPANY_NAME}}</span>
            </p>

            <p style="margin-bottom: 1em;">Dear <span class="template-var">{{DESIGNEE_PREFIX}} {{DESIGNEE_LAST_NAME}}</span>,</p>

            <p style="margin-bottom: 1em;">
                At the request of <span class="template-var">{{COMPANY_NAME}}</span> ("Company"), Value8 ("Value8") estimated the fair value of the Company's <span class="template-var">{{SECURITY}}</span> (the "Subject Security"), as of <span class="template-var">{{VALUATION_DATE}}</span> ("Valuation Date") on a non-controlling, non-marketable basis ("Engagement"). Our analysis was prepared solely for the information and use of Company's management ("Management"). Our engagement is limited solely to performing this valuation, in accordance with our terms and conditions in Exhibit A of our letter of engagement dated <span class="template-var">{{ENGAGEMENT_LETTER_DATE}}</span>. While Management may use the results of this valuation for financial and/or tax reporting purposes including Internal Revenue Code Section 409A ("IRC 409A") and FASB Accounting Standards Codification Topic 718 – Stock Compensation ("ASC 718"), Value8 does not assume any liability in furnishing this estimation and opinion.
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
                {{CUSTOM_CONTENT}}
            </div>

            <h3 style="color: #124E66; margin: 1.5em 0 0.5em 0;">CONCLUSION</h3>
            <p style="margin-bottom: 2em;">
                Based on the assumptions and limiting conditions as described in this report, as well as the facts and circumstances as of the Valuation Date, Value8 estimated the fair market value of the Company's Ordinary Shares to be approximately <span class="template-var">{{FMV}}</span> per share as of the Valuation Date, on a non-marketable, minority-interest basis.
            </p>

            <p>Sincerely,<br><br>Value8</p>
        </div>

        <!-- Summary Valuation Results -->
        <div class="page-break"></div>
        <div class="section">
            <h2 class="section-title">SUMMARY VALUATION RESULTS</h2>

            <div class="summary-cards">
                <div class="summary-card">
                    <div class="summary-card-icon">$</div>
                    <div class="summary-card-title"><span class="template-var">{{SECURITY}}</span> VALUE</div>
                    <div class="summary-card-value"><span class="template-var">{{FMV}}</span></div>
                </div>
                <div class="summary-card">
                    <div class="summary-card-icon">📅</div>
                    <div class="summary-card-title">VALUATION DATE</div>
                    <div class="summary-card-value"><span class="template-var">{{VALUATION_DATE}}</span></div>
                </div>
                <div class="summary-card">
                    <div class="summary-card-icon">⏭</div>
                    <div class="summary-card-title">EXPIRATION DATE</div>
                    <div class="summary-card-value"><span class="template-var">{{EXPIRATION_DATE}}</span></div>
                </div>
            </div>
        </div>

        <!-- Company Overview -->
        <div class="page-break"></div>
        <div class="section">
            <div class="section-number">02</div>
            <div class="section-content">
                <h2 class="section-title">COMPANY OVERVIEW</h2>

                <div class="overview-grid">
                    <div class="overview-card">
                        <h3><span class="overview-card-icon">📋</span>BUSINESS DESCRIPTION</h3>
                        <p><strong>About:</strong> <span class="template-var">{{BUSINESS_DESCRIPTION}}</span></p>
                        <p><strong>Founded:</strong> The company was founded in <span class="template-var">{{INCORPORATION_YEAR}}</span></p>
                        <p><strong>Headquarters:</strong> <span class="template-var">{{HEADQUARTERS}}</span></p>
                        <p><strong>Business model:</strong> <span class="template-var">{{BUSINESS_MODEL_DESCRIPTION}}</span></p>
                    </div>

                    <div class="overview-card">
                        <h3><span class="overview-card-icon">🎯</span>MARKET FOCUS</h3>
                        <p><span class="template-var">{{MARKET_DESCRIPTION}}</span></p>
                    </div>

                    <div class="overview-card">
                        <h3><span class="overview-card-icon">📈</span>STAGE OF DEVELOPMENT</h3>
                        <p>The American Institute of Certified Public Accountants (AICPA) defines six stages of enterprise development. In this hierarchy, Value8 categorizes the Company as a <span class="template-var">{{STAGE_OF_DEVELOPMENT}}</span> company.</p>
                        <p><span class="template-var">{{STAGE_OF_DEVELOPMENT_DESCRIPTION}}</span></p>
                    </div>
                </div>

                <div class="overview-grid">
                    <div class="overview-card">
                        <h3><span class="overview-card-icon">🚀</span>PRODUCTS</h3>
                        <p><span class="template-var">{{PRODUCTS}}</span></p>
                    </div>

                    <div class="overview-card">
                        <h3><span class="overview-card-icon">👥</span>MANAGEMENT TEAM</h3>
                        <ul style="font-size: 10px;">
                            <li><span class="template-var">{{MGMT_TEAM_NAME_1}}</span>, <span class="template-var">{{MGMT_TEAM_TITLE_1}}</span></li>
                            <li><span class="template-var">{{MGMT_TEAM_NAME_2}}</span>, <span class="template-var">{{MGMT_TEAM_TITLE_2}}</span></li>
                            <li><span class="template-var">{{MGMT_TEAM_NAME_3}}</span>, <span class="template-var">{{MGMT_TEAM_TITLE_3}}</span></li>
                            <li><span class="template-var">{{MGMT_TEAM_NAME_4}}</span>, <span class="template-var">{{MGMT_TEAM_TITLE_4}}</span></li>
                        </ul>
                    </div>

                    <div class="overview-card">
                        <h3><span class="overview-card-icon">💰</span>LEADING INVESTORS</h3>
                        <ul style="font-size: 10px;">
                            <li><span class="template-var">{{INVESTOR_1}}</span></li>
                            <li><span class="template-var">{{INVESTOR_2}}</span></li>
                            <li><span class="template-var">{{INVESTOR_3}}</span></li>
                            <li><span class="template-var">{{INVESTOR_4}}</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- Capital Structure -->
        <div class="page-break"></div>
        <div class="section">
            <h2 class="section-title">CAPITAL STRUCTURE AND FINANCING HISTORY</h2>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>SHARES AND ROUND INFORMATION</th>
                        <th>SHARES</th>
                        <th>OPTIONS</th>
                        <th>WARRANTS</th>
                        <th>TOTAL OUTSTANDING</th>
                        <th>TOTAL FULLY DILUTED</th>
                        <th>% FD</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Series D Shares</td>
                        <td>1,000,000</td>
                        <td></td>
                        <td>5,000</td>
                        <td>1,000,000</td>
                        <td>1,050,000</td>
                        <td>33.25%</td>
                    </tr>
                    <tr>
                        <td>Series C Shares</td>
                        <td>1,000,000</td>
                        <td></td>
                        <td></td>
                        <td>1,000,000</td>
                        <td>0</td>
                        <td>33.25%</td>
                    </tr>
                    <tr>
                        <td>Series B Shares</td>
                        <td>1,000,000</td>
                        <td></td>
                        <td></td>
                        <td>1,000,000</td>
                        <td>1,000,000</td>
                        <td>33.25%</td>
                    </tr>
                    <tr>
                        <td>Series A Shares</td>
                        <td>1,000,000</td>
                        <td></td>
                        <td></td>
                        <td>1,000,000</td>
                        <td>1,000,000</td>
                        <td>33.25%</td>
                    </tr>
                    <tr>
                        <td>Ordinary Shares</td>
                        <td>1,000,000</td>
                        <td>500,000</td>
                        <td></td>
                        <td>1,000,000</td>
                        <td>1,500,000</td>
                        <td>33.25%</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Selected Valuation Methodologies -->
        <div class="page-break"></div>
        <div class="section">
            <div class="section-number">04</div>
            <div class="section-content">
                <h2 class="section-title">SELECTED VALUATION METHODOLOGIES</h2>

                <table class="data-table methodology-table">
                    <thead>
                        <tr>
                            <th>METHOD</th>
                            <th style="width: 60%;">DESCRIPTION</th>
                            <th>DECISION & WEIGHT</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="selected">
                            <td><strong>Market Approach – OPM Backsolve</strong></td>
                            <td>According to the AICPA guidelines, recent securities transactions should be considered as a relevant input for computing the enterprise valuation. The primary advantage of this method is that it establishes a value for equity compensation based on the support of the latest round of financing or transaction. Given that the most recent financing round was very recently (<span class="template-var">{{LAST_ROUND_DATE}}</span>), we chose to utilize the backsolve method. After consideration a weight of 100% was selected.</td>
                            <td class="weight-column">✓ 100%</td>
                        </tr>
                        <tr class="not-selected">
                            <td><strong>Market Approach – Public Comparables</strong></td>
                            <td>The basic premise of the comparables approach is that an equity's value should bear some resemblance to other equities in a similar class. In the case of the Company, it has a very unique product in a very new industry which makes it particularly difficult to establish an appropriate peer group. Due to substantial difference (relative to peer group) in size and stage of development of the Company, this methodology was considered and not used, as it does not accurately represent the going concern value of the subject Company.</td>
                            <td class="weight-column">✗ 0%</td>
                        </tr>
                        <tr class="not-selected">
                            <td><strong>Income Approach</strong></td>
                            <td>DCF method allows us to consider explicitly the potential growth prospects and future cash flow streams. The Income Approach is the most informative valuation methodology, however it is not always suitable for early-stage companies where revenue projections have no historical basis, are often too speculative or otherwise unreliable to be relied upon for this valuation methodology. Based on the Company's stage of development, lack of operating history, and the great level of variability surrounding its innovative product and therefore long-term forecast, we did not consider the Income Approach in this analysis for the Company.</td>
                            <td class="weight-column">✗ 0%</td>
                        </tr>
                        <tr class="not-selected">
                            <td><strong>Asset Approach</strong></td>
                            <td>The Company is not a capital-intensive business. We therefore concluded that other valuation approaches would better capture the fair market value than would the Asset Approach. Consequently, this methodology was considered and not used, as it does not accurately represent the going concern value of the subject Company.</td>
                            <td class="weight-column">✗ 0%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- OPM Backsolve Analysis -->
        <div class="page-break"></div>
        <div class="section">
            <div class="section-number">05</div>
            <div class="section-content">
                <h2 class="section-title">APPLICATION OF THE OPM BACKSOLVE APPROACH</h2>

                <h3 style="color: #124E66; margin: 1.5em 0 1em 0;">EQUITY VALUE CALCULATION METHODOLOGY</h3>
                <p style="margin-bottom: 2em;">
                    As noted above, this analysis considers the <span class="template-var">{{LAST_ROUND_SECURITY}}</span> transaction closed on (<span class="template-var">{{LAST_ROUND_DATE}}</span>, specifically the price per share paid in exchange for each share of <span class="template-var">{{LAST_ROUND_SECURITY}}</span>. To determine the implied equity value from the transacted price, we used the Black Scholes OPM to allocate value to the various share classes such that the probability weighted <span class="template-var">{{LAST_ROUND_SECURITY}}</span> per share value equals its Original Issued Price.
                </p>

                <table class="data-table">
                    <thead>
                        <tr>
                            <th>SUMMARY BACKSOLVE INPUTS</th>
                            <th style="width: 60%;">DESCRIPTION</th>
                            <th>VALUE</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Equity value (spot price)</td>
                            <td>Total consideration of the most recent transaction – we backsolved to an equity value that results in a value per share for the <span class="template-var">{{LAST_ROUND_SECURITY}}</span> of $<span class="template-var">{{LAST_ROUND_PPS}}</span></td>
                            <td><span class="template-var">{{BACKSOLVE_EQUITY_VALUE}}</span></td>
                        </tr>
                        <tr>
                            <td>Volatility</td>
                            <td>Volatility - expected volatility, over the estimated terms, was estimated based upon an analysis of the historical volatility of guideline public companies in the <span class="template-var">{{VOLATILITY_INDUSTRY}}</span> in <span class="template-var">{{VOLATILITY_GEOGRAPHY}}</span>, as performed by <span class="template-var">{{VOLATILITY_SOURCE}}</span></td>
                            <td><span class="template-var">{{VOLATILITY}}</span></td>
                        </tr>
                        <tr>
                            <td>Time to Liquidity Event (Years)</td>
                            <td>An estimate for when liquidity will be achieved, either through dissolution, strategic sale, or IPO, reasonably estimated by reference to the subject Company's life cycle stage, funding needs, and strategic outlook</td>
                            <td><span class="template-var">{{OPM_TIME_TO_LIQUIDITY}}</span></td>
                        </tr>
                        <tr>
                            <td>Risk Free Interest Rate</td>
                            <td>A risk-free rate was applied which represents the US Treasury rate as of the Valuation Date. The risk free rate used is the constant maturity US Treasury rate corresponding to the applicable time to liquidity</td>
                            <td><span class="template-var">{{OPM_RISK_FREE_RATE}}</span></td>
                        </tr>
                        <tr>
                            <td>Equity breakpoint value (strike price)</td>
                            <td>The rights and preferences of the various classes were used to calculate breakpoints. A breakpoint is the point at which each class of equity reaches in-the-money status. The value in excess of any given breakpoint is equal to a call option on the total equity value of the Company</td>
                            <td>See page 12</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- DLOM Analysis -->
        <div class="page-break"></div>
        <div class="section">
            <div class="section-number">06</div>
            <div class="section-content">
                <h2 class="section-title">DISCOUNT FOR LACK OF MARKETABILITY (QUANTITATIVE)</h2>

                <table class="data-table">
                    <thead>
                        <tr>
                            <th colspan="2" style="background: #0f3b57;">DLOM INPUTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Equity Value (Spot Price)</td>
                            <td><span class="template-var">{{WEIGHTED_EQUITY_VALUE}}</span></td>
                        </tr>
                        <tr>
                            <td>Strike Price</td>
                            <td><span class="template-var">{{WEIGHTED_EQUITY_VALUE}}</span></td>
                        </tr>
                        <tr>
                            <td>Risk Free Rate</td>
                            <td><span class="template-var">{{OPM_RISK_FREE_RATE}}</span></td>
                        </tr>
                        <tr>
                            <td>Volatility</td>
                            <td><span class="template-var">{{VOLATILITY}}</span></td>
                        </tr>
                        <tr>
                            <td>Time to Liquidity (Years)</td>
                            <td><span class="template-var">{{OPM_TIME_TO_LIQUIDITY}}</span></td>
                        </tr>
                    </tbody>
                </table>

                <table class="data-table" style="margin-top: 2em;">
                    <thead>
                        <tr>
                            <th>DLOM METHODOLOGY</th>
                            <th>WEIGHT</th>
                            <th>DLOM ARRIVED</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>The Chaffe Protective Put Model</td>
                            <td><span class="template-var">{{CHAFFE_WEIGHT}}</span></td>
                            <td><span class="template-var">{{CHAFFE_DLOM}}</span></td>
                        </tr>
                        <tr>
                            <td>Finnerty Average Strike 2012 Model</td>
                            <td><span class="template-var">{{FINNERTY_WEIGHT}}</span></td>
                            <td><span class="template-var">{{FINNERTY_DLOM}}</span></td>
                        </tr>
                        <tr>
                            <td>Ghaidarov Average Strike Model</td>
                            <td><span class="template-var">{{GHAIDAROV_WEIGHT}}</span></td>
                            <td><span class="template-var">{{GHAIDAROV_DLOM}}</span></td>
                        </tr>
                        <tr>
                            <td>Longstaff Lookback Put Option</td>
                            <td><span class="template-var">{{LONGSTAFF_WEIGHT}}</span></td>
                            <td><span class="template-var">{{LONGSTAFF_DLOM}}</span></td>
                        </tr>
                        <tr>
                            <td>DLOM - FMV Restricted Stock Studies</td>
                            <td><span class="template-var">{{MARKET_STUDIES_WEIGHT}}</span></td>
                            <td><span class="template-var">{{MARKET_STUDIES_DLOM}}</span></td>
                        </tr>
                        <tr style="background: #124E66; color: white; font-weight: bold;">
                            <td>CONCLUDED DLOM</td>
                            <td></td>
                            <td><span class="template-var">{{CONCLUDED_DLOM}}</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Appraiser Bio -->
        <div class="page-break"></div>
        <div class="section">
            <h2 class="section-title">APPRAISER BIO AND CREDENTIALS</h2>

            <div style="padding: 2em; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc;">
                <p><span class="template-var">{{APPRAISER_BIO}}</span></p>

                <div style="margin-top: 2em;">
                    <p><strong>Appraiser:</strong></p>
                    <p><span class="template-var">{{APPRAISER_FIRST_NAME}} {{APPRAISER_LAST_NAME}}</span>; <span class="template-var">{{APPRAISER_TITLE}}</span></p>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>409A Valuation for <span class="template-var">{{COMPANY_NAME}}</span> | Generated with Value8.AI</p>
            <p>Date: <span class="template-var">{{REPORT_DATE}}</span></p>
        </div>
    </div>
</body>
</html>
`

// All the variable mappings extracted from the comprehensive template
const variables = [
    // Company Information
    { name: 'COMPANY_NAME', description: 'Company Name', category: 'company', data_type: 'text' },
    { name: 'SECURITY', description: 'Security Type (e.g., Ordinary Shares)', category: 'valuation', data_type: 'text' },
    { name: 'VALUATION_DATE', description: 'Valuation Date', category: 'valuation', data_type: 'date' },
    { name: 'REPORT_DATE', description: 'Report Date', category: 'report', data_type: 'date' },
    { name: 'BUSINESS_DESCRIPTION', description: 'Business Description', category: 'company', data_type: 'text' },
    { name: 'INCORPORATION_YEAR', description: 'Year of Incorporation', category: 'company', data_type: 'number' },
    { name: 'HEADQUARTERS', description: 'Headquarters Location', category: 'company', data_type: 'text' },
    { name: 'BUSINESS_MODEL_DESCRIPTION', description: 'Business Model Description', category: 'company', data_type: 'text' },
    { name: 'MARKET_DESCRIPTION', description: 'Market Focus Description', category: 'company', data_type: 'text' },
    { name: 'STAGE_OF_DEVELOPMENT', description: 'Stage of Development', category: 'company', data_type: 'text' },
    { name: 'STAGE_OF_DEVELOPMENT_DESCRIPTION', description: 'Stage of Development Description', category: 'company', data_type: 'text' },
    { name: 'PRODUCTS', description: 'Products Description', category: 'company', data_type: 'text' },

    // Management Team
    { name: 'MGMT_TEAM_NAME_1', description: 'Management Team Member 1 Name', category: 'management', data_type: 'text' },
    { name: 'MGMT_TEAM_TITLE_1', description: 'Management Team Member 1 Title', category: 'management', data_type: 'text' },
    { name: 'MGMT_TEAM_NAME_2', description: 'Management Team Member 2 Name', category: 'management', data_type: 'text' },
    { name: 'MGMT_TEAM_TITLE_2', description: 'Management Team Member 2 Title', category: 'management', data_type: 'text' },
    { name: 'MGMT_TEAM_NAME_3', description: 'Management Team Member 3 Name', category: 'management', data_type: 'text' },
    { name: 'MGMT_TEAM_TITLE_3', description: 'Management Team Member 3 Title', category: 'management', data_type: 'text' },
    { name: 'MGMT_TEAM_NAME_4', description: 'Management Team Member 4 Name', category: 'management', data_type: 'text' },
    { name: 'MGMT_TEAM_TITLE_4', description: 'Management Team Member 4 Title', category: 'management', data_type: 'text' },

    // Investors
    { name: 'INVESTOR_1', description: 'Leading Investor 1', category: 'investors', data_type: 'text' },
    { name: 'INVESTOR_2', description: 'Leading Investor 2', category: 'investors', data_type: 'text' },
    { name: 'INVESTOR_3', description: 'Leading Investor 3', category: 'investors', data_type: 'text' },
    { name: 'INVESTOR_4', description: 'Leading Investor 4', category: 'investors', data_type: 'text' },

    // Designee Information
    { name: 'DESIGNEE_FIRST_NAME', description: 'Designee First Name', category: 'designee', data_type: 'text' },
    { name: 'DESIGNEE_LAST_NAME', description: 'Designee Last Name', category: 'designee', data_type: 'text' },
    { name: 'DESIGNEE_TITLE', description: 'Designee Title', category: 'designee', data_type: 'text' },
    { name: 'DESIGNEE_PREFIX', description: 'Designee Prefix (Mr./Ms./Dr.)', category: 'designee', data_type: 'text' },
    { name: 'ENGAGEMENT_LETTER_DATE', description: 'Engagement Letter Date', category: 'report', data_type: 'date' },

    // Valuation Results
    { name: 'FMV', description: 'Fair Market Value per Share', category: 'valuation', data_type: 'currency' },
    { name: 'EXPIRATION_DATE', description: 'Valuation Expiration Date', category: 'valuation', data_type: 'date' },

    // Last Round Information
    { name: 'LAST_ROUND_DATE', description: 'Last Financing Round Date', category: 'financing', data_type: 'date' },
    { name: 'LAST_ROUND_SECURITY', description: 'Last Round Security Type', category: 'financing', data_type: 'text' },
    { name: 'LAST_ROUND_PPS', description: 'Last Round Price Per Share', category: 'financing', data_type: 'currency' },

    // Valuation Methodology
    { name: 'BACKSOLVE_EQUITY_VALUE', description: 'Backsolve Equity Value', category: 'valuation', data_type: 'currency' },
    { name: 'VOLATILITY', description: 'Volatility Percentage', category: 'valuation', data_type: 'percentage' },
    { name: 'VOLATILITY_INDUSTRY', description: 'Volatility Industry', category: 'valuation', data_type: 'text' },
    { name: 'VOLATILITY_GEOGRAPHY', description: 'Volatility Geography', category: 'valuation', data_type: 'text' },
    { name: 'VOLATILITY_SOURCE', description: 'Volatility Source', category: 'valuation', data_type: 'text' },
    { name: 'OPM_TIME_TO_LIQUIDITY', description: 'Time to Liquidity (Years)', category: 'valuation', data_type: 'number' },
    { name: 'OPM_RISK_FREE_RATE', description: 'Risk Free Interest Rate', category: 'valuation', data_type: 'percentage' },
    { name: 'WEIGHTED_EQUITY_VALUE', description: 'Weighted Equity Value', category: 'valuation', data_type: 'currency' },

    // DLOM Variables
    { name: 'CHAFFE_WEIGHT', description: 'Chaffe Model Weight', category: 'dlom', data_type: 'percentage' },
    { name: 'CHAFFE_DLOM', description: 'Chaffe Model DLOM', category: 'dlom', data_type: 'percentage' },
    { name: 'FINNERTY_WEIGHT', description: 'Finnerty Model Weight', category: 'dlom', data_type: 'percentage' },
    { name: 'FINNERTY_DLOM', description: 'Finnerty Model DLOM', category: 'dlom', data_type: 'percentage' },
    { name: 'GHAIDAROV_WEIGHT', description: 'Ghaidarov Model Weight', category: 'dlom', data_type: 'percentage' },
    { name: 'GHAIDAROV_DLOM', description: 'Ghaidarov Model DLOM', category: 'dlom', data_type: 'percentage' },
    { name: 'LONGSTAFF_WEIGHT', description: 'Longstaff Model Weight', category: 'dlom', data_type: 'percentage' },
    { name: 'LONGSTAFF_DLOM', description: 'Longstaff Model DLOM', category: 'dlom', data_type: 'percentage' },
    { name: 'MARKET_STUDIES_WEIGHT', description: 'Market Studies Weight', category: 'dlom', data_type: 'percentage' },
    { name: 'MARKET_STUDIES_DLOM', description: 'Market Studies DLOM', category: 'dlom', data_type: 'percentage' },
    { name: 'CONCLUDED_DLOM', description: 'Concluded DLOM', category: 'dlom', data_type: 'percentage' },

    // Appraiser Information
    { name: 'APPRAISER_FIRST_NAME', description: 'Appraiser First Name', category: 'appraiser', data_type: 'text' },
    { name: 'APPRAISER_LAST_NAME', description: 'Appraiser Last Name', category: 'appraiser', data_type: 'text' },
    { name: 'APPRAISER_TITLE', description: 'Appraiser Title', category: 'appraiser', data_type: 'text' },
    { name: 'APPRAISER_BIO', description: 'Appraiser Bio and Credentials', category: 'appraiser', data_type: 'text' },

    // Custom Content
    { name: 'CUSTOM_CONTENT', description: 'Custom Additional Analysis Content', category: 'content', data_type: 'html' }
]

async function updateTemplate() {
    try {
        console.log('Updating 409A template with comprehensive content...')

        // Update the existing template
        const { error: templateError } = await supabase
            .from('report_templates')
            .update({
                template_content: comprehensiveTemplate,
                updated_at: new Date().toISOString()
            })
            .eq('name', '409A Valuation Report')

        if (templateError) {
            console.error('Error updating template:', templateError)
            return
        }

        console.log('Template updated successfully!')

        // Clear existing variable mappings for this template
        const { error: deleteError } = await supabase
            .from('report_variable_mappings')
            .delete()
            .eq('template_id', 1)

        if (deleteError) {
            console.error('Error deleting old mappings:', deleteError)
            return
        }

        console.log('Old variable mappings cleared!')

        // Insert new comprehensive variable mappings
        const mappings = variables.map(variable => ({
            template_id: 1,
            variable_name: variable.name,
            description: variable.description,
            category: variable.category,
            data_type: variable.data_type,
            is_required: ['COMPANY_NAME', 'VALUATION_DATE', 'FMV', 'SECURITY'].includes(variable.name)
        }))

        const { error: mappingError } = await supabase
            .from('report_variable_mappings')
            .insert(mappings)

        if (mappingError) {
            console.error('Error inserting variable mappings:', mappingError)
            return
        }

        console.log('Variable mappings updated successfully!')
        console.log(`Added ${variables.length} variable mappings`)

        // Verify the update
        const { data: template, error: fetchError } = await supabase
            .from('report_templates')
            .select('*')
            .eq('name', '409A Valuation Report')
            .single()

        if (fetchError) {
            console.error('Error fetching updated template:', fetchError)
            return
        }

        const { data: mappingData, error: mappingFetchError } = await supabase
            .from('report_variable_mappings')
            .select('*')
            .eq('template_id', 1)

        if (mappingFetchError) {
            console.error('Error fetching mappings:', mappingFetchError)
            return
        }

        console.log('\\nVerification:')
        console.log('Template name:', template.name)
        console.log('Template content length:', template.template_content.length, 'characters')
        console.log('Variable mappings count:', mappingData.length)
        console.log('\\nCategories:', [...new Set(mappingData.map(m => m.category))])

    } catch (error) {
        console.error('Error updating template:', error)
    }
}

updateTemplate()