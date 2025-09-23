import { v4 as uuidv4 } from 'uuid'

export interface Scenario {
  id: string
  name: string
  description: string
  lastModified: string
  assumptions: ScenarioAssumptions
  terminalAssumptions?: TerminalAssumptions
  projections?: {
    [key: string]: number[]
  }
}

export interface TerminalAssumptions {
  terminalGrowthRate: number
  terminalNopatMargin: number
  terminalReinvestmentRate: number
  terminalRoic?: number
}

export interface ScenarioAssumptions {
  incomeCf: {
    [key: string]: number[]
  }
  balanceSheet: {
    [key: string]: number[]
  }
}

// Default assumptions for new scenarios
export const DEFAULT_ASSUMPTIONS: ScenarioAssumptions = {
  incomeCf: {
    'Sales Growth (%)': Array(10).fill(5),
    'COGS (% of Sales)': Array(10).fill(65),
    'SG&A (% of Sales)': Array(10).fill(15),
    'Depreciation (% of Sales)': Array(10).fill(3),
    'CapEx (% of Sales)': Array(10).fill(4),
  },
  balanceSheet: {
    'Days Sales Outstanding (DSO)': Array(10).fill(45),
    'Days Inventory Held (DIH)': Array(10).fill(60),
    'Days Payable Outstanding (DPO)': Array(10).fill(30),
    'Prepaid & Other Curr Assets (% Sales)': Array(10).fill(2),
    'Accrued Liabilities (% Sales)': Array(10).fill(3),
  },
}

// Default terminal assumptions
export const DEFAULT_TERMINAL_ASSUMPTIONS: TerminalAssumptions = {
  terminalGrowthRate: 2.0,
  terminalNopatMargin: 15.0,
  terminalReinvestmentRate: 40.0,
}

// Create a new empty scenario
export function createNewScenario(id: string, name: string, maxYears: number): Scenario {
  return {
    id,
    name,
    description: 'New scenario description',
    lastModified: new Date().toISOString(),
    assumptions: {
      incomeCf: {
        'Sales Growth (%)': Array(maxYears).fill(5),
        'COGS (% of Sales)': Array(maxYears).fill(65),
        'SG&A (% of Sales)': Array(maxYears).fill(15),
        'Depreciation (% of Sales)': Array(maxYears).fill(3),
        'CapEx (% of Sales)': Array(maxYears).fill(4),
      },
      balanceSheet: {
        'Days Sales Outstanding (DSO)': Array(maxYears).fill(45),
        'Days Inventory Held (DIH)': Array(maxYears).fill(60),
        'Days Payable Outstanding (DPO)': Array(maxYears).fill(30),
        'Prepaid & Other Curr Assets (% Sales)': Array(maxYears).fill(2),
        'Accrued Liabilities (% Sales)': Array(maxYears).fill(3),
      },
    },
    terminalAssumptions: { ...DEFAULT_TERMINAL_ASSUMPTIONS },
  }
}

// Create default scenarios
export function createDefaultScenarios(maxYears: number): Scenario[] {
  return [
    createNewScenario('base-case', 'Base Case', maxYears),
    createNewScenario('upside-case', 'Upside Case', maxYears),
    createNewScenario('downside-case', 'Downside Case', maxYears),
  ]
}

// Calculate projections based on assumptions
export function calculateScenarioProjections(
  scenario: Scenario,
  lastRevenue: number,
  maxYears: number
) {
  const projections: { [key: string]: number[] } = {
    revenue: [],
    cogs: [],
    sgaExpense: [],
    depreciation: [],
    capex: [],
    accountsReceivable: [],
    inventory: [],
    accountsPayable: [],
    otherCurrentAssets: [],
    otherCurrentLiabilities: [],
  }

  let currentRevenue = lastRevenue

  for (let i = 0; i < maxYears; i++) {
    // Get growth rate from assumptions
    const salesGrowth = (scenario.assumptions.incomeCf['Sales Growth (%)'][i] || 0) / 100

    // Calculate revenue
    currentRevenue =
      i === 0 ? lastRevenue * (1 + salesGrowth) : projections.revenue[i - 1] * (1 + salesGrowth)
    projections.revenue.push(currentRevenue)

    // Calculate other items based on revenue
    const cogsPercent = (scenario.assumptions.incomeCf['COGS (% of Sales)'][i] || 0) / 100
    const sgaPercent = (scenario.assumptions.incomeCf['SG&A (% of Sales)'][i] || 0) / 100
    const depreciationPercent =
      (scenario.assumptions.incomeCf['Depreciation (% of Sales)'][i] || 0) / 100
    const capexPercent = (scenario.assumptions.incomeCf['CapEx (% of Sales)'][i] || 0) / 100

    projections.cogs.push(currentRevenue * cogsPercent)
    projections.sgaExpense.push(currentRevenue * sgaPercent)
    projections.depreciation.push(currentRevenue * depreciationPercent)
    projections.capex.push(currentRevenue * capexPercent)

    // Calculate balance sheet items
    const dso = scenario.assumptions.balanceSheet['Days Sales Outstanding (DSO)'][i] || 0
    const dih = scenario.assumptions.balanceSheet['Days Inventory Held (DIH)'][i] || 0
    const dpo = scenario.assumptions.balanceSheet['Days Payable Outstanding (DPO)'][i] || 0
    const prepaidPercent =
      (scenario.assumptions.balanceSheet['Prepaid & Other Curr Assets (% Sales)'][i] || 0) / 100
    const accruedPercent =
      (scenario.assumptions.balanceSheet['Accrued Liabilities (% Sales)'][i] || 0) / 100

    projections.accountsReceivable.push(currentRevenue * (dso / 365))
    projections.inventory.push(projections.cogs[i] * (dih / 365))
    projections.accountsPayable.push(projections.cogs[i] * (dpo / 365))
    projections.otherCurrentAssets.push(currentRevenue * prepaidPercent)
    projections.otherCurrentLiabilities.push(currentRevenue * accruedPercent)
  }

  return projections
}

// Function to update a specific assumption
export function updateScenarioAssumption(
  scenarios: Scenario[],
  scenarioId: string,
  category: 'incomeCf' | 'balanceSheet',
  label: string,
  values: number[]
): Scenario[] {
  return scenarios.map((scenario) => {
    if (scenario.id === scenarioId) {
      return {
        ...scenario,
        lastModified: new Date().toISOString(),
        assumptions: {
          ...scenario.assumptions,
          [category]: {
            ...scenario.assumptions[category],
            [label]: values,
          },
        },
      }
    }
    return scenario
  })
}

// Update terminal assumptions for a scenario
export function updateTerminalAssumptions(
  scenarios: Scenario[],
  scenarioId: string,
  terminalAssumptions: TerminalAssumptions
): Scenario[] {
  return scenarios.map((scenario) => {
    if (scenario.id === scenarioId) {
      return {
        ...scenario,
        lastModified: new Date().toISOString(),
        terminalAssumptions: {
          ...terminalAssumptions,
        },
      }
    }
    return scenario
  })
}

// Load scenarios from localStorage
export function loadScenariosFromLocalStorage() {
  const scenarios: Scenario[] = []
  let activeScenarioId = ''
  let activeScenarioName = ''
  let lastModified = ''

  try {
    const savedScenarios = localStorage.getItem('scenarios')
    if (savedScenarios) {
      const parsedScenarios = JSON.parse(savedScenarios)
      if (Array.isArray(parsedScenarios)) {
        scenarios.push(...parsedScenarios)
      }
    }

    activeScenarioId = localStorage.getItem('activeScenarioId') || ''
    activeScenarioName = localStorage.getItem('activeScenarioName') || ''

    if (activeScenarioId && scenarios.length > 0) {
      const activeScenario = scenarios.find((s) => s.id === activeScenarioId)
      if (activeScenario) {
        lastModified = activeScenario.lastModified || ''
      }
    }
  } catch (error) {
    console.error('Error loading scenarios from localStorage:', error)
  }

  return { scenarios, activeScenarioId, activeScenarioName, lastModified }
}

// Save active scenario ID and name
export function saveActiveScenarioId(id: string, name: string) {
  localStorage.setItem('activeScenarioId', id)
  localStorage.setItem('activeScenarioName', name)

  // Dispatch event for other components to know about the change
  window.dispatchEvent(
    new CustomEvent('activeScenarioChanged', {
      detail: { id, name },
    })
  )
}
