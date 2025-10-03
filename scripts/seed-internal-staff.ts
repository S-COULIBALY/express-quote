/**
 * Script pour initialiser les responsables internes
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedInternalStaff() {
  console.log('🏢 Initialisation des responsables internes...');
  
  const staff = [
    {
      email: 'moving.manager@expressquote.fr',
      firstName: 'Marc',
      lastName: 'Déménageur',
      role: 'MOVING_MANAGER',
      department: 'Exploitation',
      serviceTypes: ['MOVING', 'PACKING'],
      receiveEmail: true,
      receiveSMS: true,
      receiveWhatsApp: false,
      phone: '+33123456789',
      workingHours: {
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' },
        saturday: { start: '09:00', end: '17:00' },
        sunday: null
      }
    },
    {
      email: 'cleaning.manager@expressquote.fr',
      firstName: 'Marie',
      lastName: 'Ménage',
      role: 'CLEANING_MANAGER',
      department: 'Exploitation',
      serviceTypes: ['CLEANING'],
      receiveEmail: true,
      receiveSMS: true,
      receiveWhatsApp: true,
      phone: '+33123456788',
      workingHours: {
        monday: { start: '07:00', end: '19:00' },
        tuesday: { start: '07:00', end: '19:00' },
        wednesday: { start: '07:00', end: '19:00' },
        thursday: { start: '07:00', end: '19:00' },
        friday: { start: '07:00', end: '19:00' },
        saturday: { start: '08:00', end: '16:00' },
        sunday: { start: '09:00', end: '15:00' }
      }
    },
    {
      email: 'operations@expressquote.fr',
      firstName: 'Paul',
      lastName: 'Operations',
      role: 'OPERATIONS_MANAGER',
      department: 'Direction',
      serviceTypes: ['MOVING', 'CLEANING', 'PACKING', 'TRANSPORT'],
      receiveEmail: true,
      receiveSMS: false,
      receiveWhatsApp: false,
      phone: '+33123456787'
    },
    {
      email: 'accounting@expressquote.fr',
      firstName: 'Sophie',
      lastName: 'Comptable',
      role: 'ACCOUNTING',
      department: 'Finance',
      serviceTypes: [], // Reçoit tous les types pour facturation
      receiveEmail: true,
      receiveSMS: false,
      receiveWhatsApp: false,
      workingHours: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' }
      }
    },
    {
      email: 'delivery.manager@expressquote.fr',
      firstName: 'Jean',
      lastName: 'Transport',
      role: 'DELIVERY_MANAGER',
      department: 'Logistique',
      serviceTypes: ['TRANSPORT'],
      receiveEmail: true,
      receiveSMS: true,
      receiveWhatsApp: false,
      phone: '+33123456786'
    }
  ];

  for (const staffMember of staff) {
    try {
      const created = await prisma.internalStaff.create({
        data: staffMember
      });
      
      console.log(`✅ ${created.firstName} ${created.lastName} (${created.role}) créé`);
    } catch (error) {
      console.log(`⚠️ ${staffMember.firstName} ${staffMember.lastName} existe déjà`);
    }
  }

  console.log('🎉 Responsables internes initialisés');
}

async function main() {
  try {
    await seedInternalStaff();
  } catch (error) {
    console.error('Erreur lors du seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedInternalStaff };