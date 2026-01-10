import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkConfigurations() {
  try {
    console.log('🔍 Vérification des configurations PRICING...\n');

    // Configurations recherchées (manquantes selon les logs)
    const missingKeys = [
      'MOVING_BASE_PRICE_PER_M3',
      'MOVING_WORKER_HOUR_RATE',
      'MOVING_TRUCK_PRICE',
      'MOVING_DISTANCE_PRICE_PER_KM',
      'MOVING_FREE_DISTANCE_KM',
      'HOURS_PER_DAY'
    ];

    // Configurations trouvées selon les logs
    const foundKeys = [
      'FUEL_PRICE_PER_LITER',
      'TOLL_COST_PER_KM'
    ];

    console.log('📊 TOUTES LES CONFIGURATIONS PRICING EN BDD:\n');
    const allPricing = await prisma.configuration.findMany({
      where: {
        category: 'PRICING',
        isActive: true
      },
      orderBy: {
        key: 'asc'
      },
      select: {
        key: true,
        value: true,
        validFrom: true,
        validTo: true,
        isActive: true
      }
    });

    console.log(`Total: ${allPricing.length} configurations PRICING actives\n`);

    for (const config of allPricing) {
      const now = new Date();
      const isValid = config.validFrom <= now && (!config.validTo || config.validTo > now);
      const status = isValid ? '✅' : '❌';
      console.log(`${status} ${config.key} = ${JSON.stringify(config.value)}`);
      console.log(`   validFrom: ${config.validFrom.toISOString()}`);
      console.log(`   validTo: ${config.validTo ? config.validTo.toISOString() : 'null'}`);
      console.log(`   isActive: ${config.isActive}`);
      console.log('');
    }

    console.log('\n🔍 VÉRIFICATION DES CONFIGURATIONS "MANQUANTES":\n');

    for (const key of missingKeys) {
      const config = await prisma.configuration.findFirst({
        where: {
          category: 'PRICING',
          key: key
        },
        orderBy: {
          validFrom: 'desc'
        }
      });

      if (config) {
        const now = new Date();
        const isValidTime = config.validFrom <= now && (!config.validTo || config.validTo > now);
        const status = config.isActive && isValidTime ? '✅ EXISTE' : '⚠️  EXISTE MAIS INVALIDE';
        console.log(`${status} ${key}`);
        console.log(`   Valeur: ${JSON.stringify(config.value)}`);
        console.log(`   isActive: ${config.isActive}`);
        console.log(`   validFrom: ${config.validFrom.toISOString()}`);
        console.log(`   validTo: ${config.validTo ? config.validTo.toISOString() : 'null'}`);
        console.log(`   Validation temporelle: ${isValidTime ? 'OUI ✅' : 'NON ❌'}`);
      } else {
        console.log(`❌ VRAIMENT MANQUANTE: ${key}`);
      }
      console.log('');
    }

    console.log('\n🔍 VÉRIFICATION DES CONFIGURATIONS "TROUVÉES":\n');

    for (const key of foundKeys) {
      const config = await prisma.configuration.findFirst({
        where: {
          category: 'PRICING',
          key: key,
          isActive: true
        }
      });

      if (config) {
        console.log(`✅ TROUVÉE: ${key}`);
        console.log(`   Valeur: ${JSON.stringify(config.value)}`);
      } else {
        console.log(`❌ NON TROUVÉE: ${key}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConfigurations();
