/**
 * Script pour initialiser les responsables internes
 * ✅ Services actifs uniquement (2026-02): MOVING, MOVING_PREMIUM
 * ❌ Rôles supprimés: CLEANING_MANAGER, DELIVERY_MANAGER
 */
import { PrismaClient, InternalRole } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function seedInternalStaff() {
  console.log('🏢 Initialisation des responsables internes...');

  const staff = [
    {
      id: randomUUID(),
      email: 'moving.manager@expressquote.fr',
      first_name: 'Marc',
      last_name: 'Déménageur',
      role: 'MOVING_MANAGER' as InternalRole,
      department: 'Exploitation',
      service_types: ['MOVING', 'MOVING_PREMIUM'],
      receive_email: true,
      receive_sms: true,
      receive_whatsapp: false,
      phone: '+33123456789',
      working_hours: {
        monday: { start: '08:00', end: '18:00' },
        tuesday: { start: '08:00', end: '18:00' },
        wednesday: { start: '08:00', end: '18:00' },
        thursday: { start: '08:00', end: '18:00' },
        friday: { start: '08:00', end: '18:00' },
        saturday: { start: '09:00', end: '17:00' },
        sunday: null
      },
      updated_at: new Date()
    },
    {
      id: randomUUID(),
      email: 'operations@expressquote.fr',
      first_name: 'Paul',
      last_name: 'Operations',
      role: 'OPERATIONS_MANAGER' as InternalRole,
      department: 'Direction',
      service_types: ['MOVING', 'MOVING_PREMIUM'],
      receive_email: true,
      receive_sms: false,
      receive_whatsapp: false,
      phone: '+33123456787',
      updated_at: new Date()
    },
    {
      id: randomUUID(),
      email: 'accounting@expressquote.fr',
      first_name: 'Sophie',
      last_name: 'Comptable',
      role: 'ACCOUNTING' as InternalRole,
      department: 'Finance',
      service_types: [], // Reçoit tous les types pour facturation
      receive_email: true,
      receive_sms: false,
      receive_whatsapp: false,
      working_hours: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' }
      },
      updated_at: new Date()
    }
  ];

  for (const staffMember of staff) {
    try {
      const created = await prisma.internal_staff.create({
        data: staffMember
      });

      console.log(`✅ ${created.first_name} ${created.last_name} (${created.role}) créé`);
    } catch (error) {
      console.log(`⚠️ ${staffMember.first_name} ${staffMember.last_name} existe déjà`);
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
