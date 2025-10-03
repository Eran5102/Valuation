/**
 * Audit Trail Logger
 *
 * Provides comprehensive logging of all breakpoint analysis decisions and calculations.
 * Creates human-readable audit trail for transparency and debugging.
 *
 * @module AuditTrailLogger
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'
import { BreakpointType, RangeBasedBreakpoint } from '../types/BreakpointTypes'
import { DecimalHelpers } from './DecimalHelpers'

/**
 * Log entry severity levels
 */
export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: Date
  level: LogLevel
  category: string
  message: string
  data?: any
}

/**
 * Audit Trail Logger class
 *
 * Tracks all analysis steps and decisions
 */
export class AuditTrailLogger {
  private logs: LogEntry[] = []
  private startTime: Date
  private currentStep: number = 0

  constructor() {
    this.startTime = new Date()
  }

  /**
   * Start analysis with initial message
   */
  start(message: string): void {
    this.log(LogLevel.INFO, 'Analysis', `=== ${message} ===`)
    this.log(LogLevel.INFO, 'Analysis', `Started at: ${this.startTime.toISOString()}`)
  }

  /**
   * Log a step in the analysis
   */
  step(message: string, data?: any): void {
    this.currentStep++
    this.log(LogLevel.INFO, 'Step', `Step ${this.currentStep}: ${message}`, data)
  }

  /**
   * Log general information
   */
  info(category: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data)
  }

  /**
   * Log a warning
   */
  warning(category: string, message: string, data?: any): void {
    this.log(LogLevel.WARNING, category, message, data)
  }

  /**
   * Log an error
   */
  error(category: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data)
  }

  /**
   * Log debug information
   */
  debug(category: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data)
  }

  /**
   * Log breakpoint discovery
   */
  logBreakpoint(breakpoint: RangeBasedBreakpoint): void {
    const rangeStr = breakpoint.isOpenEnded
      ? `${DecimalHelpers.formatCurrency(breakpoint.rangeFrom)} → ∞`
      : `${DecimalHelpers.formatCurrency(breakpoint.rangeFrom)} → ${DecimalHelpers.formatCurrency(breakpoint.rangeTo!)}`

    this.log(
      LogLevel.INFO,
      'Breakpoint',
      `Breakpoint ${breakpoint.breakpointOrder} [${breakpoint.breakpointType}]: ${rangeStr}`,
      {
        type: breakpoint.breakpointType,
        range: rangeStr,
        participants: breakpoint.participants.length,
        totalShares: breakpoint.totalParticipatingShares.toString(),
        sectionRVPS: breakpoint.sectionRVPS.toString(),
        explanation: breakpoint.explanation,
      }
    )
  }

  /**
   * Log liquidation preference breakpoint
   */
  logLPBreakpoint(
    seniority: number,
    seriesNames: string[],
    lpAmount: Decimal,
    cumulativeLP: Decimal
  ): void {
    this.log(
      LogLevel.INFO,
      'LP Breakpoint',
      `Seniority ${seniority}: ${seriesNames.join(', ')} - LP ${DecimalHelpers.formatCurrency(lpAmount)}`,
      {
        seniority,
        series: seriesNames,
        lpAmount: lpAmount.toString(),
        cumulativeLP: cumulativeLP.toString(),
      }
    )
  }

  /**
   * Log pro-rata distribution start
   */
  logProRataStart(totalLP: Decimal, participatingShares: Decimal, participants: string[]): void {
    this.log(
      LogLevel.INFO,
      'Pro-Rata',
      `Pro-rata distribution begins at ${DecimalHelpers.formatCurrency(totalLP)}`,
      {
        startPoint: totalLP.toString(),
        participatingShares: participatingShares.toString(),
        participants,
      }
    )
  }

  /**
   * Log option exercise analysis
   */
  logOptionExercise(
    poolName: string,
    strikePrice: Decimal,
    optionShares: Decimal,
    exercisePoint: Decimal,
    iterations?: number
  ): void {
    this.log(
      LogLevel.INFO,
      'Option Exercise',
      `${poolName} @ ${DecimalHelpers.formatCurrency(strikePrice)}: Exercises at ${DecimalHelpers.formatCurrency(exercisePoint)}`,
      {
        poolName,
        strikePrice: strikePrice.toString(),
        optionShares: optionShares.toString(),
        exercisePoint: exercisePoint.toString(),
        solverIterations: iterations,
      }
    )
  }

  /**
   * Log voluntary conversion analysis
   */
  logConversion(
    seriesName: string,
    stepNumber: number,
    classRVPS: Decimal,
    indifferencePoint: Decimal,
    waivedLP: Decimal,
    remainingLP: Decimal,
    priorConversions: string[]
  ): void {
    this.log(
      LogLevel.INFO,
      'Voluntary Conversion',
      `Step ${stepNumber}: ${seriesName} converts at ${DecimalHelpers.formatCurrency(indifferencePoint)}`,
      {
        seriesName,
        stepNumber,
        classRVPS: classRVPS.toString(),
        indifferencePoint: indifferencePoint.toString(),
        waivedLP: waivedLP.toString(),
        remainingLP: remainingLP.toString(),
        priorConversions,
      }
    )
  }

  /**
   * Log participation cap reached
   */
  logCapReached(seriesName: string, capAmount: Decimal, capThreshold: Decimal): void {
    this.log(
      LogLevel.INFO,
      'Participation Cap',
      `${seriesName} reaches cap of ${DecimalHelpers.formatCurrency(capAmount)} at exit ${DecimalHelpers.formatCurrency(capThreshold)}`,
      {
        seriesName,
        capAmount: capAmount.toString(),
        capThreshold: capThreshold.toString(),
      }
    )
  }

  /**
   * Log per-class RVPS calculation
   */
  logClassRVPS(
    seriesName: string,
    classLP: Decimal,
    classShares: Decimal,
    classRVPS: Decimal,
    conversionPriority?: number
  ): void {
    this.log(
      LogLevel.INFO,
      'Class RVPS',
      `${seriesName}: RVPS = ${DecimalHelpers.formatCurrency(classRVPS)} (LP ${DecimalHelpers.formatCurrency(classLP)} ÷ ${DecimalHelpers.formatNumber(classShares)} shares)`,
      {
        seriesName,
        classLP: classLP.toString(),
        classShares: classShares.toString(),
        classRVPS: classRVPS.toString(),
        conversionPriority,
      }
    )
  }

  /**
   * Log conversion order determination
   */
  logConversionOrder(orderedSeries: Array<{ name: string; rvps: Decimal }>): void {
    const orderStr = orderedSeries
      .map((s, idx) => `${idx + 1}. ${s.name} (RVPS: $${s.rvps.toFixed(2)})`)
      .join(', ')

    this.log(
      LogLevel.INFO,
      'Conversion Order',
      `Conversion sequence (lowest RVPS first): ${orderStr}`,
      {
        order: orderedSeries.map((s) => ({
          name: s.name,
          rvps: s.rvps.toString(),
        })),
      }
    )
  }

  /**
   * Log circular dependency solver
   */
  logCircularResolution(
    description: string,
    initialGuess: Decimal,
    solution: Decimal,
    iterations: number,
    tolerance: Decimal,
    converged: boolean
  ): void {
    const level = converged ? LogLevel.INFO : LogLevel.WARNING

    this.log(
      level,
      'Circular Solver',
      `${description}: ${converged ? 'Converged' : 'Failed'} at ${DecimalHelpers.formatCurrency(solution)} (${iterations} iterations)`,
      {
        description,
        initialGuess: initialGuess.toString(),
        solution: solution.toString(),
        iterations,
        tolerance: tolerance.toString(),
        converged,
      }
    )
  }

  /**
   * Log mathematical proof
   */
  logMathematicalProof(title: string, proof: string): void {
    this.log(LogLevel.DEBUG, 'Mathematical Proof', title, { proof })
  }

  /**
   * Log validation result
   */
  logValidation(testName: string, passed: boolean, expected: any, actual: any): void {
    const level = passed ? LogLevel.INFO : LogLevel.ERROR

    this.log(level, 'Validation', `${testName}: ${passed ? 'PASSED' : 'FAILED'}`, {
      testName,
      passed,
      expected,
      actual,
    })
  }

  /**
   * Log dependency information
   */
  logDependency(breakpointType: BreakpointType, dependencies: string[], satisfied: boolean): void {
    const level = satisfied ? LogLevel.INFO : LogLevel.WARNING

    this.log(
      level,
      'Dependency',
      `${breakpointType} dependencies ${satisfied ? 'satisfied' : 'not satisfied'}: ${dependencies.join(', ')}`,
      {
        breakpointType,
        dependencies,
        satisfied,
      }
    )
  }

  /**
   * Log cumulative RVPS tracking
   */
  logRVPSTracking(
    securityName: string,
    breakpointOrder: number,
    sectionRVPS: Decimal,
    cumulativeRVPS: Decimal
  ): void {
    this.log(
      LogLevel.DEBUG,
      'RVPS Tracking',
      `${securityName} @ Breakpoint ${breakpointOrder}: Section RVPS ${DecimalHelpers.formatCurrency(sectionRVPS)}, Cumulative ${DecimalHelpers.formatCurrency(cumulativeRVPS)}`,
      {
        securityName,
        breakpointOrder,
        sectionRVPS: sectionRVPS.toString(),
        cumulativeRVPS: cumulativeRVPS.toString(),
      }
    )
  }

  /**
   * Complete analysis with summary
   */
  complete(
    totalBreakpoints: number,
    breakpointsByType: Record<BreakpointType, number>,
    analysisTimeMs: number
  ): void {
    this.log(LogLevel.INFO, 'Analysis', '=== Analysis Complete ===')
    this.log(LogLevel.INFO, 'Summary', `Total Breakpoints: ${totalBreakpoints}`, breakpointsByType)
    this.log(LogLevel.INFO, 'Performance', `Analysis time: ${analysisTimeMs}ms`)

    const endTime = new Date()
    this.log(LogLevel.INFO, 'Analysis', `Completed at: ${endTime.toISOString()}`)
  }

  /**
   * Get full audit trail as formatted string
   */
  getFullLog(): string {
    return this.logs
      .map((entry) => {
        const timestamp = entry.timestamp.toISOString().substring(11, 23) // HH:mm:ss.SSS
        const level = entry.level.padEnd(7)
        const category = entry.category.padEnd(20)
        return `[${timestamp}] ${level} ${category} ${entry.message}`
      })
      .join('\n')
  }

  /**
   * Get audit trail as JSON
   */
  getLogsAsJSON(): LogEntry[] {
    return this.logs
  }

  /**
   * Get filtered logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level)
  }

  /**
   * Get filtered logs by category
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter((log) => log.category === category)
  }

  /**
   * Get errors only
   */
  getErrors(): LogEntry[] {
    return this.getLogsByLevel(LogLevel.ERROR)
  }

  /**
   * Get warnings only
   */
  getWarnings(): LogEntry[] {
    return this.getLogsByLevel(LogLevel.WARNING)
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this.getErrors().length > 0
  }

  /**
   * Check if there are any warnings
   */
  hasWarnings(): boolean {
    return this.getWarnings().length > 0
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = []
    this.currentStep = 0
    this.startTime = new Date()
  }

  /**
   * Export logs as markdown
   */
  exportAsMarkdown(): string {
    const lines: string[] = []

    lines.push('# Breakpoint Analysis Audit Trail')
    lines.push('')
    lines.push(`**Started:** ${this.startTime.toISOString()}`)
    lines.push('')

    // Group by category
    const categories = new Set(this.logs.map((log) => log.category))

    for (const category of categories) {
      const categoryLogs = this.getLogsByCategory(category)
      if (categoryLogs.length === 0) continue

      lines.push(`## ${category}`)
      lines.push('')

      for (const log of categoryLogs) {
        const timestamp = log.timestamp.toISOString().substring(11, 23)
        const icon = this.getLevelIcon(log.level)
        lines.push(`- ${icon} **[${timestamp}]** ${log.message}`)

        if (log.data) {
          lines.push('  ```json')
          lines.push('  ' + JSON.stringify(log.data, null, 2))
          lines.push('  ```')
        }
      }

      lines.push('')
    }

    return lines.join('\n')
  }

  /**
   * Export logs as CSV
   */
  exportAsCSV(): string {
    const lines: string[] = []

    // Header
    lines.push('Timestamp,Level,Category,Message,Data')

    // Rows
    for (const log of this.logs) {
      const timestamp = log.timestamp.toISOString()
      const data = log.data ? JSON.stringify(log.data) : ''
      const message = log.message.replace(/"/g, '""') // Escape quotes
      lines.push(`"${timestamp}","${log.level}","${log.category}","${message}","${data}"`)
    }

    return lines.join('\n')
  }

  /**
   * Private: Add log entry
   */
  private log(level: LogLevel, category: string, message: string, data?: any): void {
    this.logs.push({
      timestamp: new Date(),
      level,
      category,
      message,
      data,
    })
  }

  /**
   * Private: Get icon for log level
   */
  private getLevelIcon(level: LogLevel): string {
    switch (level) {
      case LogLevel.INFO:
        return 'ℹ️'
      case LogLevel.WARNING:
        return '⚠️'
      case LogLevel.ERROR:
        return '❌'
      case LogLevel.DEBUG:
        return '🔍'
    }
  }
}
