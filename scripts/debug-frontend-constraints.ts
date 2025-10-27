/**
 * Script pour débugger les contraintes envoyées par le frontend
 */

// Simuler ce que le frontend envoie actuellement
const frontendData = {
  pickupLogisticsConstraints: {
    furniture_lift_required: true,
    'ec4ac13f-3ede-458a-bf77-4e5964bc6614': true,
    '6267e023-e9ae-4c41-8101-5ce4f863363d': true,
    '76d5aa58-d9ad-45c8-8c72-6a03d178d15d': true
  },
  deliveryLogisticsConstraints: {
    furniture_lift_required: true,
    long_carrying_distance: true,
    'ec4ac13f-3ede-458a-bf77-4e5964bc6614': true,
    '6267e023-e9ae-4c41-8101-5ce4f863363d': true,
    '76d5aa58-d9ad-45c8-8c72-6a03d178d15d': true,
    'd85f44a1-3f5f-4e28-883c-778000a2e23e': true,
    '7b09890c-9151-41e2-a017-4f478e601fc4': true,
    '9b08837b-666e-4ff8-8ea7-223b7c695fb0': true
  }
};

console.log('🔍 DONNÉES FRONTEND:');
console.log(JSON.stringify(frontendData, null, 2));

// Fonction de normalisation (copie de PriceService)
function normalizeConstraints(constraints: any): string[] {
  if (Array.isArray(constraints)) {
    return constraints;
  }

  if (typeof constraints === 'object' && constraints !== null) {
    const constraintNames = Object.keys(constraints).filter(key => {
      if (constraints[key] !== true) return false;

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
      return !isUUID;
    });

    console.log('\n🔧 NORMALISATION:');
    console.log('Avant:', Object.keys(constraints));
    console.log('Après:', constraintNames);
    console.log('UUIDs filtrés:', Object.keys(constraints).filter(k =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k)
    ));

    return constraintNames;
  }

  return [];
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 RÉSULTAT DE LA NORMALISATION:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const pickupNormalized = normalizeConstraints(frontendData.pickupLogisticsConstraints);
const deliveryNormalized = normalizeConstraints(frontendData.deliveryLogisticsConstraints);

console.log('\n✅ Pickup constraints:', pickupNormalized);
console.log('✅ Delivery constraints:', deliveryNormalized);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⚠️  ANALYSE DU PROBLÈME:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (pickupNormalized.length < Object.keys(frontendData.pickupLogisticsConstraints).length) {
  const lost = Object.keys(frontendData.pickupLogisticsConstraints).length - pickupNormalized.length;
  console.log(`❌ ${lost} contraintes pickup perdues (UUIDs filtrés)`);
}

if (deliveryNormalized.length < Object.keys(frontendData.deliveryLogisticsConstraints).length) {
  const lost = Object.keys(frontendData.deliveryLogisticsConstraints).length - deliveryNormalized.length;
  console.log(`❌ ${lost} contraintes delivery perdues (UUIDs filtrés)`);
}

console.log('\n💡 SOLUTION:');
console.log('Le frontend envoie les UUIDs des règles ET les noms de contraintes.');
console.log('Les UUIDs sont correctement filtrés par normalizeConstraints().');
console.log('Les noms de contraintes (furniture_lift_required, long_carrying_distance) sont conservés.');
console.log('\n✅ Si seulement 2 contraintes sont conservées sur 4-8 envoyées,');
console.log('   c\'est NORMAL car les autres sont des UUIDs de règles.');
