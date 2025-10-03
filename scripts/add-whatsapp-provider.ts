/**
 * 📱 Script d'ajout du provider WhatsApp
 * Ajoute un provider WhatsApp pour éliminer le warning de production
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Chargement des variables d'environnement
config({ path: '.env.local' });
config({ path: '.env' });

const prisma = new PrismaClient();

async function addWhatsAppProvider() {
  console.log('📱 Ajout du provider WhatsApp...\n');

  try {
    // Créer le provider WhatsApp
    const whatsappProvider = await prisma.notificationProvider.upsert({
      where: {
        channel_name: {
          channel: 'WHATSAPP',
          name: 'whatsapp-business-api'
        }
      },
      update: {
        isActive: true,
        config: {
          apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
          phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '123456789012345'
        },
        credentials: {
          accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'test_token',
          businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '123456789012345'
        }
      },
      create: {
        id: 'whatsapp-business-api',
        channel: 'WHATSAPP',
        name: 'whatsapp-business-api',
        isActive: true,
        isPrimary: true,
        priority: 100,
        config: {
          apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
          phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '123456789012345'
        },
        credentials: {
          accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'test_token',
          businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '123456789012345'
        }
      }
    });

    console.log('✅ Provider WhatsApp créé:', whatsappProvider.id);

    // Vérifier le nombre total de providers
    const totalProviders = await prisma.notificationProvider.count();
    console.log(`📊 Total providers: ${totalProviders}`);

    // Lister tous les providers par canal
    const providersByChannel = await prisma.notificationProvider.groupBy({
      by: ['channel'],
      _count: {
        channel: true
      }
    });

    console.log('\n📋 Providers par canal:');
    providersByChannel.forEach(group => {
      console.log(`   ${group.channel}: ${group._count.channel} provider(s)`);
    });

    console.log('\n🎉 Provider WhatsApp ajouté avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du provider WhatsApp:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution du script
addWhatsAppProvider()
  .catch((error) => {
    console.error('💥 Échec du script:', error);
    process.exit(1);
  });