/**
 * API Routes pour la gestion d'un workflow spécifique
 * Phase 5: Système de versions et workflow d'approbation
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApprovalWorkflowService } from '@/documents/application/services/ApprovalWorkflowService';
import { logger } from '@/lib/logger';

const workflowService = new ApprovalWorkflowService();

/**
 * GET /api/admin/documents/workflows/[id]
 * Récupère un workflow spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    
    logger.info('🔄 Récupération d\'un workflow spécifique', { workflowId });

    const workflow = await workflowService.getWorkflowById(workflowId);

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { workflow }
    });

  } catch (error) {
    logger.error('❌ Erreur lors de la récupération du workflow', error as Error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération du workflow',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/documents/workflows/[id]
 * Met à jour un workflow spécifique
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    const body = await request.json();
    
    logger.info('📝 Mise à jour d\'un workflow', { workflowId });

    const updatedWorkflow = await workflowService.updateWorkflow(workflowId, {
      name: body.name,
      description: body.description,
      steps: body.steps,
      activationConditions: body.activationConditions,
      isActive: body.isActive,
      isDefault: body.isDefault,
      priority: body.priority,
      tags: body.tags,
      metadata: body.metadata
    });

    return NextResponse.json({
      success: true,
      data: { workflow: updatedWorkflow },
      message: `Workflow "${updatedWorkflow.name}" mis à jour avec succès`
    });

  } catch (error) {
    logger.error('❌ Erreur lors de la mise à jour du workflow', error as Error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la mise à jour du workflow',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/documents/workflows/[id]
 * Supprime un workflow spécifique
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    
    logger.info('🗑️ Suppression d\'un workflow', { workflowId });

    const success = await workflowService.deleteWorkflow(workflowId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer le workflow' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Workflow supprimé avec succès'
    });

  } catch (error) {
    logger.error('❌ Erreur lors de la suppression du workflow', error as Error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la suppression du workflow',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/documents/workflows/[id]
 * Actions spécifiques sur un workflow (activer, désactiver, définir par défaut)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    const body = await request.json();
    const { action } = body;
    
    logger.info('🔄 Action sur workflow', { workflowId, action });

    switch (action) {
      case 'set_active':
        return await handleSetActive(workflowId, body.isActive);
        
      case 'set_default':
        return await handleSetDefault(workflowId);
        
      case 'duplicate':
        return await handleDuplicate(workflowId, body.newName);
        
      case 'validate':
        return await handleValidate(workflowId);
        
      default:
        return NextResponse.json(
          { success: false, error: 'Action non reconnue' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('❌ Erreur lors de l\'action sur le workflow', error as Error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de l\'action sur le workflow',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * Active ou désactive un workflow
 */
async function handleSetActive(workflowId: string, isActive: boolean) {
  const success = await workflowService.setWorkflowActive(workflowId, isActive);
  
  if (!success) {
    return NextResponse.json(
      { success: false, error: 'Impossible de modifier le statut du workflow' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Workflow ${isActive ? 'activé' : 'désactivé'} avec succès`
  });
}

/**
 * Définit un workflow comme workflow par défaut
 */
async function handleSetDefault(workflowId: string) {
  const success = await workflowService.setAsDefault(workflowId);
  
  if (!success) {
    return NextResponse.json(
      { success: false, error: 'Impossible de définir le workflow par défaut' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Workflow défini comme par défaut avec succès'
  });
}

/**
 * Duplique un workflow
 */
async function handleDuplicate(workflowId: string, newName: string) {
  if (!newName) {
    return NextResponse.json(
      { success: false, error: 'Le nom du nouveau workflow est requis' },
      { status: 400 }
    );
  }

  const duplicatedWorkflow = await workflowService.cloneWorkflow(workflowId, newName);

  return NextResponse.json({
    success: true,
    data: { workflow: duplicatedWorkflow },
    message: `Workflow dupliqué sous le nom "${newName}"`
  });
}

/**
 * Valide la configuration d'un workflow
 */
async function handleValidate(workflowId: string) {
  const workflow = await workflowService.getWorkflowById(workflowId);
  
  if (!workflow) {
    return NextResponse.json(
      { success: false, error: 'Workflow non trouvé' },
      { status: 404 }
    );
  }

  const validation = workflowService.validateWorkflowConfiguration(workflow);

  return NextResponse.json({
    success: true,
    data: { validation },
    message: validation.isValid ? 
      'Workflow valide' : 
      `Workflow invalide: ${validation.errors.join(', ')}`
  });
}