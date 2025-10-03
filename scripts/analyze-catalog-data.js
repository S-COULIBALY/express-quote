const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Analyse des données CatalogSelection existantes...\n');

  // 1. Compter le total
  const totalCount = await prisma.catalogSelection.count();
  console.log(`📊 Total d'éléments: ${totalCount}`);

  if (totalCount === 0) {
    console.log('❌ Aucune donnée trouvée dans CatalogSelection');
    return;
  }

  // 2. Compter par statut
  const activeCount = await prisma.catalogSelection.count({ where: { isActive: true } });
  const featuredCount = await prisma.catalogSelection.count({ where: { isFeatured: true } });
  const newOfferCount = await prisma.catalogSelection.count({ where: { isNewOffer: true } });

  console.log(`✅ Actifs: ${activeCount}`);
  console.log(`⭐ En vedette: ${featuredCount}`);
  console.log(`🆕 Nouvelles offres: ${newOfferCount}\n`);

  // 3. Compter par catégorie
  console.log('📋 Répartition par catégorie:');
  const categories = ['DEMENAGEMENT', 'MENAGE', 'TRANSPORT', 'LIVRAISON'];
  for (const category of categories) {
    const count = await prisma.catalogSelection.count({
      where: { category }
    });
    const featuredInCategory = await prisma.catalogSelection.count({
      where: { category, isFeatured: true }
    });
    console.log(`  ${category}: ${count} total (${featuredInCategory} featured)`);
  }

  // 4. Récupérer tous les éléments en vedette
  console.log('\n⭐ Éléments en vedette détaillés:');
  const featuredItems = await prisma.catalogSelection.findMany({
    where: { isFeatured: true },
    orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }]
  });

  featuredItems.forEach((item, index) => {
    console.log(`${index + 1}. ${item.id}`);
    console.log(`   Catégorie: ${item.category} ${item.subcategory || ''}`);
    console.log(`   Titre: ${item.marketingTitle || 'N/A'}`);
    console.log(`   Sous-titre: ${item.marketingSubtitle || 'N/A'}`);
    console.log(`   Prix: ${item.marketingPrice || 'N/A'}€`);
    console.log(`   Badge: ${item.badgeText || 'N/A'}`);
    console.log(`   Actif: ${item.isActive}`);
    console.log(`   Ordre: ${item.displayOrder}`);
    console.log('');
  });

  // 5. Récupérer quelques éléments pour voir la structure complète
  console.log('📋 Structure complète des 3 premiers éléments:');
  const sampleItems = await prisma.catalogSelection.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' }
  });

  sampleItems.forEach((item, index) => {
    console.log(`\n--- Élément ${index + 1}: ${item.id} ---`);
    console.log(JSON.stringify(item, null, 2));
  });

  // 6. Vérifier les champs manquants importants
  console.log('\n🔍 Analyse des champs manquants:');
  const itemsWithoutTitle = await prisma.catalogSelection.count({
    where: { marketingTitle: null }
  });
  const itemsWithoutSubtitle = await prisma.catalogSelection.count({
    where: { marketingSubtitle: null }
  });
  const itemsWithoutPrice = await prisma.catalogSelection.count({
    where: { marketingPrice: null }
  });
  const itemsWithoutDescription = await prisma.catalogSelection.count({
    where: { marketingDescription: null }
  });

  console.log(`Sans titre marketing: ${itemsWithoutTitle}`);
  console.log(`Sans sous-titre marketing: ${itemsWithoutSubtitle}`);
  console.log(`Sans prix marketing: ${itemsWithoutPrice}`);
  console.log(`Sans description marketing: ${itemsWithoutDescription}`);

  console.log('\n✅ Analyse terminée');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });