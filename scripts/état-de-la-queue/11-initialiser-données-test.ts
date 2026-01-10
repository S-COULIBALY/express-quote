/**
 * Script pour initialiser les données de test pour les destinataires
 * - Supprime les données existantes
 * - Crée de nouvelles données avec les coordonnées réelles pour recevoir les notifications
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function initialiserDonneesTest() {
  console.log(
    "\n🧹 ═══════════════════════════════════════════════════════════",
  );
  console.log("         INITIALISATION DES DONNÉES DE TEST");
  console.log("═══════════════════════════════════════════════════════════\n");

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // 1. NETTOYAGE DES TABLES
    // ═══════════════════════════════════════════════════════════════════════
    console.log("🧹 Nettoyage des tables existantes...\n");

    // Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
    await prisma.notification_audits.deleteMany({});
    console.log("   ✅ notification_audits nettoyée");

    await prisma.notifications.deleteMany({});
    console.log("   ✅ notifications nettoyée");

    await prisma.scheduled_reminders.deleteMany({});
    console.log("   ✅ scheduled_reminders nettoyée");

    await prisma.attribution_eligibilities.deleteMany({});
    console.log("   ✅ attribution_eligibilities nettoyée");

    await prisma.attribution_responses.deleteMany({});
    console.log("   ✅ attribution_responses nettoyée");

    await prisma.attribution_updates.deleteMany({});
    console.log("   ✅ attribution_updates nettoyée");

    await prisma.booking_attributions.deleteMany({});
    console.log("   ✅ booking_attributions nettoyée");

    await prisma.professional_notifications.deleteMany({});
    console.log("   ✅ professional_notifications nettoyée");

    await prisma.professional_sessions.deleteMany({});
    console.log("   ✅ professional_sessions nettoyée");

    await prisma.professional_blacklists.deleteMany({});
    console.log("   ✅ professional_blacklists nettoyée");

    await prisma.professional.deleteMany({});
    console.log("   ✅ professional nettoyée");

    await prisma.internal_staff.deleteMany({});
    console.log("   ✅ internal_staff nettoyée");

    await prisma.customer.deleteMany({});
    console.log("   ✅ customer nettoyée");

    console.log("\n✅ Nettoyage terminé\n");

    // ═══════════════════════════════════════════════════════════════════════
    // 2. CRÉATION DES CLIENTS
    // ═══════════════════════════════════════════════════════════════════════
    console.log("👤 Création des clients...\n");

    const client = await prisma.customer.create({
      data: {
        id: "customer_test_myriam",
        email: "essorr.contacts@gmail.com",
        firstName: "Myriam",
        lastName: "Andréa",
        phone: "+33751262080",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`   ✅ Client créé: ${client.firstName} ${client.lastName}`);
    console.log(`      📧 Email: ${client.email}`);
    console.log(`      📞 Téléphone: ${client.phone}`);
    console.log(`      💬 WhatsApp: ${client.phone}\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // 3. CRÉATION DE L'ÉQUIPE INTERNE
    // ═══════════════════════════════════════════════════════════════════════
    console.log("👥 Création de l'équipe interne...\n");

    const staff1 = await prisma.internal_staff.create({
      data: {
        id: "staff_test_issa",
        email: "s.coulibaly@outlook.com",
        first_name: "Issa",
        last_name: "DOUMBIA",
        role: "OPERATIONS_MANAGER",
        department: "Exploitation",
        service_types: ["CLEANING", "MOVING"],
        is_active: true,
        receive_email: true,
        receive_sms: true,
        receive_whatsapp: true,
        phone: "+33751262080",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log(
      `   ✅ Membre équipe créé: ${staff1.first_name} ${staff1.last_name}`,
    );
    console.log(
      `      📧 Email: ${staff1.email} ${staff1.receive_email ? "✅" : "❌"}`,
    );
    console.log(
      `      📞 Téléphone: ${staff1.phone} ${staff1.receive_sms ? "✅ (SMS activé)" : "❌"}`,
    );
    console.log(
      `      💬 WhatsApp: ${staff1.phone} ${staff1.receive_whatsapp ? "✅ (activé)" : "❌"}`,
    );
    console.log(`      🏢 Rôle: ${staff1.role} - ${staff1.department}\n`);

    const staff2 = await prisma.internal_staff.create({
      data: {
        id: "staff_test_bakary",
        email: "essorr.contact@gmail.com",
        first_name: "Bakary",
        last_name: "COULIBALY",
        role: "CUSTOMER_SERVICE",
        department: "Commercial",
        service_types: ["CLEANING", "MOVING"],
        is_active: true,
        receive_email: true,
        receive_sms: true,
        receive_whatsapp: true,
        phone: "+33751262080",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log(
      `   ✅ Membre équipe créé: ${staff2.first_name} ${staff2.last_name}`,
    );
    console.log(
      `      📧 Email: ${staff2.email} ${staff2.receive_email ? "✅" : "❌"}`,
    );
    console.log(
      `      📞 Téléphone: ${staff2.phone} ${staff2.receive_sms ? "✅ (SMS activé)" : "❌"}`,
    );
    console.log(
      `      💬 WhatsApp: ${staff2.phone} ${staff2.receive_whatsapp ? "✅ (activé)" : "❌"}`,
    );
    console.log(`      🏢 Rôle: ${staff2.role} - ${staff2.department}\n`);

    const staff3 = await prisma.internal_staff.create({
      data: {
        id: "staff_test_sita",
        email: "essorr.contacts@gmail.com",
        first_name: "Sita",
        last_name: "KONE",
        role: "ACCOUNTING",
        department: "Comptabilité",
        service_types: ["CLEANING", "MOVING"],
        is_active: true,
        receive_email: true,
        receive_sms: false,
        receive_whatsapp: false,
        phone: "+33751262080",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log(
      `   ✅ Membre équipe créé: ${staff3.first_name} ${staff3.last_name}`,
    );
    console.log(
      `      📧 Email: ${staff3.email} ${staff3.receive_email ? "✅" : "❌"}`,
    );
    console.log(
      `      📞 Téléphone: ${staff3.phone} ${staff3.receive_sms ? "✅ (SMS activé)" : "❌"}`,
    );
    console.log(
      `      💬 WhatsApp: ${staff3.phone} ${staff3.receive_whatsapp ? "✅ (activé)" : "❌"}`,
    );
    console.log(`      🏢 Rôle: ${staff3.role} - ${staff3.department}\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // 4. CRÉATION DES PRESTATAIRES
    // ═══════════════════════════════════════════════════════════════════════
    console.log("🚚 Création des prestataires...\n");

    // Adresses réelles en région parisienne
    const adressesParis = [
      {
        address: "15 Rue de la Paix",
        city: "Paris",
        postalCode: "75002",
        latitude: 48.8698,
        longitude: 2.3314,
      },
      {
        address: "42 Avenue des Champs-Élysées",
        city: "Paris",
        postalCode: "75008",
        latitude: 48.8698,
        longitude: 2.3047,
      },
      {
        address: "78 Boulevard Saint-Germain",
        city: "Paris",
        postalCode: "75005",
        latitude: 48.8534,
        longitude: 2.3488,
      },
    ];

    const pro1 = await prisma.professional.create({
      data: {
        id: "pro_test_jean_dupont",
        companyName: "Déménagements Jean DUPONT",
        businessType: "MOVING_COMPANY",
        email: "essorr.contact@gmail.com",
        phone: "0751262080",
        address: adressesParis[0].address,
        city: adressesParis[0].city,
        postalCode: adressesParis[0].postalCode,
        country: "France",
        verified: true,
        is_available: true,
        latitude: adressesParis[0].latitude,
        longitude: adressesParis[0].longitude,
        max_distance_km: 50,
        service_types: ["MOVING", "PACKING"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`   ✅ Prestataire créé: ${pro1.companyName}`);
    console.log(`      📧 Email: ${pro1.email}`);
    console.log(`      📞 Téléphone: ${pro1.phone}`);
    console.log(`      💬 WhatsApp: ${pro1.phone}`);
    console.log(
      `      📍 Adresse: ${pro1.address}, ${pro1.postalCode} ${pro1.city}`,
    );
    console.log(`      🏢 Type: ${pro1.businessType}\n`);

    const pro2 = await prisma.professional.create({
      data: {
        id: "pro_test_jacques_bonsergent",
        companyName: "Déménagements Jacques BONSERGENT",
        businessType: "MOVING_COMPANY",
        email: "essorr.contacts@gmail.com",
        phone: "0751262080",
        address: adressesParis[1].address,
        city: adressesParis[1].city,
        postalCode: adressesParis[1].postalCode,
        country: "France",
        verified: true,
        is_available: true,
        latitude: adressesParis[1].latitude,
        longitude: adressesParis[1].longitude,
        max_distance_km: 50,
        service_types: ["MOVING", "PACKING"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`   ✅ Prestataire créé: ${pro2.companyName}`);
    console.log(`      📧 Email: ${pro2.email}`);
    console.log(`      📞 Téléphone: ${pro2.phone}`);
    console.log(`      💬 WhatsApp: ${pro2.phone}`);
    console.log(
      `      📍 Adresse: ${pro2.address}, ${pro2.postalCode} ${pro2.city}`,
    );
    console.log(`      🏢 Type: ${pro2.businessType}\n`);

    const pro3 = await prisma.professional.create({
      data: {
        id: "pro_test_vincent_dubois",
        companyName: "Nettoyage Vincent DUBOIS",
        businessType: "CLEANING_SERVICE",
        email: "s.coulibaly@outlook.com",
        phone: "0751262080",
        address: adressesParis[2].address,
        city: adressesParis[2].city,
        postalCode: adressesParis[2].postalCode,
        country: "France",
        verified: true,
        is_available: true,
        latitude: adressesParis[2].latitude,
        longitude: adressesParis[2].longitude,
        max_distance_km: 50,
        service_types: ["CLEANING"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`   ✅ Prestataire créé: ${pro3.companyName}`);
    console.log(`      📧 Email: ${pro3.email}`);
    console.log(`      📞 Téléphone: ${pro3.phone}`);
    console.log(`      💬 WhatsApp: ${pro3.phone}`);
    console.log(
      `      📍 Adresse: ${pro3.address}, ${pro3.postalCode} ${pro3.city}`,
    );
    console.log(`      🏢 Type: ${pro3.businessType}\n`);

    // ═══════════════════════════════════════════════════════════════════════
    // 5. RÉSUMÉ
    // ═══════════════════════════════════════════════════════════════════════
    console.log(
      "📊 ═══════════════════════════════════════════════════════════",
    );
    console.log("         RÉSUMÉ DES DONNÉES CRÉÉES");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    console.log("👤 CLIENTS: 1");
    console.log(
      "   - Myriam Andréa (essorr.contacts@gmail.com / +33751262080)\n",
    );

    console.log("👥 ÉQUIPE INTERNE: 3");
    console.log(
      "   - Issa DOUMBIA - Responsable d'exploitation (s.coulibaly@outlook.com / +33751262080)",
    );
    console.log(
      "   - Bakary COULIBALY - Commercial (essorr.contact@gmail.com / +33751262080)",
    );
    console.log(
      "   - Sita KONE - Comptable (essorr.contacts@gmail.com / +33751262080)\n",
    );

    console.log("🚚 PRESTATAIRES: 3");
    console.log(
      "   - Jean DUPONT - Déménageur (essorr.contact@gmail.com / 0751262080)",
    );
    console.log(
      "   - Jacques BONSERGENT - Déménageur (essorr.contacts@gmail.com / 0751262080)",
    );
    console.log(
      "   - Vincent DUBOIS - Nettoyage (s.coulibaly@outlook.com / 0751262080)\n",
    );

    console.log("✅ Initialisation terminée avec succès !\n");
    console.log(
      "📧 Les notifications seront envoyées aux coordonnées réelles spécifiées.\n",
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'initialisation:",
      (error as Error).message,
    );
    console.error("   Stack:", (error as Error).stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initialiserDonneesTest()
  .then(() => {
    console.log("✅ Script terminé\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });
