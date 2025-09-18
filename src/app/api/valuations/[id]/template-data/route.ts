import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database/jsonDb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    // Fetch valuation data from JSON database
    const valuation = db.getValuationById(id);

    if (!valuation) {
      return NextResponse.json({ error: 'Valuation not found' }, { status: 404 });
    }

    // Fetch company data from JSON database
    const company = db.getCompanyById(valuation.companyId);

    // Create mock data for template variables since full schema isn't available
    const managementTeam = [
      { name: 'John Smith', title: 'CEO' },
      { name: 'Jane Doe', title: 'CTO' },
      { name: 'Mike Johnson', title: 'CFO' },
      { name: 'Sarah Wilson', title: 'VP Engineering' }
    ];

    const capTable = [
      { investors: { name: 'Acme Ventures' } },
      { investors: { name: 'TechStart Capital' } },
      { investors: { name: 'Innovation Fund' } },
      { investors: { name: 'Growth Partners' } }
    ];

    // Transform data to match template variable schema
    const templateData = {
      company: {
        name: company?.name || 'TechStart Inc.',
        description: company?.description || 'A cutting-edge technology startup focused on AI-driven solutions for enterprise clients.',
        incorporation_year: company?.year_of_incorporation || new Date().getFullYear(),
        headquarters: company?.headquarters_location || 'San Francisco, CA',
        business_model: company?.business_model || 'B2B SaaS',
        market_description: company?.market_description || 'Enterprise software market with focus on AI automation.',
        stage_of_development: company?.stage_of_development || 'Growth Stage',
        stage_description: company?.stage_description || 'Established product with growing customer base and recurring revenue.',
        products: company?.products_description || 'AI-powered automation platform for enterprise workflow optimization.'
      },
      valuation: {
        date: valuation.valuationDate,
        security_type: 'Common Stock',
        fair_market_value: valuation.fairMarketValue || 5.25,
        expiration_date: new Date(new Date(valuation.valuationDate).setFullYear(new Date(valuation.valuationDate).getFullYear() + 1)).toISOString().split('T')[0],
        backsolve_equity_value: 50000000,
        volatility: 0.45,
        time_to_liquidity: 3,
        risk_free_rate: 0.045,
        weighted_equity_value: 48000000,
        volatility_source: 'Guideline Public Company Analysis',
        volatility_industry: 'Technology',
        volatility_geography: 'United States'
      },
      management: {
        member_1_name: managementTeam?.[0]?.name || '',
        member_1_title: managementTeam?.[0]?.title || '',
        member_2_name: managementTeam?.[1]?.name || '',
        member_2_title: managementTeam?.[1]?.title || '',
        member_3_name: managementTeam?.[2]?.name || '',
        member_3_title: managementTeam?.[2]?.title || '',
        member_4_name: managementTeam?.[3]?.name || '',
        member_4_title: managementTeam?.[3]?.title || ''
      },
      financing: {
        last_round_date: valuation.valuationDate,
        last_round_security: 'Series A Preferred Stock',
        last_round_pps: 8.50
      },
      dlom: {
        chaffe_weight: 0.5,
        chaffe_dlom: 0.15,
        finnerty_weight: 0.5,
        finnerty_dlom: 0.20,
        concluded_dlom: 0.175,
        ghaidarov_weight: 0,
        ghaidarov_dlom: 0,
        longstaff_weight: 0,
        longstaff_dlom: 0,
        market_studies_weight: 0,
        market_studies_dlom: 0
      },
      investors: {
        investor_1: capTable?.[0]?.investors?.name || '',
        investor_2: capTable?.[1]?.investors?.name || '',
        investor_3: capTable?.[2]?.investors?.name || '',
        investor_4: capTable?.[3]?.investors?.name || ''
      },
      designee: {
        first_name: 'John',
        last_name: 'Doe',
        title: 'Chief Executive Officer',
        prefix: 'Mr.'
      },
      appraiser: {
        first_name: 'Value8',
        last_name: 'AI',
        title: 'Senior Valuation Analyst',
        bio: 'Value8.AI is a leading provider of automated 409A valuations, leveraging advanced artificial intelligence to deliver accurate, defensible valuations for private companies. Our team combines deep expertise in valuation methodology with cutting-edge technology to provide fast, reliable, and cost-effective valuation services.'
      },
      engagement: {
        letter_date: valuation.valuationDate
      },
      report: {
        date: new Date().toISOString().split('T')[0]
      },
      custom: {
        content: 'Based on our analysis of the Company\'s business model, market position, and financial performance, we believe the valuation appropriately reflects the current fair market value of the common stock.'
      },
      capital_structure: {
        table_rows: '' // This would need to be populated with actual cap table data
      }
    };

    return NextResponse.json({ data: templateData });
  } catch (error) {
    console.error('Error generating template data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}