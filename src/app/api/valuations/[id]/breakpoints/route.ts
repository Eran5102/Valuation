import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    BreakpointAnalyzer,
    DatabaseShareClass,
    DatabaseOption,
    BreakpointAnalysisResult
} from '@/lib/services/comprehensiveWaterfall/breakpointAnalyzerV2';

// GET /api/valuations/[id]/breakpoints - Get breakpoint analysis for valuation
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const supabase = await createClient();

        const { data: valuation, error } = await supabase
            .from('valuations')
            .select('id, company_id, cap_table')
            .eq('id', idParam)
            .single();

        if (error || !valuation) {
            return NextResponse.json(
                { error: 'Valuation not found' },
                { status: 404 }
            );
        }

        // Get cap table data from the valuation
        let shareClasses: DatabaseShareClass[] = [];
        let options: DatabaseOption[] = [];

        if (valuation.cap_table && valuation.cap_table.shareClasses) {
            // Transform cap table share classes to our database format
            shareClasses = valuation.cap_table.shareClasses.map((sc: any) => ({
                id: sc.id,
                companyId: valuation.company_id,
                shareType: sc.shareType,
                name: sc.name,
                roundDate: sc.roundDate,
                sharesOutstanding: sc.sharesOutstanding,
                pricePerShare: sc.pricePerShare,
                preferenceType: sc.preferenceType,
                lpMultiple: sc.lpMultiple,
                seniority: sc.seniority,
                participationCap: sc.participationCap,
                conversionRatio: sc.conversionRatio,
                dividendsDeclared: sc.dividendsDeclared,
                dividendsRate: sc.dividendsRate,
                dividendsType: sc.dividendsType,
                pik: sc.pik
            }));

            options = valuation.cap_table.options || [];
        }

        // Perform breakpoint analysis using V2 analyzer
        const analyzer = new BreakpointAnalyzer(shareClasses, options);
        const analysisResult: BreakpointAnalysisResult = analyzer.analyzeCompleteBreakpointStructure();

        // Convert Decimal objects to numbers for JSON serialization
        const serializedResult = {
            totalBreakpoints: analysisResult.totalBreakpoints,
            breakpointsByType: analysisResult.breakpointsByType,
            sortedBreakpoints: analysisResult.sortedBreakpoints.map(bp => ({
                breakpointType: bp.breakpointType,
                exitValue: bp.exitValue.toNumber(),
                affectedSecurities: bp.affectedSecurities,
                calculationMethod: bp.calculationMethod,
                priorityOrder: bp.priorityOrder,
                explanation: bp.explanation,
                mathematicalDerivation: bp.mathematicalDerivation,
                dependencies: bp.dependencies
            })),
            criticalValues: analysisResult.criticalValues.map(cv => ({
                value: cv.value.toNumber(),
                description: cv.description,
                affectedSecurities: cv.affectedSecurities,
                triggers: cv.triggers
            })),
            auditSummary: analysisResult.auditSummary,
            validationResults: analysisResult.validationResults,
            performanceMetrics: analysisResult.performanceMetrics
        };

        return NextResponse.json({
            success: true,
            data: serializedResult,
            valuation_id: valuation.id,
            company_id: valuation.company_id,
            analysis_timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error performing breakpoint analysis:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to perform breakpoint analysis',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// POST /api/valuations/[id]/breakpoints - Force refresh breakpoint analysis
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const body = await request.json();
        const supabase = await createClient();

        const { data: valuation, error } = await supabase
            .from('valuations')
            .select('id, company_id, cap_table')
            .eq('id', idParam)
            .single();

        if (error || !valuation) {
            return NextResponse.json(
                { error: 'Valuation not found' },
                { status: 404 }
            );
        }

        // Optional: Accept custom parameters for analysis
        const {
            includeOptions = true,
            customExitValues = [],
            analysisType = 'comprehensive'
        } = body;

        // Get the most current cap table data
        let shareClasses: DatabaseShareClass[] = [];
        let options: DatabaseOption[] = [];

        if (valuation.cap_table && valuation.cap_table.shareClasses) {
            shareClasses = valuation.cap_table.shareClasses.map((sc: any) => ({
                id: sc.id,
                companyId: valuation.company_id,
                shareType: sc.shareType,
                name: sc.name,
                roundDate: sc.roundDate,
                sharesOutstanding: sc.sharesOutstanding,
                pricePerShare: sc.pricePerShare,
                preferenceType: sc.preferenceType,
                lpMultiple: sc.lpMultiple,
                seniority: sc.seniority,
                participationCap: sc.participationCap,
                conversionRatio: sc.conversionRatio,
                dividendsDeclared: sc.dividendsDeclared,
                dividendsRate: sc.dividendsRate,
                dividendsType: sc.dividendsType,
                pik: sc.pik
            }));

            if (includeOptions) {
                options = valuation.cap_table.options || [];
            }
        }

        // Perform fresh analysis using V2 analyzer
        const analyzer = new BreakpointAnalyzer(shareClasses, options);
        const analysisResult: BreakpointAnalysisResult = analyzer.analyzeCompleteBreakpointStructure();

        // Convert Decimal objects to numbers for JSON serialization
        const serializedResult = {
            totalBreakpoints: analysisResult.totalBreakpoints,
            breakpointsByType: analysisResult.breakpointsByType,
            sortedBreakpoints: analysisResult.sortedBreakpoints.map(bp => ({
                breakpointType: bp.breakpointType,
                exitValue: bp.exitValue.toNumber(),
                affectedSecurities: bp.affectedSecurities,
                calculationMethod: bp.calculationMethod,
                priorityOrder: bp.priorityOrder,
                explanation: bp.explanation,
                mathematicalDerivation: bp.mathematicalDerivation,
                dependencies: bp.dependencies
            })),
            criticalValues: analysisResult.criticalValues.map(cv => ({
                value: cv.value.toNumber(),
                description: cv.description,
                affectedSecurities: cv.affectedSecurities,
                triggers: cv.triggers
            })),
            auditSummary: analysisResult.auditSummary,
            validationResults: analysisResult.validationResults,
            performanceMetrics: analysisResult.performanceMetrics
        };

        return NextResponse.json({
            success: true,
            data: serializedResult,
            valuation_id: valuation.id,
            company_id: valuation.company_id,
            analysis_timestamp: new Date().toISOString(),
            analysis_parameters: {
                includeOptions,
                customExitValues,
                analysisType
            }
        });

    } catch (error) {
        console.error('Error performing fresh breakpoint analysis:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to perform breakpoint analysis',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}