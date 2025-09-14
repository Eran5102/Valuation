import Decimal from 'decimal.js';
import { WaterfallInput } from './dataStructures';

export interface NetProceedsResult {
    gross_proceeds: Decimal;
    transaction_expenses: Decimal;
    net_proceeds: Decimal;
    expense_categories: ExpenseBreakdown[];
    validation_status: ValidationResult;
}

export interface ExpenseBreakdown {
    category: string;
    amount: Decimal;
    percentage_of_gross: Decimal;
    description: string;
}

export interface ValidationResult {
    is_valid: boolean;
    warnings: string[];
    errors: string[];
    confidence_level: string;
}

export class NetProceedsCalculator {
    
    /**
     * Calculate net proceeds with comprehensive validation and breakdown
     */
    static calculateNetProceeds(input: WaterfallInput): NetProceedsResult {
        const gross_proceeds = input.gross_proceeds;
        const transaction_expenses = input.transaction_expenses;
        
        // Validate input parameters
        const validation = this.validateInputs(gross_proceeds, transaction_expenses);
        
        // Calculate net proceeds
        const net_proceeds = gross_proceeds.sub(transaction_expenses);
        
        // Break down expenses by category (if detailed breakdown provided)
        const expense_categories = this.categorizeExpenses(transaction_expenses);
        
        return {
            gross_proceeds,
            transaction_expenses,
            net_proceeds,
            expense_categories,
            validation_status: validation
        };
    }
    
    /**
     * Validate gross proceeds and transaction expenses
     */
    private static validateInputs(
        gross_proceeds: Decimal, 
        transaction_expenses: Decimal
    ): ValidationResult {
        const warnings: string[] = [];
        const errors: string[] = [];
        
        // Basic validation
        if (gross_proceeds.lte(0)) {
            errors.push("Gross proceeds must be positive");
        }
        
        if (transaction_expenses.lt(0)) {
            errors.push("Transaction expenses cannot be negative");
        }
        
        if (transaction_expenses.gte(gross_proceeds)) {
            errors.push("Transaction expenses exceed gross proceeds");
        }
        
        // Warning thresholds
        const expense_ratio = transaction_expenses.div(gross_proceeds);
        
        if (expense_ratio.gt(0.15)) {
            warnings.push(`Transaction expenses are ${expense_ratio.mul(100).toFixed(1)}% of gross proceeds (>15% threshold)`);
        }
        
        if (expense_ratio.gt(0.25)) {
            warnings.push("Unusually high transaction expenses - verify accuracy");
        }
        
        // Net proceeds validation
        const net_proceeds = gross_proceeds.sub(transaction_expenses);
        if (net_proceeds.lte(0)) {
            errors.push("Net proceeds must be positive after expenses");
        }
        
        // Confidence level determination
        let confidence_level: string;
        if (errors.length > 0) {
            confidence_level = "invalid";
        } else if (warnings.length > 2) {
            confidence_level = "low";
        } else if (warnings.length > 0) {
            confidence_level = "medium";
        } else {
            confidence_level = "high";
        }
        
        return {
            is_valid: errors.length === 0,
            warnings,
            errors,
            confidence_level
        };
    }
    
    /**
     * Categorize transaction expenses (placeholder for future enhancement)
     */
    private static categorizeExpenses(total_expenses: Decimal): ExpenseBreakdown[] {
        // For now, return as single category
        // Future enhancement: accept detailed expense breakdown
        return [{
            category: "Total Transaction Expenses",
            amount: total_expenses,
            percentage_of_gross: new Decimal(100),
            description: "Aggregate transaction costs including legal, banking, and advisory fees"
        }];
    }
    
    /**
     * Format net proceeds result for display
     */
    static formatResult(result: NetProceedsResult): string {
        const lines: string[] = [];
        
        lines.push(`Gross Proceeds: $${result.gross_proceeds.toFixed(2)}`);
        lines.push(`Transaction Expenses: ($${result.transaction_expenses.toFixed(2)})`);
        lines.push(`Net Proceeds: $${result.net_proceeds.toFixed(2)}`);
        lines.push("");
        
        if (result.validation_status.warnings.length > 0) {
            lines.push("Warnings:");
            result.validation_status.warnings.forEach(w => lines.push(`- ${w}`));
            lines.push("");
        }
        
        if (result.validation_status.errors.length > 0) {
            lines.push("Errors:");
            result.validation_status.errors.forEach(e => lines.push(`- ${e}`));
            lines.push("");
        }
        
        lines.push(`Validation Status: ${result.validation_status.confidence_level.toUpperCase()}`);
        
        return lines.join("\n");
    }
}