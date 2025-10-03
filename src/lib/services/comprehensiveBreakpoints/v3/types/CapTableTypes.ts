/**
 * Cap Table Type Definitions
 *
 * This module defines types for representing cap table data in the domain model.
 * These types are separate from database schemas to allow clean transformation.
 *
 * @module CapTableTypes
 * @version 3.0.0
 */

import { Decimal } from 'decimal.js'

/**
 * Cap Table Snapshot
 *
 * Immutable representation of a cap table at a point in time.
 * Used as input to breakpoint analysis.
 */
export interface CapTableSnapshot {
  /** Unique identifier */
  id: string

  /** Valuation ID this cap table belongs to */
  valuationId: string

  /** Company ID */
  companyId: string

  /** Preferred share classes */
  preferredSeries: PreferredShareClass[]

  /** Common stock */
  commonStock: CommonStock

  /** Option grants */
  options: OptionGrant[]

  /** Snapshot timestamp */
  snapshotTimestamp: Date

  /** Additional metadata */
  metadata?: CapTableMetadata
}

/**
 * Preferred Share Class
 *
 * Represents a series of preferred stock (e.g., Series A, Series B)
 */
export interface PreferredShareClass {
  /** Unique identifier */
  id: string

  /** Series name (e.g., "Series A", "Series B") */
  name: string

  /** Share type */
  shareType: 'preferred'

  /** Number of shares outstanding */
  sharesOutstanding: Decimal

  /** Original issue price per share */
  pricePerShare: Decimal

  /** Liquidation preference multiple (typically 1x) */
  liquidationMultiple: Decimal

  /** Total liquidation preference (shares × price × multiple) */
  totalLiquidationPreference: Decimal

  /** Seniority rank (0 = most senior, higher = more junior) */
  seniority: number

  /** Preference type */
  preferenceType: PreferenceType

  /** Participation cap (only for participating-with-cap) */
  participationCap: Decimal | null

  /** Conversion ratio (preferred to common) */
  conversionRatio: Decimal

  /** Round date */
  roundDate: Date

  /** Dividends declared */
  dividendsDeclared: boolean

  /** Dividend rate (if applicable) */
  dividendsRate: Decimal | null

  /** Dividend type */
  dividendsType: 'cumulative' | 'non-cumulative' | null

  /** Payment-in-kind (PIK) dividends */
  pik: boolean

  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Preference type for preferred stock
 */
export type PreferenceType = 'non-participating' | 'participating' | 'participating-with-cap'

/**
 * Common Stock
 *
 * Represents common stock holdings
 */
export interface CommonStock {
  /** Total common shares outstanding */
  sharesOutstanding: Decimal

  /** Shareholders breakdown (optional) */
  shareholders?: CommonShareholder[]

  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Common Shareholder
 */
export interface CommonShareholder {
  /** Shareholder name */
  name: string

  /** Shares held */
  shares: Decimal

  /** Percentage ownership */
  ownershipPercentage: Decimal
}

/**
 * Option Grant
 *
 * Represents stock options or warrants
 */
export interface OptionGrant {
  /** Unique identifier */
  id: string

  /** Pool name (e.g., "2020 Employee Pool", "Founder Options") */
  poolName: string

  /** Total number of options in this grant */
  numOptions: Decimal

  /** Exercise price (strike price) */
  exercisePrice: Decimal

  /** Vested portion (defaults to all if not specified) */
  vested: Decimal

  /** Option type */
  optionType: 'iso' | 'nso' | 'warrant' | 'other'

  /** Grant date */
  grantDate: Date

  /** Expiration date (if applicable) */
  expirationDate?: Date

  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Cap Table Metadata
 */
export interface CapTableMetadata {
  /** Total fully diluted shares (common + preferred + options) */
  totalFullyDilutedShares?: Decimal

  /** Total liquidation preference across all preferred */
  totalLiquidationPreference?: Decimal

  /** Date of last update to cap table */
  lastUpdated?: Date

  /** Additional custom metadata */
  [key: string]: any
}

/**
 * Seniority Group
 *
 * Groups share classes by seniority rank for pari passu handling
 */
export interface SeniorityGroup {
  /** Seniority rank */
  rank: number

  /** Share classes at this rank */
  classes: PreferredShareClass[]

  /** Total LP at this rank */
  totalLiquidationPreference: Decimal

  /** Total shares at this rank */
  totalShares: Decimal

  /** Whether this is a pari passu group (multiple classes at same rank) */
  isPariPassu: boolean
}

/**
 * Participating Securities
 *
 * Defines which securities participate in pro-rata distribution
 */
export interface ParticipatingSecurities {
  /** Common stock (always participates) */
  common: {
    shares: Decimal
    percentage: Decimal
  }

  /** Participating preferred */
  participatingPreferred: Array<{
    seriesName: string
    convertedShares: Decimal
    percentage: Decimal
  }>

  /** Exercised options */
  exercisedOptions: Array<{
    poolName: string
    shares: Decimal
    percentage: Decimal
  }>

  /** Total participating shares */
  totalParticipatingShares: Decimal
}

/**
 * Security Reference
 *
 * Lightweight reference to a security
 */
export interface SecurityReference {
  /** Security type */
  type: 'common' | 'preferred' | 'option'

  /** Security identifier (name or ID) */
  identifier: string

  /** Display name */
  displayName: string
}
