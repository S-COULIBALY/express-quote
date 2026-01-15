import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Types
type WhatsAppConfigDTO = any;
type TemplateConfigDTO = any;
type DocumentConfigDTO = any;

// Logger simplifié
const logger = {
  info: (msg: string, ...args: any[]) => console.info('[WhatsAppConfigAPI]', msg, ...args),
  error: (msg: string | Error, ...args: any[]) => console.error('[WhatsAppConfigAPI]', msg, ...args)
};

// GET - Récupérer la configuration actuelle
export async function GET() {
  try {
    const config = await prisma.configuration.findFirst({
      where: {
        category: 'whatsapp',
        key: 'whatsapp_config',
        isActive: true
      }
    });

    return NextResponse.json(config?.value || null);
  } catch (error) {
    logger.error('Erreur lors de la récupération de la configuration:', error);

    return NextResponse.json(
      {
        error: 'Erreur lors de la récupération de la configuration',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// POST - Mettre à jour la configuration complète
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data) {
      return NextResponse.json(
        { error: 'Aucune donnée fournie' },
        { status: 400 }
      );
    }

    const updated = await prisma.configuration.upsert({
      where: {
        category_key: {
          category: 'whatsapp',
          key: 'whatsapp_config'
        }
      },
      update: {
        value: data as any,
        updatedAt: new Date()
      },
      create: {
        id: crypto.randomUUID(),
        category: 'whatsapp',
        key: 'whatsapp_config',
        value: data as any,
        isActive: true,
        validFrom: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuration WhatsApp sauvegardée avec succès',
      config: updated.value
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour de la configuration:', error);

    return NextResponse.json(
      {
        error: 'Erreur lors de la mise à jour de la configuration',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour une partie spécifique de la configuration
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.operation) {
      return NextResponse.json(
        { error: 'Opération non spécifiée' },
        { status: 400 }
      );
    }

    // Récupérer la config actuelle
    const currentConfig = await prisma.configuration.findFirst({
      where: {
        category: 'whatsapp',
        key: 'whatsapp_config',
        isActive: true
      }
    });

    const configValue = (currentConfig?.value as any) || {};
    let updatedValue = { ...configValue };

    switch (data.operation) {
      case 'updateTemplate':
        updatedValue.templates = updatedValue.templates || [];
        const templateIndex = updatedValue.templates.findIndex((t: any) => t.id === data.template.id);
        if (templateIndex >= 0) {
          updatedValue.templates[templateIndex] = data.template;
        } else {
          updatedValue.templates.push(data.template);
        }
        break;

      case 'updateDocumentConfig':
        updatedValue.documentConfig = data.document;
        break;

      case 'updateRecipientConfig':
        updatedValue.recipientConfig = data.recipient;
        break;

      case 'updateSessionConfig':
      case 'updateAnalyticsConfig':
      case 'testConnection':
        return NextResponse.json(
          { error: `${data.operation} non implémenté` },
          { status: 501 }
        );

      default:
        return NextResponse.json(
          { error: 'Opération non reconnue' },
          { status: 400 }
        );
    }

    // Sauvegarder la mise à jour
    const updated = await prisma.configuration.upsert({
      where: {
        category_key: {
          category: 'whatsapp',
          key: 'whatsapp_config'
        }
      },
      update: {
        value: updatedValue,
        updatedAt: new Date()
      },
      create: {
        id: crypto.randomUUID(),
        category: 'whatsapp',
        key: 'whatsapp_config',
        value: updatedValue,
        isActive: true,
        validFrom: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updated.value
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour partielle:', error);

    return NextResponse.json(
      {
        error: 'Erreur lors de la mise à jour',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
