import Decimal from 'decimal.js';
import { 
    CapTable, 
    PreferredStock, 
    OptionPool, 
    BreakpointSpec, 
    BreakpointType,
    LiquidationRank 
} from './dataStructures';

export interface DatabaseShareClass {
    id: number;
    companyId: number;
    shareType: 'common' | 'preferred';
    name: string;
    roundDate: string;
    sharesOutstanding: number;
    pricePerShare: number;
    preferenceType: 'non-participating' | 'participating' | 'participating-with-cap';
    lpMultiple: number;
    seniority: number;
    participationCap: number | null;
    conversionRatio: number;
    dividendsDeclared: boolean;
    dividendsRate: number | null;
    dividendsType: string | null;
    pik: boolean;
}

export interface DatabaseOption {
    id: string;
    numOptions: number;
    exercisePrice: number;
    type: string;
}

export interface BreakpointAnalysisResult {
    breakpoints: BreakpointSpec[];
    critical_values: CriticalValue[];
    dependency_graph: DependencyMapping[];
    calculation_metadata: CalculationMetadata;
}

export interface CriticalValue {
    value: Decimal;
    description: string;
    affected_securities: string[];
    triggers: string[];
}

export interface DependencyMapping {
    breakpoint_id: string;
    depends_on: string[];
    affects: string[];
    calculation_order: number;
}

export interface CalculationMetadata {
    total_breakpoints: number;
    liquidation_preference_total: Decimal;
    participation_caps_total: Decimal;
    option_exercise_thresholds: Decimal[];
    complexity_score: number;
    analysis_timestamp: Date;
    audit_trail: string[];
}

export class BreakpointAnalyzer {
    private shareClasses: DatabaseShareClass[];
    private options: DatabaseOption[];
    private audit_trail: string[];
    
    constructor(shareClasses: DatabaseShareClass[], options: DatabaseOption[] = []) {
        this.shareClasses = shareClasses;
        this.options = options;
        this.audit_trail = [];
    }
    
    /**
     * Comprehensive analysis of all waterfall breakpoints
     */
    analyzeCompleteBreakpointStructure(): BreakpointAnalysisResult {
        this.audit_trail = [`Starting breakpoint analysis at ${new Date().toISOString()}`];
        const allBreakpoints: BreakpointSpec[] = [];
        const criticalValues: CriticalValue[] = [];
        
        // Type 1: Liquidation Preference Breakpoints
        const lpBreakpoints = this.analyzeLiquidationPreferences();
        allBreakpoints.push(...lpBreakpoints.breakpoints);
        criticalValues.push(...lpBreakpoints.criticalValues);
        this.audit_trail.push(lpBreakpoints.auditEntry);
        
        // Type 2: Pro Rata Distribution Breakpoint
        const proRataBreakpoint = this.analyzeProRataBreakpoint();
        if (proRataBreakpoint.breakpoint) {
            allBreakpoints.push(proRataBreakpoint.breakpoint);
            criticalValues.push(proRataBreakpoint.criticalValue);
        }
        this.audit_trail.push(proRataBreakpoint.auditEntry);
        
        // Type 3: Option Exercise Breakpoints
        const optionBreakpoints = this.analyzeOptionExerciseBreakpoints();
        allBreakpoints.push(...optionBreakpoints.breakpoints);
        criticalValues.push(...optionBreakpoints.criticalValues);
        this.audit_trail.push(optionBreakpoints.auditEntry);
        
        // Type 4: Participation Cap Breakpoints
        const capBreakpoints = this.analyzeParticipationCapBreakpoints();
        allBreakpoints.push(...capBreakpoints.breakpoints);
        criticalValues.push(...capBreakpoints.criticalValues);
        this.audit_trail.push(capBreakpoints.auditEntry);
        
        // Type 5: Voluntary Conversion Breakpoints
        const conversionBreakpoints = this.analyzeVoluntaryConversionBreakpoints();
        allBreakpoints.push(...conversionBreakpoints.breakpoints);
        criticalValues.push(...conversionBreakpoints.criticalValues);
        this.audit_trail.push(conversionBreakpoints.auditEntry);
        
        // Sort all breakpoints by exit value
        const sortedBreakpoints = allBreakpoints.sort((a, b) => a.exit_value.sub(b.exit_value).toNumber());
        
        // Generate dependency graph
        const dependencyGraph = this.generateDependencyGraph(sortedBreakpoints);
        
        // Calculate comprehensive metadata
        const metadata = this.calculateMetadata(sortedBreakpoints);
        
        this.audit_trail.push(`Analysis complete: ${sortedBreakpoints.length} breakpoints identified`);
        
        return {
            breakpoints: sortedBreakpoints,
            critical_values: criticalValues,
            dependency_graph: dependencyGraph,
            calculation_metadata: metadata
        };
    }
    
    /**
     * Analyze liquidation preference breakpoints by seniority
     */
    private analyzeLiquidationPreferences(): {
        breakpoints: BreakpointSpec[];
        criticalValues: CriticalValue[];
        auditEntry: string;
    } {
        const breakpoints: BreakpointSpec[] = [];
        const criticalValues: CriticalValue[] = [];
        
        // Get preferred shares grouped by seniority (0 = most senior)
        const preferredShares = this.shareClasses.filter(sc => sc.shareType === 'preferred');
        const seniorityGroups = this.groupBySeniority(preferredShares);
        
        let cumulativeLp = new Decimal(0);
        
        for (const [seniority, classes] of Object.entries(seniorityGroups).sort(([a], [b]) => parseInt(a) - parseInt(b))) {
            const seniorityLp = classes.reduce((sum, sc) => 
                sum.add(new Decimal(sc.sharesOutstanding).mul(sc.pricePerShare).mul(sc.lpMultiple)), 
                new Decimal(0)
            );
            cumulativeLp = cumulativeLp.add(seniorityLp);
            
            const affectedSecurities = classes.map(sc => sc.name);
            
            breakpoints.push({
                breakpoint_type: BreakpointType.LIQUIDATION_PREFERENCE,
                exit_value: cumulativeLp,
                affected_securities: affectedSecurities,
                calculation_method: 'cumulative_seniority_liquidation_preference',
                priority_order: parseInt(seniority) * 100,
                explanation: `Liquidation preference satisfied for seniority level ${seniority}`,
                mathematical_derivation: `LP = Σ(shares × price × multiple) = ${seniorityLp.toFixed(2)} (cumulative: ${cumulativeLp.toFixed(2)})`,
                dependencies: []
            });
            
            criticalValues.push({
                value: cumulativeLp,
                description: `Total liquidation preferences through seniority ${seniority}`,
                affected_securities: affectedSecurities,
                triggers: ['liquidation_preference_satisfaction']
            });
        }
        
        const auditEntry = `LIQUIDATION PREFERENCE ANALYSIS:
- Seniority levels: ${Object.keys(seniorityGroups).length}
- Total LP: $${cumulativeLp.toFixed(2)}
- Breakpoints created: ${breakpoints.length}`;
        
        return { breakpoints, criticalValues, auditEntry };
    }
    
    /**
     * Analyze pro rata distribution breakpoint
     */
    private analyzeProRataBreakpoint(): {
        breakpoint: BreakpointSpec | null;
        criticalValue: CriticalValue;
        auditEntry: string;
    } {
        const totalLp = this.getTotalLiquidationPreference();
        
        // Calculate participating shares
        const commonShares = this.shareClasses
            .filter(sc => sc.shareType === 'common')
            .reduce((sum, sc) => sum.add(sc.sharesOutstanding), new Decimal(0));
        
        const participatingPreferred = this.shareClasses
            .filter(sc => sc.shareType === 'preferred' && sc.preferenceType !== 'non-participating')
            .reduce((sum, sc) => sum.add(new Decimal(sc.sharesOutstanding).mul(sc.conversionRatio)), new Decimal(0));
        
        const totalParticipatingShares = commonShares.add(participatingPreferred);
        
        const breakpoint: BreakpointSpec = {
            breakpoint_type: BreakpointType.PRO_RATA_DISTRIBUTION,
            exit_value: totalLp,
            affected_securities: ['All participating securities'],
            calculation_method: 'total_liquidation_preferences',
            priority_order: 1000,
            explanation: 'Pro rata distribution begins after all liquidation preferences satisfied',
            mathematical_derivation: `Exit value = Total LP = ${totalLp.toFixed(2)}`,
            dependencies: ['liquidation_preference_satisfaction']
        };
        
        const criticalValue: CriticalValue = {
            value: totalLp,
            description: 'Pro rata distribution commencement',
            affected_securities: ['Common Stock', 'Participating Preferred'],
            triggers: ['pro_rata_distribution_start']
        };
        
        const auditEntry = `PRO RATA DISTRIBUTION ANALYSIS:
- Breakpoint: $${totalLp.toFixed(2)}
- Participating shares: ${totalParticipatingShares.toFixed(0)}
  - Common: ${commonShares.toFixed(0)}
  - Participating preferred (converted): ${participatingPreferred.toFixed(0)}`;
        
        return { breakpoint, criticalValue, auditEntry };
    }
    
    /**
     * Analyze option exercise breakpoints
     */
    private analyzeOptionExerciseBreakpoints(): {
        breakpoints: BreakpointSpec[];
        criticalValues: CriticalValue[];
        auditEntry: string;
    } {
        const breakpoints: BreakpointSpec[] = [];
        const criticalValues: CriticalValue[] = [];
        
        // Group options by strike price
        const uniqueStrikePrices = [...new Set(this.options.map(opt => opt.exercisePrice))]
            .filter(price => price > 0.01)
            .sort((a, b) => a - b);
        
        for (const strikePrice of uniqueStrikePrices) {
            const optionsAtStrike = this.options.filter(opt => opt.exercisePrice === strikePrice);
            const totalOptions = optionsAtStrike.reduce((sum, opt) => sum + opt.numOptions, 0);
            
            // Calculate breakpoint where these options become profitable
            const exitValue = this.calculateOptionBreakpoint(strikePrice, totalOptions);
            
            breakpoints.push({
                breakpoint_type: BreakpointType.OPTION_EXERCISE,
                exit_value: new Decimal(exitValue),
                affected_securities: [`Options @ $${strikePrice.toFixed(2)}`],
                calculation_method: 'iterative_option_value_convergence',
                priority_order: 2000 + Math.floor(strikePrice * 100),
                explanation: `Options with strike price $${strikePrice.toFixed(2)} become profitable to exercise`,
                mathematical_derivation: `Share value > Strike price after dilution (${totalOptions} options)`,
                dependencies: []
            });
            
            criticalValues.push({
                value: new Decimal(exitValue),
                description: `Option exercise threshold for $${strikePrice.toFixed(2)} strike`,
                affected_securities: [`${totalOptions} options`],
                triggers: ['option_exercise']
            });
        }
        
        const auditEntry = `OPTION EXERCISE ANALYSIS:
- Strike prices analyzed: ${uniqueStrikePrices.length}
- Total option breakpoints: ${breakpoints.length}
- Price range: $${Math.min(...uniqueStrikePrices).toFixed(2)} - $${Math.max(...uniqueStrikePrices).toFixed(2)}`;
        
        return { breakpoints, criticalValues, auditEntry };
    }
    
    /**
     * Analyze participation cap breakpoints
     */
    private analyzeParticipationCapBreakpoints(): {
        breakpoints: BreakpointSpec[];
        criticalValues: CriticalValue[];
        auditEntry: string;
    } {
        const breakpoints: BreakpointSpec[] = [];
        const criticalValues: CriticalValue[] = [];
        
        const cappedParticipating = this.shareClasses.filter(sc => 
            sc.shareType === 'preferred' && 
            sc.preferenceType === 'participating-with-cap' && 
            sc.participationCap !== null
        );
        
        for (const cappedClass of cappedParticipating) {
            const lpAmount = new Decimal(cappedClass.sharesOutstanding)
                .mul(cappedClass.pricePerShare)
                .mul(cappedClass.lpMultiple);
            const capValue = lpAmount.mul(cappedClass.participationCap!);
            
            // Calculate exit value where cap is reached
            const exitValue = this.calculateCapBreakpoint(cappedClass, capValue);
            
            breakpoints.push({
                breakpoint_type: BreakpointType.PARTICIPATION_CAP,
                exit_value: new Decimal(exitValue),
                affected_securities: [cappedClass.name],
                calculation_method: 'participation_cap_calculation',
                priority_order: 4000 + cappedClass.seniority * 100,
                explanation: `${cappedClass.name} reaches ${cappedClass.participationCap}x participation cap`,
                mathematical_derivation: `Cap = LP × ${cappedClass.participationCap}x = ${capValue.toFixed(2)}`,
                dependencies: ['pro_rata_distribution_start']
            });
            
            criticalValues.push({
                value: new Decimal(exitValue),
                description: `Participation cap reached for ${cappedClass.name}`,
                affected_securities: [cappedClass.name],
                triggers: ['participation_cap_reached']
            });
        }
        
        const auditEntry = `PARTICIPATION CAP ANALYSIS:
- Capped participating classes: ${cappedParticipating.length}
- Cap breakpoints created: ${breakpoints.length}`;
        
        return { breakpoints, criticalValues, auditEntry };
    }
    
    /**
     * Analyze voluntary conversion breakpoints for non-participating preferred
     */
    private analyzeVoluntaryConversionBreakpoints(): {
        breakpoints: BreakpointSpec[];
        criticalValues: CriticalValue[];
        auditEntry: string;
    } {
        const breakpoints: BreakpointSpec[] = [];
        const criticalValues: CriticalValue[] = [];
        
        const nonParticipating = this.shareClasses.filter(sc => 
            sc.shareType === 'preferred' && 
            sc.preferenceType === 'non-participating'
        );
        
        for (const npClass of nonParticipating) {
            const conversionPoint = this.calculateConversionBreakpoint(npClass);
            
            if (conversionPoint > 0) {
                breakpoints.push({
                    breakpoint_type: BreakpointType.VOLUNTARY_CONVERSION,
                    exit_value: new Decimal(conversionPoint),
                    affected_securities: [npClass.name],
                    calculation_method: 'rvps_indifference_analysis',
                    priority_order: 3000 + npClass.seniority * 100,
                    explanation: `${npClass.name} voluntary conversion becomes optimal`,
                    mathematical_derivation: `RVPS on conversion > LP retention value`,
                    dependencies: ['pro_rata_distribution_start']
                });
                
                criticalValues.push({
                    value: new Decimal(conversionPoint),
                    description: `Conversion indifference point for ${npClass.name}`,
                    affected_securities: [npClass.name],
                    triggers: ['voluntary_conversion']
                });
            }
        }
        
        const auditEntry = `VOLUNTARY CONVERSION ANALYSIS:
- Non-participating classes: ${nonParticipating.length}
- Conversion breakpoints: ${breakpoints.length}`;
        
        return { breakpoints, criticalValues, auditEntry };
    }
    
    // Helper methods
    private groupBySeniority(preferredShares: DatabaseShareClass[]): Record<number, DatabaseShareClass[]> {
        const groups: Record<number, DatabaseShareClass[]> = {};
        
        for (const shareClass of preferredShares) {
            const seniority = shareClass.seniority;
            if (!groups[seniority]) groups[seniority] = [];
            groups[seniority].push(shareClass);
        }
        
        return groups;
    }
    
    private getTotalLiquidationPreference(): Decimal {
        return this.shareClasses
            .filter(sc => sc.shareType === 'preferred')
            .reduce((sum, sc) => 
                sum.add(new Decimal(sc.sharesOutstanding).mul(sc.pricePerShare).mul(sc.lpMultiple)), 
                new Decimal(0)
            );
    }
    
    private calculateOptionBreakpoint(strikePrice: number, totalOptions: number): number {
        // Simplified iterative solver for option exercise circularity
        let exitValue = strikePrice * totalOptions * 5;
        let previousValue = 0;
        let iterations = 0;
        const maxIterations = 50;
        const tolerance = 100;
        
        while (Math.abs(exitValue - previousValue) > tolerance && iterations < maxIterations) {
            previousValue = exitValue;
            const totalShares = this.getTotalSharesAtExitValue(exitValue);
            const shareValue = exitValue / totalShares;
            
            if (shareValue > strikePrice) {
                // Options would be exercised, include in calculation
                const optionProceeds = totalOptions * strikePrice;
                exitValue = (exitValue + optionProceeds) / 1.1; // Adjust estimate
            } else {
                exitValue *= 1.2; // Increase estimate
            }
            iterations++;
        }
        
        return Math.max(exitValue, this.getTotalLiquidationPreference().toNumber());
    }
    
    private calculateCapBreakpoint(cappedClass: DatabaseShareClass, capValue: Decimal): number {
        const totalLp = this.getTotalLiquidationPreference();
        const totalShares = this.getTotalSharesAtExitValue(totalLp.toNumber());
        const classShares = new Decimal(cappedClass.sharesOutstanding).mul(cappedClass.conversionRatio);
        const proRataShare = classShares.div(totalShares);
        const lpAmount = new Decimal(cappedClass.sharesOutstanding)
            .mul(cappedClass.pricePerShare)
            .mul(cappedClass.lpMultiple);
        
        // Solve: LP + proRataShare × (exitValue - totalLP) = capValue
        const exitValue = capValue.sub(lpAmount).div(proRataShare).add(totalLp);
        
        return exitValue.toNumber();
    }
    
    private calculateConversionBreakpoint(npClass: DatabaseShareClass): number {
        const lpValue = new Decimal(npClass.sharesOutstanding)
            .mul(npClass.pricePerShare)
            .mul(npClass.lpMultiple);
        const conversionShares = new Decimal(npClass.sharesOutstanding).mul(npClass.conversionRatio);
        const totalLp = this.getTotalLiquidationPreference();
        
        // Estimate where conversion becomes profitable
        const totalShares = this.getTotalSharesAtExitValue(totalLp.toNumber());
        const conversionBreakpoint = lpValue.div(conversionShares.div(totalShares));
        
        return conversionBreakpoint.toNumber();
    }
    
    private getTotalSharesAtExitValue(exitValue: number): number {
        const commonShares = this.shareClasses
            .filter(sc => sc.shareType === 'common')
            .reduce((sum, sc) => sum + sc.sharesOutstanding, 0);
        
        const preferredShares = this.shareClasses
            .filter(sc => sc.shareType === 'preferred')
            .reduce((sum, sc) => sum + (sc.sharesOutstanding * sc.conversionRatio), 0);
        
        return commonShares + preferredShares;
    }
    
    private generateDependencyGraph(breakpoints: BreakpointSpec[]): DependencyMapping[] {
        return breakpoints.map((bp, index) => ({
            breakpoint_id: `bp_${index}`,
            depends_on: bp.dependencies,
            affects: [],
            calculation_order: bp.priority_order
        }));
    }
    
    private calculateMetadata(breakpoints: BreakpointSpec[]): CalculationMetadata {
        const liquidationPreferenceTotal = this.getTotalLiquidationPreference();
        const participationCapsTotal = this.shareClasses
            .filter(sc => sc.participationCap !== null)
            .reduce((sum, sc) => 
                sum.add(new Decimal(sc.sharesOutstanding).mul(sc.pricePerShare).mul(sc.participationCap!)), 
                new Decimal(0)
            );
        
        const optionExerciseThresholds = [...new Set(this.options.map(opt => opt.exercisePrice))]
            .map(price => new Decimal(price));
        
        const complexityScore = 
            this.shareClasses.filter(sc => sc.shareType === 'preferred').length * 10 +
            this.options.length * 2 +
            this.shareClasses.filter(sc => sc.participationCap !== null).length * 5;
        
        return {
            total_breakpoints: breakpoints.length,
            liquidation_preference_total: liquidationPreferenceTotal,
            participation_caps_total: participationCapsTotal,
            option_exercise_thresholds: optionExerciseThresholds,
            complexity_score: complexityScore,
            analysis_timestamp: new Date(),
            audit_trail: this.audit_trail
        };
    }
}