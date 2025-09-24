/**
 * Client-safe WACC calculations
 * These are simplified versions that can run in the browser
 */

export interface PeerCompany {
  name: string
  leveredBeta: number
  debtToEquity: number
  taxRate: number
}

export interface WACCInputs {
  // Peer Beta Analysis
  peerCompanies: PeerCompany[]
  targetDebtToEquity: number
  targetTaxRate: number

  // Cost of Equity Components
  riskFreeRate: number
  equityRiskPremium: number
  sizePremium: number
  countryRiskPremium: number
  companySpecificPremium: number

  // Cost of Debt
  preTaxCostOfDebt: number
  debtTaxRate: number

  // Capital Structure
  debtWeight: number
}

export interface WACCResults {
  unleveredBeta: number
  releveredBeta: number
  costOfEquity: number
  afterTaxCostOfDebt: number
  wacc: number
  breakdown: {
    riskFreeRate: number
    betaAdjustedPremium: number
    sizePremium: number
    countryRiskPremium: number
    companySpecificPremium: number
  }
}

/**
 * Calculate unlevered beta from peer companies
 */
function calculateUnleveredBeta(peers: PeerCompany[]): number {
  if (!peers.length) return 1.0

  const unleveredBetas = peers.map((peer) => {
    // Hamada formula: βu = βl / [1 + (1 - T) * (D/E)]
    return peer.leveredBeta / (1 + (1 - peer.taxRate) * peer.debtToEquity)
  })

  // Return average
  return unleveredBetas.reduce((sum, beta) => sum + beta, 0) / unleveredBetas.length
}

/**
 * Relever beta for target capital structure
 */
function releverBeta(
  unleveredBeta: number,
  targetDebtToEquity: number,
  targetTaxRate: number
): number {
  // Hamada formula: βl = βu * [1 + (1 - T) * (D/E)]
  return unleveredBeta * (1 + (1 - targetTaxRate) * targetDebtToEquity)
}

/**
 * Calculate cost of equity using CAPM + adjustments
 */
function calculateCostOfEquity(
  riskFreeRate: number,
  beta: number,
  equityRiskPremium: number,
  sizePremium: number,
  countryRiskPremium: number,
  companySpecificPremium: number
): number {
  return (
    riskFreeRate / 100 +
    beta * (equityRiskPremium / 100) +
    sizePremium / 100 +
    countryRiskPremium / 100 +
    companySpecificPremium / 100
  )
}

/**
 * Calculate after-tax cost of debt
 */
function calculateAfterTaxCostOfDebt(preTaxCostOfDebt: number, taxRate: number): number {
  return (preTaxCostOfDebt / 100) * (1 - taxRate)
}

/**
 * Main WACC calculation
 */
export function calculateWACC(inputs: WACCInputs): WACCResults {
  // Step 1: Calculate unlevered beta from peers
  const unleveredBeta =
    inputs.peerCompanies.length > 0 ? calculateUnleveredBeta(inputs.peerCompanies) : 1.0

  // Step 2: Relever beta for target capital structure
  const releveredBeta = releverBeta(unleveredBeta, inputs.targetDebtToEquity, inputs.targetTaxRate)

  // Step 3: Calculate cost of equity
  const costOfEquity = calculateCostOfEquity(
    inputs.riskFreeRate,
    releveredBeta,
    inputs.equityRiskPremium,
    inputs.sizePremium,
    inputs.countryRiskPremium,
    inputs.companySpecificPremium
  )

  // Step 4: Calculate after-tax cost of debt
  const afterTaxCostOfDebt = calculateAfterTaxCostOfDebt(
    inputs.preTaxCostOfDebt,
    inputs.debtTaxRate
  )

  // Step 5: Calculate WACC
  const equityWeight = 1 - inputs.debtWeight
  const wacc = equityWeight * costOfEquity + inputs.debtWeight * afterTaxCostOfDebt

  return {
    unleveredBeta,
    releveredBeta,
    costOfEquity: costOfEquity * 100, // Convert back to percentage
    afterTaxCostOfDebt: afterTaxCostOfDebt * 100, // Convert back to percentage
    wacc: wacc * 100, // Convert back to percentage
    breakdown: {
      riskFreeRate: inputs.riskFreeRate,
      betaAdjustedPremium: releveredBeta * inputs.equityRiskPremium,
      sizePremium: inputs.sizePremium,
      countryRiskPremium: inputs.countryRiskPremium,
      companySpecificPremium: inputs.companySpecificPremium,
    },
  }
}

/**
 * Find optimal capital structure by testing different debt/equity ratios
 */
export function findOptimalCapitalStructure(
  baseInputs: WACCInputs,
  minDebtRatio = 0,
  maxDebtRatio = 0.8,
  step = 0.05
): {
  optimalDebtRatio: number
  optimalWACC: number
  scenarios: Array<{ debtRatio: number; wacc: number }>
} {
  const scenarios: Array<{ debtRatio: number; wacc: number }> = []
  let optimalDebtRatio = 0
  let optimalWACC = Infinity

  for (let debtRatio = minDebtRatio; debtRatio <= maxDebtRatio; debtRatio += step) {
    const debtToEquity = debtRatio / (1 - debtRatio)

    const testInputs: WACCInputs = {
      ...baseInputs,
      targetDebtToEquity: debtToEquity,
      debtWeight: debtRatio,
    }

    const results = calculateWACC(testInputs)
    scenarios.push({ debtRatio, wacc: results.wacc })

    if (results.wacc < optimalWACC) {
      optimalWACC = results.wacc
      optimalDebtRatio = debtRatio
    }
  }

  return {
    optimalDebtRatio,
    optimalWACC,
    scenarios,
  }
}
