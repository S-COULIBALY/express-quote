/**
 * Script pour lister tous les destinataires (clients, équipe interne, prestataires)
 * et leurs coordonnées (email, téléphone, WhatsApp)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listDestinataires() {
  console.log(
    "\n📋 ═══════════════════════════════════════════════════════════",
  );
  console.log("         LISTE DES DESTINATAIRES ET COORDONNÉES");
  console.log("═══════════════════════════════════════════════════════════\n");

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // 1. CLIENTS (Customer)
    // ═══════════════════════════════════════════════════════════════════════
    console.log("👤 CLIENTS (Customer)");
    console.log(
      "───────────────────────────────────────────────────────────\n",
    );

    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limiter à 50 pour l'affichage
    });

    console.log(`📊 Total clients trouvés: ${customers.length}\n`);

    if (customers.length === 0) {
      console.log("   ⚠️  Aucun client trouvé\n");
    } else {
      customers.forEach((customer, index) => {
        console.log(
          `   ${index + 1}. ${customer.firstName} ${customer.lastName}`,
        );
        console.log(`      📧 Email: ${customer.email}`);
        console.log(
          `      📞 Téléphone: ${customer.phone || "❌ Non renseigné"}`,
        );
        console.log(
          `      💬 WhatsApp: ${customer.phone ? customer.phone : "❌ Non disponible (nécessite téléphone)"}`,
        );
        console.log(`      🆔 ID: ${customer.id}`);
        console.log(`      📅 Créé le: ${customer.createdAt.toISOString()}`);
        console.log("");
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. ÉQUIPE INTERNE (internal_staff)
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n👥 ÉQUIPE INTERNE (internal_staff)");
    console.log(
      "───────────────────────────────────────────────────────────\n",
    );

    const internalStaff = await prisma.internal_staff.findMany({
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        department: true,
        receive_email: true,
        receive_sms: true,
        receive_whatsapp: true,
        is_active: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    console.log(
      `📊 Total membres équipe interne trouvés: ${internalStaff.length}\n`,
    );

    if (internalStaff.length === 0) {
      console.log("   ⚠️  Aucun membre d'équipe interne trouvé\n");
    } else {
      internalStaff.forEach((staff, index) => {
        console.log(`   ${index + 1}. ${staff.first_name} ${staff.last_name}`);
        console.log(
          `      📧 Email: ${staff.email} ${staff.receive_email ? "✅" : "❌"}`,
        );
        console.log(
          `      📞 Téléphone: ${staff.phone || "❌ Non renseigné"} ${staff.receive_sms ? "✅ (SMS activé)" : "❌ (SMS désactivé)"}`,
        );
        console.log(
          `      💬 WhatsApp: ${staff.phone ? staff.phone : "❌ Non disponible"} ${staff.receive_whatsapp ? "✅ (activé)" : "❌ (désactivé)"}`,
        );
        console.log(`      🏢 Rôle: ${staff.role}`);
        console.log(`      🏢 Département: ${staff.department || "N/A"}`);
        console.log(`      🆔 ID: ${staff.id}`);
        console.log(
          `      📊 Statut: ${staff.is_active ? "✅ Actif" : "❌ Inactif"}`,
        );
        console.log(`      📅 Créé le: ${staff.created_at.toISOString()}`);
        console.log("");
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. PRESTATAIRES / PROFESSIONNELS EXTERNES (Professional)
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n🚚 PRESTATAIRES / PROFESSIONNELS EXTERNES (Professional)");
    console.log(
      "───────────────────────────────────────────────────────────\n",
    );

    const professionals = await prisma.professional.findMany({
      select: {
        id: true,
        email: true,
        companyName: true,
        phone: true,
        businessType: true,
        city: true,
        verified: true,
        is_available: true,
        service_types: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limiter à 50 pour l'affichage
    });

    console.log(`📊 Total prestataires trouvés: ${professionals.length}\n`);

    if (professionals.length === 0) {
      console.log("   ⚠️  Aucun prestataire trouvé\n");
    } else {
      professionals.forEach((professional, index) => {
        const serviceTypes = Array.isArray(professional.service_types)
          ? professional.service_types.join(", ")
          : "N/A";

        console.log(`   ${index + 1}. ${professional.companyName}`);
        console.log(`      📧 Email: ${professional.email}`);
        console.log(
          `      📞 Téléphone: ${professional.phone || "❌ Non renseigné"}`,
        );
        console.log(
          `      💬 WhatsApp: ${professional.phone ? professional.phone : "❌ Non disponible (nécessite téléphone)"}`,
        );
        console.log(`      🏢 Type: ${professional.businessType}`);
        console.log(`      📍 Ville: ${professional.city || "N/A"}`);
        console.log(`      🛠️ Services: ${serviceTypes}`);
        console.log(`      🆔 ID: ${professional.id}`);
        console.log(
          `      ✅ Vérifié: ${professional.verified ? "Oui" : "Non"}`,
        );
        console.log(
          `      📊 Disponible: ${professional.is_available ? "Oui" : "Non"}`,
        );
        console.log(
          `      📅 Créé le: ${professional.createdAt.toISOString()}`,
        );
        console.log("");
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. RÉSUMÉ PAR TYPE DE COORDONNÉES
    // ═══════════════════════════════════════════════════════════════════════
    console.log(
      "\n📊 ═══════════════════════════════════════════════════════════",
    );
    console.log("         RÉSUMÉ PAR TYPE DE COORDONNÉES");
    console.log(
      "═══════════════════════════════════════════════════════════\n",
    );

    const customersWithEmail = customers.filter((c) => c.email).length;
    const customersWithPhone = customers.filter((c) => c.phone).length;
    const customersWithWhatsApp = customers.filter((c) => c.phone).length; // WhatsApp = téléphone

    const staffWithEmail = internalStaff.filter(
      (s) => s.email && s.receive_email,
    ).length;
    const staffWithPhone = internalStaff.filter(
      (s) => s.phone && s.receive_sms,
    ).length;
    const staffWithWhatsApp = internalStaff.filter(
      (s) => s.phone && s.receive_whatsapp,
    ).length;

    const professionalsWithEmail = professionals.filter((p) => p.email).length;
    const professionalsWithPhone = professionals.filter((p) => p.phone).length;
    const professionalsWithWhatsApp = professionals.filter(
      (p) => p.phone,
    ).length; // WhatsApp = téléphone

    console.log("👤 CLIENTS:");
    console.log(`   📧 Avec email: ${customersWithEmail}/${customers.length}`);
    console.log(
      `   📞 Avec téléphone: ${customersWithPhone}/${customers.length}`,
    );
    console.log(
      `   💬 Avec WhatsApp: ${customersWithWhatsApp}/${customers.length} (basé sur téléphone)\n`,
    );

    console.log("👥 ÉQUIPE INTERNE:");
    console.log(
      `   📧 Avec email (activé): ${staffWithEmail}/${internalStaff.length}`,
    );
    console.log(
      `   📞 Avec téléphone (SMS activé): ${staffWithPhone}/${internalStaff.length}`,
    );
    console.log(
      `   💬 Avec WhatsApp (activé): ${staffWithWhatsApp}/${internalStaff.length}\n`,
    );

    console.log("🚚 PRESTATAIRES:");
    console.log(
      `   📧 Avec email: ${professionalsWithEmail}/${professionals.length}`,
    );
    console.log(
      `   📞 Avec téléphone: ${professionalsWithPhone}/${professionals.length}`,
    );
    console.log(
      `   💬 Avec WhatsApp: ${professionalsWithWhatsApp}/${professionals.length} (basé sur téléphone)\n`,
    );

    // ═══════════════════════════════════════════════════════════════════════
    // 5. EXPORT CSV (optionnel)
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n💾 Pour exporter en CSV, utilisez la commande suivante:");
    console.log(
      "   node -e \"const { PrismaClient } = require('@prisma/client'); ...\"\n",
    );
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des destinataires:",
      (error as Error).message,
    );
    console.error("   Stack:", (error as Error).stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listDestinataires()
  .then(() => {
    console.log("✅ Liste des destinataires terminée\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });
