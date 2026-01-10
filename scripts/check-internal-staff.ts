import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Vérification de la table internal_staff...\n");

  const staff = await prisma.internal_staff.findMany({
    orderBy: { role: "asc" },
  });

  console.log(`📊 Total: ${staff.length} membres d'équipe interne`);
  console.log("━".repeat(80));

  if (staff.length === 0) {
    console.log("⚠️  ATTENTION: La table internal_staff est VIDE!");
    console.log(
      "   → Les notifications aux équipes internes ne seront PAS envoyées\n",
    );
    console.log("💡 Solution: Exécuter le script seed-internal-staff.ts");
  } else {
    console.log("\n📋 Liste des membres:");
    staff.forEach((s, i) => {
      const active = s.is_active ? "✅" : "❌";
      const email_enabled = s.receive_email ? "📧" : "🚫";
      console.log(`\n${i + 1}. ${active} ${s.first_name} ${s.last_name}`);
      console.log(`   Role: ${s.role}`);
      console.log(`   Email: ${email_enabled} ${s.email}`);
      console.log(`   Services: ${JSON.stringify(s.service_types)}`);
      console.log(`   Téléphone: ${s.phone || "N/A"}`);
    });

    const activeCount = staff.filter((s) => s.is_active).length;
    const emailCount = staff.filter((s) => s.receive_email).length;

    console.log("\n━".repeat(80));
    console.log(`\n✅ Actifs: ${activeCount}/${staff.length}`);
    console.log(`📧 Recevant emails: ${emailCount}/${staff.length}`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});
