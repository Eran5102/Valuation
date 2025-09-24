import 'server-only'

/**
 * Server-only WACC calculations
 * Proprietary formulas for Weighted Average Cost of Capital
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
  equityWeight: number
}

export interface WACCResults {
  unleveredBeta: number
  releveredBeta: number
  costOfEquity: number
  afterTaxCostOfDebt: number
  wacc: number
  components: {
    riskFreeRate: number
    betaAdjustedPremium: number
    sizePremium: number
    countryRiskPremium: number
    companySpecificPremium: number
    totalEquityPremium: number
  }
}

/**
 * Calculate unlevered beta (asset beta) from levered beta
 * Hamada Formula: βU = βL / [1 + (1 - Tax Rate) × (D/E)]
 * PROPRIETARY ADJUSTMENT
 */
function unleverBeta(leveredBeta: number, debtToEquity: number, taxRate: number): number {
  return leveredBeta / (1 + (1 - taxRate) * debtToEquity)
}

/**
 * Calculate levered beta from unlevered beta
 * Reverse Hamada Formula: βL = βU × [1 + (1 - Tax Rate) × (D/E)]
 * PROPRIETARY ADJUSTMENT
 */
function releverBeta(unleveredBeta: number, debtToEquity: number, taxRate: number): number {
  return unleveredBeta * (1 + (1 - taxRate) * debtToEquity)
}

/**
 * Calculate median unlevered beta from peer companies
 * PROPRIETARY METHODOLOGY
 */
function calculateMedianUnleveredBeta(peers: PeerCompany[]): number {
  if (peers.length === 0) return 1.0

  const unleveredBetas = peers.map((peer) =>
    unleverBeta(peer.leveredBeta, peer.debtToEquity, peer.taxRate)
  )

  // Sort and find median
  unleveredBetas.sort((a, b) => a - b)
  const mid = Math.floor(unleveredBetas.length / 2)

  if (unleveredBetas.length % 2 === 0) {
    return (unleveredBetas[mid - 1] + unleveredBetas[mid]) / 2
  } else {
    return unleveredBetas[mid]
  }
}

/**
 * Calculate Cost of Equity using CAPM with adjustments
 * PROPRIETARY FORMULA
 */
function calculateCostOfEquity(
  riskFreeRate: number,
  beta: number,
  equityRiskPremium: number,
  sizePremium: number,
  countryRiskPremium: number,
  companySpecificPremium: number
): number {
  // CAPM: Re = Rf + β × (Rm - Rf) + Size + Country + Company-Specific
  return (
    riskFreeRate +
    beta * equityRiskPremium +
    sizePremium +
    countryRiskPremium +
    companySpecificPremium
  )
}

/**
 * Calculate After-Tax Cost of Debt
 * PROPRIETARY FORMULA
 */
function calculateAfterTaxCostOfDebt(preTaxCostOfDebt: number, taxRate: number): number {
  return preTaxCostOfDebt * (1 - taxRate)
}

/**
 * Main WACC Calculation
 * PROPRIETARY METHODOLOGY
 */
export function calculateWACC(inputs: WACCInputs): WACCResults {
  const {
    peerCompanies,
    targetDebtToEquity,
    targetTaxRate,
    riskFreeRate,
    equityRiskPremium,
    sizePremium,
    countryRiskPremium,
    companySpecificPremium,
    preTaxCostOfDebt,
    debtTaxRate,
    debtWeight,
    equityWeight,
  } = inputs

  // Step 1: Calculate median unlevered beta from peers
  const unleveredBeta = calculateMedianUnleveredBeta(peerCompanies)

  // Step 2: Relever beta for target capital structure
  const releveredBeta = releverBeta(unleveredBeta, targetDebtToEquity, targetTaxRate)

  // Step 3: Calculate cost of equity
  const costOfEquity = calculateCostOfEquity(
    riskFreeRate,
    releveredBeta,
    equityRiskPremium,
    sizePremium,
    countryRiskPremium,
    companySpecificPremium
  )

  // Step 4: Calculate after-tax cost of debt
  const afterTaxCostOfDebt = calculateAfterTaxCostOfDebt(preTaxCostOfDebt, debtTaxRate)

  // Step 5: Calculate WACC
  const wacc = costOfEquity * equityWeight + afterTaxCostOfDebt * debtWeight

  return {
    unleveredBeta,
    releveredBeta,
    costOfEquity,
    afterTaxCostOfDebt,
    wacc,
    components: {
      riskFreeRate,
      betaAdjustedPremium: releveredBeta * equityRiskPremium,
      sizePremium,
      countryRiskPremium,
      companySpecificPremium,
      totalEquityPremium: costOfEquity - riskFreeRate,
    },
  }
}

/**
 * Calculate optimal capital structure
 * Tests different debt/equity ratios to find minimum WACC
 * PROPRIETARY OPTIMIZATION
 */
export function findOptimalCapitalStructure(
  baseInputs: Omit<WACCInputs, 'debtWeight' | 'equityWeight' | 'targetDebtToEquity'>,
  debtRatios: number[] = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]
): { debtRatio: number; wacc: number; costOfEquity: number; costOfDebt: number }[] {
  const results = []

  for (const debtRatio of debtRatios) {
    const equityRatio = 1 - debtRatio
    const debtToEquity = debtRatio / equityRatio

    const waccResult = calculateWACC({
      ...baseInputs,
      targetDebtToEquity: debtToEquity,
      debtWeight: debtRatio,
      equityWeight: equityRatio,
    })

    results.push({
      debtRatio,
      wacc: waccResult.wacc,
      costOfEquity: waccResult.costOfEquity,
      costOfDebt: waccResult.afterTaxCostOfDebt,
    })
  }

  return results
}

/**
 * Industry beta adjustment based on business risk
 * PROPRIETARY FORMULA
 */
export function adjustBetaForIndustry(
  baseBeta: number,
  industryFactor: 'Low' | 'Medium' | 'High'
): number {
  const adjustments = {
    Low: 0.8,
    Medium: 1.0,
    High: 1.2,
  }

  return baseBeta * adjustments[industryFactor]
}
