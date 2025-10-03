/**
 * 🎯 Générateur de Données de Test
 *
 * Génère des volumes importants de données pour :
 * - Tests de charge
 * - Tests de performance
 * - Validation scalabilité
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/fr';

const prisma = new PrismaClient();

// Configuration pour les tests de charge
const CONFIG = {
  customers: 1000,
  professionals: 100,
  bookings: 2000,
  notifications: 5000,
  reminders: 500,
  metrics: 30 // 30 jours
};

async function main() {
  console.log('🎯 Génération de données de test pour charge...\n');

  // 1. ====================================================================
  // CLIENTS EN MASSE
  // ====================================================================
  console.log(`👥 Génération de ${CONFIG.customers} clients...`);

  const customerData = [];
  for (let i = 0; i < CONFIG.customers; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    customerData.push({
      email: faker.internet.email({ firstName, lastName }),
      firstName,
      lastName,
      phone: faker.phone.number('+336########')
    });
  }

  // Insertion par batch pour performance
  const batchSize = 100;
  for (let i = 0; i < customerData.length; i += batchSize) {
    const batch = customerData.slice(i, i + batchSize);
    await prisma.customer.createMany({
      data: batch,
      skipDuplicates: true
    });

    if (i % 500 === 0) {
      console.log(`   ✅ ${i + batch.length} clients créés...`);
    }
  }

  console.log(`✅ ${CONFIG.customers} clients générés\n`);

  // 2. ====================================================================
  // PROFESSIONNELS EN MASSE
  // ====================================================================
  console.log(`🏢 Génération de ${CONFIG.professionals} professionnels...`);

  const cities = [
    { name: 'Paris', lat: 48.8566, lng: 2.3522, postal: '75001' },
    { name: 'Lyon', lat: 45.7640, lng: 4.8357, postal: '69001' },
    { name: 'Marseille', lat: 43.2965, lng: 5.3698, postal: '13001' },
    { name: 'Toulouse', lat: 43.6047, lng: 1.4442, postal: '31000' },
    { name: 'Nice', lat: 43.7102, lng: 7.2620, postal: '06000' },
    { name: 'Nantes', lat: 47.2184, lng: -1.5536, postal: '44000' },
    { name: 'Montpellier', lat: 43.6110, lng: 3.8767, postal: '34000' },
    { name: 'Strasbourg', lat: 48.5734, lng: 7.7521, postal: '67000' },
    { name: 'Bordeaux', lat: 44.8378, lng: -0.5792, postal: '33000' },
    { name: 'Lille', lat: 50.6292, lng: 3.0573, postal: '59000' }
  ];

  const businessTypes = ['MOVING_COMPANY', 'CLEANING_SERVICE', 'HANDYMAN', 'STORAGE_COMPANY'];
  const serviceTypes = [
    ['MOVING', 'PACKING'],
    ['CLEANING'],
    ['MOVING', 'CLEANING', 'DELIVERY'],
    ['DELIVERY'],
    ['MOVING', 'PACKING', 'DELIVERY']
  ];

  const professionalData = [];
  for (let i = 0; i < CONFIG.professionals; i++) {
    const city = faker.helpers.arrayElement(cities);
    const businessType = faker.helpers.arrayElement(businessTypes);
    const services = faker.helpers.arrayElement(serviceTypes);

    professionalData.push({
      companyName: faker.company.name() + ' ' + faker.helpers.arrayElement(['SARL', 'SAS', 'EURL']),
      businessType,
      email: faker.internet.email(),
      phone: faker.phone.number('+331########'),
      address: faker.location.streetAddress(),
      city: city.name,
      postalCode: city.postal,
      latitude: city.lat + faker.number.float({ min: -0.1, max: 0.1 }),
      longitude: city.lng + faker.number.float({ min: -0.1, max: 0.1 }),
      serviceTypes: services,
      maxDistanceKm: faker.number.int({ min: 30, max: 200 }),
      verified: faker.datatype.boolean(0.8), // 80% vérifiés
      rating: faker.number.float({ min: 3.0, max: 5.0, precision: 0.1 }),
      description: faker.lorem.sentence()
    });
  }

  for (let i = 0; i < professionalData.length; i += batchSize) {
    const batch = professionalData.slice(i, i + batchSize);
    await prisma.professional.createMany({
      data: batch,
      skipDuplicates: true
    });

    if (i % 500 === 0) {
      console.log(`   ✅ ${i + batch.length} professionnels créés...`);
    }
  }

  console.log(`✅ ${CONFIG.professionals} professionnels générés\n`);

  // 3. ====================================================================
  // RÉSERVATIONS ET ATTRIBUTIONS
  // ====================================================================
  console.log(`📋 Génération de ${CONFIG.bookings} réservations...`);

  const customers = await prisma.customer.findMany({ take: 500 });
  const professionals = await prisma.professional.findMany();
  const bookingTypes = ['MOVING_QUOTE', 'SERVICE', 'PACKING'];
  const statuses = ['DRAFT', 'CONFIRMED', 'PAYMENT_COMPLETED', 'COMPLETED'];

  for (let i = 0; i < CONFIG.bookings; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const professional = faker.helpers.arrayElement(professionals);
    const bookingType = faker.helpers.arrayElement(bookingTypes);
    const status = faker.helpers.arrayElement(statuses);

    const scheduledDate = faker.date.future({ years: 1 });
    const amount = faker.number.float({ min: 50, max: 1000, precision: 0.01 });

    try {
      const booking = await prisma.booking.create({
        data: {
          type: bookingType,
          status,
          customerId: customer.id,
          professionalId: professional.id,
          totalAmount: amount,
          paymentMethod: faker.helpers.arrayElement(['Carte bancaire', 'Virement', 'Espèces']),
          scheduledDate,
          locationAddress: faker.location.streetAddress() + ', ' + faker.location.city(),
          pickupAddress: faker.location.streetAddress(),
          deliveryAddress: faker.location.streetAddress(),
          distance: faker.number.float({ min: 1, max: 100 }),
          additionalInfo: {
            volume: faker.number.int({ min: 10, max: 100 }),
            surface: faker.number.int({ min: 20, max: 200 }),
            rooms: faker.number.int({ min: 1, max: 8 }),
            specialInstructions: faker.lorem.sentence()
          }
        }
      });

      // Attribution pour certaines réservations
      if (faker.datatype.boolean(0.6)) { // 60% ont une attribution
        await prisma.bookingAttribution.create({
          data: {
            bookingId: booking.id,
            status: faker.helpers.arrayElement(['BROADCASTING', 'ACCEPTED', 'COMPLETED']),
            acceptedProfessionalId: professional.id,
            serviceType: faker.helpers.arrayElement(['MOVING', 'CLEANING', 'DELIVERY']),
            maxDistanceKm: faker.number.int({ min: 50, max: 150 }),
            serviceLatitude: faker.location.latitude(),
            serviceLongitude: faker.location.longitude(),
            broadcastCount: faker.number.int({ min: 1, max: 3 })
          }
        });
      }

    } catch (error) {
      // Ignorer les erreurs de contraintes
      continue;
    }

    if (i % 200 === 0) {
      console.log(`   ✅ ${i} réservations créées...`);
    }
  }

  console.log(`✅ ${CONFIG.bookings} réservations générées\n`);

  // 4. ====================================================================
  // NOTIFICATIONS HISTORIQUES
  // ====================================================================
  console.log(`📧 Génération de ${CONFIG.notifications} notifications...`);

  const channels = ['EMAIL', 'SMS', 'WHATSAPP'];
  const statuses = ['PENDING', 'SENT', 'DELIVERED', 'FAILED'];
  const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

  for (let i = 0; i < CONFIG.notifications; i++) {
    try {
      await prisma.notification.create({
        data: {
          recipientId: faker.helpers.arrayElement(customers).id,
          channel: faker.helpers.arrayElement(channels),
          status: faker.helpers.arrayElement(statuses),
          templateId: faker.string.uuid(),
          subject: faker.lorem.sentence(),
          content: faker.lorem.paragraphs(2),
          priority: faker.helpers.arrayElement(priorities),
          scheduledAt: faker.date.past({ years: 1 }),
          sentAt: faker.date.recent({ days: 30 }),
          attempts: faker.number.int({ min: 1, max: 3 }),
          externalId: faker.string.alphanumeric(10),
          cost: faker.number.float({ min: 0.001, max: 0.1, precision: 0.001 }),
          metadata: {
            provider: faker.helpers.arrayElement(['nodemailer', 'free-mobile', 'whatsapp']),
            queue: faker.helpers.arrayElement(['high', 'normal', 'low']),
            messageId: faker.string.uuid()
          }
        }
      });
    } catch (error) {
      continue;
    }

    if (i % 500 === 0) {
      console.log(`   ✅ ${i} notifications créées...`);
    }
  }

  console.log(`✅ ${CONFIG.notifications} notifications générées\n`);

  // 5. ====================================================================
  // RAPPELS PROGRAMMÉS
  // ====================================================================
  console.log(`⏰ Génération de ${CONFIG.reminders} rappels...`);

  const bookings = await prisma.booking.findMany({ take: 200 });
  const reminderTypes = ['CLIENT_7_DAYS', 'CLIENT_24_HOURS', 'CLIENT_1_HOUR', 'PROFESSIONAL_DAY_J'];
  const reminderStatuses = ['SCHEDULED', 'SENT', 'FAILED', 'CANCELLED'];

  for (let i = 0; i < CONFIG.reminders; i++) {
    const booking = faker.helpers.arrayElement(bookings);
    const reminderType = faker.helpers.arrayElement(reminderTypes);

    try {
      await prisma.scheduledReminder.create({
        data: {
          bookingId: booking.id,
          reminderType,
          scheduledDate: faker.date.future({ days: 30 }),
          serviceDate: faker.date.future({ days: 45 }),
          recipientEmail: faker.internet.email(),
          recipientPhone: faker.phone.number('+336########'),
          status: faker.helpers.arrayElement(reminderStatuses),
          fullClientData: {
            customerName: faker.person.fullName(),
            customerPhone: faker.phone.number(),
            fullPickupAddress: faker.location.streetAddress(),
            specialInstructions: faker.lorem.sentence()
          },
          metadata: {
            serviceType: faker.helpers.arrayElement(['MOVING', 'CLEANING', 'DELIVERY']),
            priority: faker.helpers.arrayElement(['NORMAL', 'HIGH']),
            attempts: faker.number.int({ min: 0, max: 2 })
          }
        }
      });
    } catch (error) {
      continue;
    }

    if (i % 100 === 0) {
      console.log(`   ✅ ${i} rappels créés...`);
    }
  }

  console.log(`✅ ${CONFIG.reminders} rappels générés\n`);

  // 6. ====================================================================
  // MÉTRIQUES HISTORIQUES
  // ====================================================================
  console.log(`📊 Génération de ${CONFIG.metrics} jours de métriques...`);

  const templateTypes = ['PAYMENT_CONFIRMATION', 'SERVICE_REMINDER', 'BOOKING_CONFIRMATION'];

  for (let day = 0; day < CONFIG.metrics; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);

    for (const channel of channels) {
      for (const templateType of templateTypes) {
        for (let hour = 8; hour < 20; hour++) {
          const totalSent = faker.number.int({ min: 10, max: 200 });
          const deliveryRate = faker.number.float({ min: 0.85, max: 0.99 });
          const totalDelivered = Math.floor(totalSent * deliveryRate);
          const totalFailed = totalSent - totalDelivered;

          try {
            await prisma.notificationMetrics.create({
              data: {
                date,
                hour,
                channel,
                templateType,
                totalSent,
                totalDelivered,
                totalFailed,
                totalOpened: Math.floor(totalDelivered * faker.number.float({ min: 0.2, max: 0.8 })),
                totalClicked: Math.floor(totalDelivered * faker.number.float({ min: 0.1, max: 0.4 })),
                avgProcessingMs: faker.number.int({ min: 200, max: 2000 }),
                maxProcessingMs: faker.number.int({ min: 1000, max: 5000 }),
                minProcessingMs: faker.number.int({ min: 100, max: 500 }),
                totalCost: totalSent * faker.number.float({ min: 0.001, max: 0.05 }),
                avgCostPerMsg: faker.number.float({ min: 0.001, max: 0.05 }),
                successRate: deliveryRate * 100,
                deliveryRate: deliveryRate * 100,
                openRate: faker.number.float({ min: 20, max: 80 }),
                clickRate: faker.number.float({ min: 10, max: 40 }),
                metadata: {
                  provider: faker.helpers.arrayElement(['nodemailer', 'free-mobile', 'whatsapp']),
                  queue: faker.helpers.arrayElement(['priority', 'normal', 'bulk'])
                }
              }
            });
          } catch (error) {
            // Ignorer les erreurs d'unicité
            continue;
          }
        }
      }
    }

    if (day % 10 === 0) {
      console.log(`   ✅ ${day} jours de métriques créés...`);
    }
  }

  console.log(`✅ ${CONFIG.metrics} jours de métriques générés\n`);

  console.log('🎉 Génération de données de test terminée !');
  console.log('\n📊 Données créées pour tests de charge :');
  console.log(`   - ${await prisma.customer.count()} clients au total`);
  console.log(`   - ${await prisma.professional.count()} professionnels au total`);
  console.log(`   - ${await prisma.booking.count()} réservations au total`);
  console.log(`   - ${await prisma.notification.count()} notifications au total`);
  console.log(`   - ${await prisma.scheduledReminder.count()} rappels au total`);
  console.log(`   - ${await prisma.notificationMetrics.count()} métriques au total`);

  console.log('\n🚀 Système prêt pour tests de charge et performance !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la génération :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });