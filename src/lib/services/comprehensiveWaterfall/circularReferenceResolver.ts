import Decimal from 'decimal.js';
import { CapTable, CircularResolutionResult } from './dataStructures';

export class CircularReferenceResolver {
    
    /**
     * Resolve circular references in waterfall calculations
     */
    static resolveCircularReferences(
        cap_table: CapTable,
        net_proceeds: Decimal,
        max_iterations: number = 100,
        convergence_threshold: Decimal = new Decimal(0.01)
    ): CircularResolutionResult {
        
        let current_price_per_share = new Decimal(1.0);
        const exercised_options: { [key: string]: Decimal } = {};
        let iteration_count = 0;
        let convergence_achieved = false;
        
        // Initialize exercised options
        cap_table.option_pools.forEach(pool => {
            exercised_options[pool.pool_name] = new Decimal(0);
        });
        
        // Iterative convergence process (simplified)
        for (iteration_count = 0; iteration_count < max_iterations; iteration_count++) {
            const previous_price = current_price_per_share;
            
            // Recalculate price per share based on current exercise decisions
            const total_shares = cap_table.common_stock_shares.add(
                Object.values(exercised_options).reduce((sum, shares) => sum.add(shares), new Decimal(0))
            );
            
            if (total_shares.gt(0)) {
                current_price_per_share = net_proceeds.div(total_shares);
            }
            
            // Update option exercise decisions
            cap_table.option_pools.forEach(pool => {
                if (current_price_per_share.gt(pool.strike_price)) {
                    exercised_options[pool.pool_name] = pool.exercisable_shares;
                } else {
                    exercised_options[pool.pool_name] = new Decimal(0);
                }
            });
            
            // Check convergence
            const price_change = current_price_per_share.sub(previous_price).abs();
            if (price_change.lt(convergence_threshold)) {
                convergence_achieved = true;
                break;
            }
        }
        
        return {
            final_price_per_share: current_price_per_share,
            exercised_options,
            iteration_count: iteration_count + 1,
            convergence_achieved,
            mathematical_verification: `Converged to $${current_price_per_share.toFixed(6)} per share after ${iteration_count + 1} iterations`
        };
    }
}