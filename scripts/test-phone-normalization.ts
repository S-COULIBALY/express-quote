/**
 * 🧪 SCRIPT DE TEST - Normalisation des numéros de téléphone
 *
 * Teste le service PhoneNormalizationService avec différents formats
 */

import { PhoneNormalizationService } from "../src/utils/phone-normalization";

console.log("🧪 TEST DE NORMALISATION DES NUMÉROS DE TÉLÉPHONE\n");
console.log("=".repeat(60));

// Cas de test
const testCases = [
  {
    input: "0751262080",
    expected: "+33751262080",
    description: "Format national français (10 chiffres)",
  },
  {
    input: "0669444719",
    expected: "+33669444719",
    description: "Format national français (autre numéro)",
  },
  {
    input: "0033751262080",
    expected: "+33751262080",
    description: "Format 00 + code pays",
  },
  {
    input: "+33751262080",
    expected: "+33751262080",
    description: "Déjà en format E.164",
  },
  {
    input: "07 51 26 20 80",
    expected: "+33751262080",
    description: "Avec espaces",
  },
  {
    input: "07.51.26.20.80",
    expected: "+33751262080",
    description: "Avec points",
  },
  {
    input: "07-51-26-20-80",
    expected: "+33751262080",
    description: "Avec tirets",
  },
  {
    input: "(07) 51 26 20 80",
    expected: "+33751262080",
    description: "Avec parenthèses et espaces",
  },
  {
    input: "751262080",
    expected: "+33751262080",
    description: "9 chiffres (sans 0 initial)",
  },
  { input: "", expected: null, description: "Chaîne vide" },
  { input: null, expected: null, description: "Valeur null" },
  { input: undefined, expected: null, description: "Valeur undefined" },
];

let passed = 0;
let failed = 0;

console.log("\n📋 RÉSULTATS DES TESTS:\n");

testCases.forEach((testCase, index) => {
  const result = PhoneNormalizationService.normalizeToE164(
    testCase.input as any,
  );
  const success = result === testCase.expected;

  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: ${testCase.description}`);
    console.log(`   Input:    "${testCase.input}"`);
    console.log(`   Résultat: "${result}"`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: ${testCase.description}`);
    console.log(`   Input:    "${testCase.input}"`);
    console.log(`   Attendu:  "${testCase.expected}"`);
    console.log(`   Obtenu:   "${result}"`);
  }
  console.log("");
});

console.log("=".repeat(60));
console.log(`\n📊 RÉSUMÉ: ${passed}/${testCases.length} tests réussis`);

if (failed > 0) {
  console.log(`❌ ${failed} test(s) échoué(s)\n`);
  process.exit(1);
} else {
  console.log(`✅ Tous les tests sont passés !\n`);

  // Tests de validation
  console.log("🔍 TESTS DE VALIDATION:\n");

  const validationTests = [
    { phone: "+33751262080", french: true, e164: true },
    { phone: "+33669444719", french: true, e164: true },
    { phone: "0751262080", french: false, e164: false },
    { phone: "+1234567890", french: false, e164: true },
    { phone: "invalid", french: false, e164: false },
  ];

  validationTests.forEach((test) => {
    const isFrench = PhoneNormalizationService.isValidFrenchE164(test.phone);
    const isE164 = PhoneNormalizationService.isValidE164(test.phone);

    console.log(`📱 "${test.phone}"`);
    console.log(
      `   E.164 français: ${isFrench ? "✅" : "❌"} (attendu: ${test.french ? "✅" : "❌"})`,
    );
    console.log(
      `   E.164 international: ${isE164 ? "✅" : "❌"} (attendu: ${test.e164 ? "✅" : "❌"})`,
    );
    console.log("");
  });

  // Tests de formatage
  console.log("🎨 TESTS DE FORMATAGE:\n");

  const phone = "+33751262080";
  console.log(`Numéro: ${phone}\n`);
  console.log(
    `Format national:      ${PhoneNormalizationService.formatForDisplay(phone, "national")}`,
  );
  console.log(
    `Format international: ${PhoneNormalizationService.formatForDisplay(phone, "international")}`,
  );
  console.log(
    `Format masqué:        ${PhoneNormalizationService.formatForDisplay(phone, "masked")}`,
  );
  console.log("");

  process.exit(0);
}
