/**
 * API Routes pour la gestion des versions de documents
 * Phase 5: Système de versions et workflow d'approbation
 */

import { NextRequest, NextResponse } from 'next/server';
import { DocumentVersionService } from '@/documents/application/services/DocumentVersionService';
import { logger } from '@/lib/logger';

const versionService = new DocumentVersionService();

/**
 * GET /api/admin/documents/versions
 * Récupère la liste des versions selon les critères
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const criteria = {
      documentId: searchParams.get('documentId') || undefined,
      templateId: searchParams.get('templateId') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      createdBy: searchParams.get('createdBy') || undefined,
      approvedBy: searchParams.get('approvedBy') || undefined,
      versionNumber: searchParams.get('versionNumber') || undefined,
      impactLevel: searchParams.get('impactLevel') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc'
    };

    // Gestion de la plage de dates
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
      criteria['dateRange'] = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    logger.info('📋 Récupération des versions de documents', { criteria });

    const versions = await versionService.searchVersions(criteria);
    const stats = await versionService.getVersionStatistics();

    return NextResponse.json({
      success: true,
      data: {
        versions,
        statistics: stats,
        criteria
      }
    });

  } catch (error) {
    logger.error('❌ Erreur lors de la récupération des versions', error as Error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des versions',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/documents/versions
 * Actions sur les versions de documents
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create':
        return await handleCreateVersion(data);
      
      case 'submit_for_approval':
        return await handleSubmitForApproval(data);
        
      case 'approve':
        return await handleApproveVersion(data);
        
      case 'reject':
        return await handleRejectVersion(data);
        
      case 'publish':
        return await handlePublishVersion(data);
        
      case 'compare':
        return await handleCompareVersions(data);
        
      case 'rollback':
        return await handleRollbackVersion(data);
        
      default:
        return NextResponse.json(
          { success: false, error: 'Action non reconnue' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('❌ Erreur dans POST /api/admin/documents/versions', error as Error);
    
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
 * Gère la création d'une nouvelle version
 */
async function handleCreateVersion(data: any) {
  logger.info('🆕 Création d\'une nouvelle version', { documentId: data.documentId });

  // Décoder le contenu base64 si nécessaire
  let content = data.content;
  if (typeof content === 'string') {
    content = Buffer.from(content, 'base64');
  }

  const version = await versionService.createVersion({
    documentId: data.documentId,
    templateId: data.templateId,
    content,
    versionNumber: data.versionNumber,
    metadata: data.metadata,
    createdBy: data.createdBy,
    workflowId: data.workflowId,
    customData: data.customData
  });

  return NextResponse.json({
    success: true,
    data: { version },
    message: `Version ${version.versionNumber} créée avec succès`
  });
}

/**
 * Gère la soumission pour approbation
 */
async function handleSubmitForApproval(data: { versionId: string }) {
  logger.info('📋 Soumission pour approbation', { versionId: data.versionId });

  const version = await versionService.submitForApproval(data.versionId);

  return NextResponse.json({
    success: true,
    data: { version },
    message: 'Version soumise pour approbation avec succès'
  });
}

/**
 * Gère l'approbation d'une version
 */
async function handleApproveVersion(data: {
  versionId: string;
  approverId: string;
  approverName: string;
  comments?: string;
  conditions?: string[];
}) {
  logger.info('✅ Approbation de version', { 
    versionId: data.versionId,
    approverId: data.approverId 
  });

  const version = await versionService.approveVersion({
    versionId: data.versionId,
    approverId: data.approverId,
    approverName: data.approverName,
    comments: data.comments,
    conditions: data.conditions
  });

  return NextResponse.json({
    success: true,
    data: { version },
    message: 'Version approuvée avec succès'
  });
}

/**
 * Gère le rejet d'une version
 */
async function handleRejectVersion(data: {
  versionId: string;
  rejectedBy: string;
  rejectedByName: string;
  reason: string;
}) {
  logger.info('❌ Rejet de version', { 
    versionId: data.versionId,
    rejectedBy: data.rejectedBy 
  });

  const version = await versionService.rejectVersion({
    versionId: data.versionId,
    rejectedBy: data.rejectedBy,
    rejectedByName: data.rejectedByName,
    reason: data.reason
  });

  return NextResponse.json({
    success: true,
    data: { version },
    message: 'Version rejetée'
  });
}

/**
 * Gère la publication d'une version
 */
async function handlePublishVersion(data: { versionId: string }) {
  logger.info('🚀 Publication de version', { versionId: data.versionId });

  const version = await versionService.publishVersion(data.versionId);

  return NextResponse.json({
    success: true,
    data: { version },
    message: `Version ${version.versionNumber} publiée avec succès`
  });
}

/**
 * Gère la comparaison de versions
 */
async function handleCompareVersions(data: {
  version1Id: string;
  version2Id: string;
}) {
  logger.info('🔄 Comparaison de versions', {
    version1Id: data.version1Id,
    version2Id: data.version2Id
  });

  const comparison = await versionService.compareVersions(
    data.version1Id,
    data.version2Id
  );

  return NextResponse.json({
    success: true,
    data: { comparison },
    message: 'Comparaison effectuée avec succès'
  });
}

/**
 * Gère le rollback vers une version précédente
 */
async function handleRollbackVersion(data: {
  documentId: string;
  targetVersionId: string;
  rollbackBy: string;
}) {
  logger.info('🔄 Rollback vers version précédente', {
    documentId: data.documentId,
    targetVersionId: data.targetVersionId
  });

  const version = await versionService.rollbackToVersion(
    data.documentId,
    data.targetVersionId,
    data.rollbackBy
  );

  return NextResponse.json({
    success: true,
    data: { version },
    message: 'Rollback effectué avec succès'
  });
}