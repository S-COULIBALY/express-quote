import { NextRequest, NextResponse } from 'next/server';
import { ConfigurationController } from '@/quotation/interfaces/http/controllers/ConfigurationController';
import { container } from '@/quotation/application/container';
import { ConfigurationCategory } from '@/quotation/domain/configuration/ConfigurationKey';

const configController = container.resolve(ConfigurationController);

export async function GET(request: NextRequest) {
  try {
    const response = await configController.getConfigurations(new NextRequest(request.url, {
      ...request,
      body: JSON.stringify({ category: ConfigurationCategory.RECIPIENTS })
    }));
    return response;
  } catch (error) {
    console.error('Error getting recipients config:', error);
    return NextResponse.json(
      { error: 'Failed to get recipients configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await configController.setValue(new NextRequest(request.url, {
      ...request,
      body: JSON.stringify({ 
        ...body,
        category: ConfigurationCategory.RECIPIENTS 
      })
    }));
    return response;
  } catch (error) {
    console.error('Error updating recipients config:', error);
    return NextResponse.json(
      { error: 'Failed to update recipients configuration' },
      { status: 500 }
    );
  }
}

