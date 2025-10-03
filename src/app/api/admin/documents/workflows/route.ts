/**
 * API Routes pour la gestion des workflows d'approbation
 * Phase 5: Système de versions et workflow d'approbation
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApprovalWorkflowService } from '@/documents/application/services/ApprovalWorkflowService';
import { logger } from '@/lib/logger';

const workflowService = new ApprovalWorkflowService();

/**
 * GET /api/admin/documents/workflows
 * Récupère la liste des workflows selon les critères
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const criteria = {
      type: (searchParams.get('type') as any) || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : 
               searchParams.get('isActive') === 'false' ? false : undefined,
      isDefault: searchParams.get('isDefault') === 'true' ? true :
               searchParams.get('isDefault') === 'false' ? false : undefined,
      name: searchParams.get('name') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      createdBy: searchParams.get('createdBy') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'priority',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc'
    };

    logger.info('🔄 Récupération des workflows d\'approbation', { criteria });

    const workflows = await workflowService.searchWorkflows(criteria);
    const stats = await workflowService.getWorkflowStatistics();

    return NextResponse.json({
      success: true,
      data: {
        workflows,
        statistics: stats,
        criteria
      }
    });

  } catch (error) {
    logger.error('❌ Erreur lors de la récupération des workflows', error as Error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des workflows',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/documents/workflows
 * Actions sur les workflows d'approbation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create':
        return await handleCreateWorkflow(data);
      
      case 'clone':
        return await handleCloneWorkflow(data);
        
      case 'create_defaults':
        return await handleCreateDefaultWorkflows();
        
      case 'test':
        return await handleTestWorkflow(data);
        
      case 'find_best':
        return await handleFindBestWorkflow(data);
        
      default:
        return NextResponse.json(
          { success: false, error: 'Action non reconnue' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('❌ Erreur dans POST /api/admin/documents/workflows', error as Error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du traitement de la requête',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * Gère la création d'un nouveau workflow
 */
async function handleCreateWorkflow(data: any) {
  logger.info('🆕 Création d\'un nouveau workflow', { 
    name: data.name,
    type: data.type 
  });

  const workflow = await workflowService.createWorkflow({
    name: data.name,
    description: data.description,
    type: data.type,
    steps: data.steps,
    activationConditions: data.activationConditions || [],
    isDefault: data.isDefault || false,
    priority: data.priority || 0,
    tags: data.tags || [],
    metadata: data.metadata || {}
  });

  return NextResponse.json({
    success: true,
    data: { workflow },
    message: `Workflow "${workflow.name}" créé avec succès`
  });
}

/**
 * Gère le clonage d'un workflow existant
 */
async function handleCloneWorkflow(data: { workflowId: string; newName: string }) {
  logger.info('📋 Clonage d\'un workflow', { 
    workflowId: data.workflowId, 
    newName: data.newName 
  });

  const clonedWorkflow = await workflowService.cloneWorkflow(
    data.workflowId, 
    data.newName
  );

  return NextResponse.json({
    success: true,
    data: { workflow: clonedWorkflow },
    message: `Workflow "${clonedWorkflow.name}" cloné avec succès`
  });
}

/**
 * Gère la création des workflows par défaut
 */
async function handleCreateDefaultWorkflows() {
  logger.info('🏗️ Création des workflows par défaut');

  const defaultWorkflows = await workflowService.createDefaultWorkflows();

  return NextResponse.json({
    success: true,
    data: { workflows: defaultWorkflows, count: defaultWorkflows.length },
    message: `${defaultWorkflows.length} workflows par défaut créés`
  });
}

/**
 * Gère le test d'un workflow contre un contexte
 */
async function handleTestWorkflow(data: {
  workflowId: string;
  context: {
    documentType: string;
    amount: number;
    impactLevel: string;
    templateChanged: boolean;
    customerType: string;
    customData?: Record<string, any>;
  };
}) {
  logger.info('🧪 Test de workflow', { 
    workflowId: data.workflowId,
    context: data.context 
  });

  const testResult = await workflowService.testWorkflow(
    data.workflowId,
    data.context
  );

  return NextResponse.json({
    success: true,
    data: { testResult },
    message: 'Test de workflow effectué avec succès'
  });
}

/**
 * Gère la recherche du meilleur workflow pour un contexte
 */
async function handleFindBestWorkflow(data: {
  context: {
    documentType: string;
    amount: number;
    impactLevel: string;
    templateChanged: boolean;
    customerType: string;
    customData?: Record<string, any>;
  };
}) {
  logger.info('🔍 Recherche du meilleur workflow', { context: data.context });

  const bestWorkflow = await workflowService.findBestWorkflowForContext(data.context);

  if (!bestWorkflow) {
    return NextResponse.json({
      success: false,
      error: 'Aucun workflow trouvé pour ce contexte'
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: { workflow: bestWorkflow },
    message: 'Meilleur workflow trouvé'
  });
}