import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDuplicates() {
  console.log("\n🔍 Vérification des emails dupliqués\n");

  // Vérifier si s.coulibaly@outlook.com est à la fois customer ET internal_staff
  const email = "seno.contacts@gmail.com";

  const customer = await prisma.customer.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  const staffMember = await prisma.internal_staff.findFirst({
    where: { email },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      role: true,
      is_active: true,
    },
  });

  console.log("📧 Email:", email);
  console.log("\n👤 Customer:");
  if (customer) {
    console.log("   ✅ TROUVÉ");
    console.log("   ID:", customer.id);
    console.log("   Nom:", customer.firstName, customer.lastName);
  } else {
    console.log("   ❌ Pas trouvé");
  }

  console.log("\n👥 Internal Staff:");
  if (staffMember) {
    console.log("   ✅ TROUVÉ");
    console.log("   ID:", staffMember.id);
    console.log("   Nom:", staffMember.first_name, staffMember.last_name);
    console.log("   Role:", staffMember.role);
    console.log("   Actif:", staffMember.is_active);
  } else {
    console.log("   ❌ Pas trouvé");
  }

  if (customer && staffMember) {
    console.log("\n⚠️ PROBLÈME DÉTECTÉ:");
    console.log(
      "   s.coulibaly@outlook.com est à la fois customer ET internal_staff",
    );
    console.log(
      "   → Reçoit 2 emails (1 en tant que customer, 1 en tant que staff)",
    );
  }

  await prisma.$disconnect();
}

checkDuplicates().catch(console.error);
