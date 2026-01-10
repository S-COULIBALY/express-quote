import { prisma } from "../src/lib/prisma";

async function checkProfessionals() {
  console.log("🔍 Vérification des prestataires dans la base de données...\n");

  // Total des prestataires
  const totalProfessionals = await prisma.professional.count();
  console.log(`📊 Total prestataires: ${totalProfessionals}`);

  // Prestataires vérifiés et disponibles
  const verifiedAvailable = await prisma.professional.count({
    where: {
      verified: true,
      is_available: true,
    },
  });
  console.log(`✅ Prestataires vérifiés et disponibles: ${verifiedAvailable}`);

  // Détails des prestataires éligibles (vérifiés et disponibles)
  const eligibleProfessionals = await prisma.professional.findMany({
    where: {
      verified: true,
      is_available: true,
    },
    select: {
      id: true,
      companyName: true,
      email: true,
      phone: true,
      city: true,
      service_types: true,
      verified: true,
      is_available: true,
      latitude: true,
      longitude: true,
      max_distance_km: true,
    },
    take: 5,
  });

  console.log(
    `\n📋 Détails des ${eligibleProfessionals.length} prestataires éligibles:`,
  );

  let withCleaning = 0;
  eligibleProfessionals.forEach((prof, index) => {
    const serviceTypes = Array.isArray(prof.service_types)
      ? prof.service_types
      : [];
    const hasCleaning = serviceTypes.includes("CLEANING");
    if (hasCleaning) withCleaning++;

    console.log(`\n${index + 1}. ${prof.companyName || prof.id}`);
    console.log(`   Email: ${prof.email}`);
    console.log(`   Téléphone: ${prof.phone || "❌ Non renseigné"}`);
    console.log(`   Ville: ${prof.city || "N/A"}`);
    console.log(
      `   Services: ${serviceTypes.length > 0 ? serviceTypes.join(", ") : "❌ Aucun"}`,
    );
    console.log(`   CLEANING: ${hasCleaning ? "✅" : "❌"}`);
    console.log(
      `   Coordonnées: ${prof.latitude && prof.longitude ? `(${prof.latitude}, ${prof.longitude})` : "❌ Non renseignées"}`,
    );
    console.log(`   Rayon max: ${prof.max_distance_km || "N/A"} km`);
  });

  console.log(
    `\n🧹 Prestataires avec service CLEANING: ${withCleaning}/${eligibleProfessionals.length}`,
  );

  await prisma.$disconnect();
}

checkProfessionals().catch(console.error);
