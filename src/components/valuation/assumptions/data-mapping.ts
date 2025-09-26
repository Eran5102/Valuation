// Convert flat database structure to nested structure for the form
export function formatAssumptionsFromDatabase(data: any): Record<string, any> {
  const formattedAssumptions: Record<string, any> = {}

  // Map database fields to form fields
  if (data.company_name) formattedAssumptions['company.company_name'] = data.company_name
  if (data.company_address) formattedAssumptions['company.company_address'] = data.company_address
  if (data.state_incorporation) formattedAssumptions['company.state_incorporation'] = data.state_incorporation
  if (data.incorporation_date) formattedAssumptions['company.incorporation_date'] = data.incorporation_date
  if (data.industry) formattedAssumptions['company.industry'] = data.industry
  if (data.company_stage) formattedAssumptions['company_profile.company_stage'] = data.company_stage
  if (data.valuation_date) formattedAssumptions['valuation_details.valuation_date'] = data.valuation_date
  if (data.fiscal_year_end) formattedAssumptions['company.fiscal_year_end'] = data.fiscal_year_end
  if (data.currency) formattedAssumptions['company.currency'] = data.currency
  if (data.discounting_convention) formattedAssumptions['company.discounting_convention'] = data.discounting_convention

  if (data.report_date) formattedAssumptions['valuation_details.report_date'] = data.report_date
  if (data.subject_security) formattedAssumptions['valuation_details.subject_security'] = data.subject_security
  if (data.valuation_purpose) formattedAssumptions['valuation_details.valuation_purpose'] = data.valuation_purpose
  if (data.standard_of_value) formattedAssumptions['valuation_details.standard_of_value'] = data.standard_of_value
  if (data.premise_of_value) formattedAssumptions['valuation_details.premise_of_value'] = data.premise_of_value

  if (data.designee_prefix) formattedAssumptions['designee.designee_prefix'] = data.designee_prefix
  if (data.designee_first_name) formattedAssumptions['designee.designee_first_name'] = data.designee_first_name
  if (data.designee_last_name) formattedAssumptions['designee.designee_last_name'] = data.designee_last_name
  if (data.designee_title) formattedAssumptions['designee.designee_title'] = data.designee_title
  if (data.engagement_letter_date) formattedAssumptions['designee.engagement_letter_date'] = data.engagement_letter_date

  if (data.appraiser_name) formattedAssumptions['appraiser.appraiser_name'] = data.appraiser_name
  if (data.appraiser_firm) formattedAssumptions['appraiser.appraiser_firm'] = data.appraiser_firm
  if (data.appraiser_credentials) formattedAssumptions['appraiser.appraiser_credentials'] = data.appraiser_credentials
  if (data.appraiser_phone) formattedAssumptions['appraiser.appraiser_phone'] = data.appraiser_phone
  if (data.appraiser_email) formattedAssumptions['appraiser.appraiser_email'] = data.appraiser_email

  if (data.historical_years !== undefined) formattedAssumptions['analysis_periods.historical_years'] = data.historical_years
  if (data.projection_years !== undefined) formattedAssumptions['analysis_periods.projection_years'] = data.projection_years

  if (data.risk_free_rate !== undefined) formattedAssumptions['volatility.risk_free_rate'] = data.risk_free_rate
  if (data.equity_volatility !== undefined) formattedAssumptions['volatility.equity_volatility'] = data.equity_volatility
  if (data.time_to_liquidity !== undefined) formattedAssumptions['volatility.time_to_liquidity'] = data.time_to_liquidity

  if (data.last_financing_date) formattedAssumptions['recent_transactions.last_financing_date'] = data.last_financing_date
  if (data.last_financing_amount) formattedAssumptions['recent_transactions.last_financing_amount'] = data.last_financing_amount
  if (data.last_financing_valuation) formattedAssumptions['recent_transactions.last_financing_valuation'] = data.last_financing_valuation
  if (data.last_financing_type) formattedAssumptions['recent_transactions.last_financing_type'] = data.last_financing_type

  // Load Company Profile fields
  if (data.company_description) formattedAssumptions['company_profile.company_description'] = data.company_description
  if (data.products_services) formattedAssumptions['company_profile.products_services'] = data.products_services
  if (data.industry_description) formattedAssumptions['company_profile.industry_description'] = data.industry_description
  if (data.stage_description) formattedAssumptions['company_profile.stage_description'] = data.stage_description

  return formattedAssumptions
}

// Convert nested form structure back to flat database structure
export function formatAssumptionsForDatabase(assumptions: Record<string, any>): any {
  const dataToSave: any = {}

  Object.entries(assumptions).forEach(([key, value]) => {
    if (key.startsWith('company.')) {
      const fieldName = key.replace('company.', '')
      dataToSave[fieldName] = value
    } else if (key.startsWith('company_profile.')) {
      const fieldName = key.replace('company_profile.', '')
      // Handle special fields
      if (fieldName === 'management_team' || fieldName === 'key_investors') {
        dataToSave[fieldName] = JSON.stringify(value)
      } else {
        dataToSave[fieldName] = value
      }
    } else if (key.startsWith('valuation_details.')) {
      const fieldName = key.replace('valuation_details.', '')
      dataToSave[fieldName] = value
    } else if (key.startsWith('designee.')) {
      const fieldName = key.replace('designee.', '')
      dataToSave[fieldName] = value
    } else if (key.startsWith('appraiser.')) {
      const fieldName = key.replace('appraiser.', '')
      dataToSave[fieldName] = value
    } else if (key.startsWith('analysis_periods.')) {
      const fieldName = key.replace('analysis_periods.', '')
      dataToSave[fieldName] = typeof value === 'string' ? parseInt(value) : value
    } else if (key.startsWith('volatility.')) {
      const fieldName = key.replace('volatility.', '')
      dataToSave[fieldName] = typeof value === 'string' ? parseFloat(value) : value
    } else if (key.startsWith('recent_transactions.')) {
      const fieldName = key.replace('recent_transactions.', '')
      if (fieldName === 'last_financing_amount' || fieldName === 'last_financing_valuation') {
        dataToSave[fieldName] = typeof value === 'string' ? parseFloat(value) : value
      } else {
        dataToSave[fieldName] = value
      }
    }
  })

  return dataToSave
}

// Parse team and investor data safely
export function parseTeamData(data: any) {
  if (!data) return []
  try {
    return typeof data === 'string' ? JSON.parse(data) : data
  } catch (e) {
    return []
  }
}

export function parseInvestorData(data: any) {
  if (!data) return []
  try {
    return typeof data === 'string' ? JSON.parse(data) : data
  } catch (e) {
    return []
  }
}