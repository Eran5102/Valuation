import { NextRequest, NextResponse } from 'next/server';
import { TemplateDataMapper } from '@/lib/templates/templateDataMapper';

export async function GET() {
  try {
    const mapper = TemplateDataMapper.getInstance();
    const fieldMappings = mapper.getFieldMappings();

    return NextResponse.json({
      success: true,
      data: fieldMappings,
      count: Object.keys(fieldMappings).length
    });
  } catch (error) {
    console.error('Error getting field mappings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get field mappings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fieldId, mapping } = body;

    if (!fieldId || !mapping) {
      return NextResponse.json(
        { success: false, error: 'fieldId and mapping are required' },
        { status: 400 }
      );
    }

    // Validate mapping structure
    const requiredFields = ['sourceModule', 'sourcePath'];
    const validSourceModules = ['assumptions', 'company', 'valuation', 'capTable', 'dlom', 'calculated', 'manual'];

    for (const field of requiredFields) {
      if (!mapping[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    if (!validSourceModules.includes(mapping.sourceModule)) {
      return NextResponse.json(
        { success: false, error: `Invalid sourceModule. Must be one of: ${validSourceModules.join(', ')}` },
        { status: 400 }
      );
    }

    const mapper = TemplateDataMapper.getInstance();
    mapper.registerFieldMapping(fieldId, mapping);

    return NextResponse.json({
      success: true,
      message: `Field mapping '${fieldId}' added successfully`,
      data: { fieldId, mapping }
    });
  } catch (error) {
    console.error('Error adding field mapping:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add field mapping' },
      { status: 500 }
    );
  }
}