/**
 * 🚀 Script de Population Simple - Production Ready
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Population simple des données de production...\n');

  // 1. Providers de notifications
  console.log('📡 Configuration des providers...');

  await prisma.notificationProvider.upsert({
    where: { id: 'email-smtp' },
    update: {},
    create: {
      id: 'email-smtp',
      channel: 'EMAIL',
      name: 'nodemailer-smtp',
      isActive: true,
      isPrimary: true,
      priority: 100,
      config: { host: 'smtp.gmail.com', port: 587 },
      credentials: { user: 'test@example.com', pass: 'password' }
    }
  });

  await prisma.notificationProvider.upsert({
    where: { id: 'sms-free' },
    update: {},
    create: {
      id: 'sms-free',
      channel: 'SMS',
      name: 'free-mobile',
      isActive: true,
      isPrimary: true,
      priority: 100,
      config: { baseUrl: 'https://smsapi.free-mobile.fr' },
      credentials: { user: '12345678', pass: 'apikey' }
    }
  });

  console.log('✅ Providers configurés');

  // 2. Templates de notifications
  console.log('📝 Création des templates...');

  await prisma.notificationTemplate.upsert({
    where: { name: 'payment-confirmation' },
    update: {},
    create: {
      name: 'payment-confirmation',
      type: 'PAYMENT_CONFIRMATION',
      channel: 'EMAIL',
      subject: 'Confirmation de paiement - Express Quote',
      isDefault: true,
      requiredVars: ['customerName', 'amount'],
      optionalVars: ['attachments']
    }
  });

  await prisma.notificationTemplate.upsert({
    where: { name: 'service-reminder' },
    update: {},
    create: {
      name: 'service-reminder',
      type: 'SERVICE_REMINDER',
      channel: 'EMAIL',
      subject: 'Rappel de service - Express Quote',
      isDefault: true,
      requiredVars: ['customerName', 'serviceDate'],
      optionalVars: ['fullClientData']
    }
  });

  console.log('✅ Templates créés');

  // 3. Équipe interne
  console.log('👥 Création équipe interne...');

  await prisma.internalStaff.upsert({
    where: { email: 'admin@express-quote.com' },
    update: {},
    create: {
      email: 'admin@express-quote.com',
      firstName: 'Admin',
      lastName: 'Express Quote',
      role: 'ADMIN',
      serviceTypes: ['MOVING', 'CLEANING', 'DELIVERY']
    }
  });

  console.log('✅ Équipe créée');

  // 4. Professionnels
  console.log('🏢 Création professionnels...');

  await prisma.professional.upsert({
    where: { email: 'pro1@example.com' },
    update: {},
    create: {
      companyName: 'Déménagements Pro',
      businessType: 'MOVING_COMPANY',
      email: 'pro1@example.com',
      phone: '+33123456789',
      city: 'Paris',
      verified: true,
      serviceTypes: ['MOVING'],
      maxDistanceKm: 100
    }
  });

  await prisma.professional.upsert({
    where: { email: 'pro2@example.com' },
    update: {},
    create: {
      companyName: 'Ménage Plus',
      businessType: 'CLEANING_SERVICE',
      email: 'pro2@example.com',
      phone: '+33987654321',
      city: 'Lyon',
      verified: true,
      serviceTypes: ['CLEANING'],
      maxDistanceKm: 50
    }
  });

  console.log('✅ Professionnels créés');

  // 5. Clients de test
  console.log('👥 Création clients...');

  await prisma.customer.upsert({
    where: { email: 'client1@example.com' },
    update: {},
    create: {
      email: 'client1@example.com',
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+33612345678'
    }
  });

  await prisma.customer.upsert({
    where: { email: 'client2@example.com' },
    update: {},
    create: {
      email: 'client2@example.com',
      firstName: 'Marie',
      lastName: 'Martin',
      phone: '+33623456789'
    }
  });

  console.log('✅ Clients créés');

  // 6. Règles métier
  console.log('⚙️ Création règles métier...');

  const rules = [
    {
      name: 'Tarif minimum déménagement',
      description: 'Tarif minimum pour un déménagement',
      value: 100.0,
      category: 'MINIMUM' as const,
      serviceType: 'MOVING' as const
    },
    {
      name: 'Tarif minimum ménage',
      description: 'Tarif minimum pour un service de ménage',
      value: 50.0,
      category: 'MINIMUM' as const,
      serviceType: 'CLEANING' as const
    }
  ];

  for (const rule of rules) {
    const existing = await prisma.rules.findFirst({
      where: { name: rule.name }
    });

    if (!existing) {
      await prisma.rules.create({
        data: rule
      });
    }
  }

  console.log('✅ Règles métier créées');

  // 7. Configuration système
  console.log('🔧 Configuration système...');

  await prisma.configuration.upsert({
    where: { category_key: { category: 'PRICING', key: 'base_rate_moving' } },
    update: {},
    create: {
      category: 'PRICING',
      key: 'base_rate_moving',
      value: { rate: 25.0, unit: 'm3' },
      description: 'Tarif de base déménagement'
    }
  });

  await prisma.configuration.upsert({
    where: { category_key: { category: 'SERVICE_PARAMS', key: 'max_distance' } },
    update: {},
    create: {
      category: 'SERVICE_PARAMS',
      key: 'max_distance',
      value: { distance: 150, unit: 'km' },
      description: 'Distance maximale pour attribution'
    }
  });

  console.log('✅ Configuration créée');

  // 8. Métriques exemple
  console.log('📊 Création métriques...');

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.notificationMetrics.upsert({
    where: {
      date_hour_channel_templateType: {
        date: yesterday,
        hour: 14,
        channel: 'EMAIL',
        templateType: 'PAYMENT_CONFIRMATION'
      }
    },
    update: {},
    create: {
      date: yesterday,
      hour: 14,
      channel: 'EMAIL',
      templateType: 'PAYMENT_CONFIRMATION',
      totalSent: 25,
      totalDelivered: 24,
      totalFailed: 1,
      successRate: 96.0
    }
  });

  console.log('✅ Métriques créées');

  console.log('\n🎉 Population terminée avec succès !');
  console.log('\n📊 Données créées :');
  console.log(`   - ${await prisma.notificationProvider.count()} providers`);
  console.log(`   - ${await prisma.notificationTemplate.count()} templates`);
  console.log(`   - ${await prisma.internalStaff.count()} staff interne`);
  console.log(`   - ${await prisma.professional.count()} professionnels`);
  console.log(`   - ${await prisma.customer.count()} clients`);
  console.log(`   - ${await prisma.rules.count()} règles métier`);
  console.log(`   - ${await prisma.configuration.count()} configurations`);
  console.log(`   - ${await prisma.notificationMetrics.count()} métriques`);

  console.log('\n🚀 Système prêt pour la production !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });