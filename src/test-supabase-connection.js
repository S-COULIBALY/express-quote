const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
require('dotenv').config();

// Informations de connexion
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const postgresUrl = process.env.DIRECT_URL;

console.log('Test de connexion à Supabase...');
console.log(`URL: ${supabaseUrl}`);
console.log(`Service Key: ${supabaseKey ? 'présente (masquée)' : 'manquante'}`);
console.log(`Direct Postgres URL: ${postgresUrl ? 'présente (masquée)' : 'manquante'}`);

// Création du client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Test 1: API Supabase
async function testSupabaseApi() {
  try {
    console.log('\nTest 1: Connexion API Supabase...');
    const { data, error } = await supabase.from('_prisma_migrations').select('*').limit(1);
    
    if (error) {
      console.log(`Erreur API Supabase: ${error.message}`);
      return false;
    }
    
    console.log('Connexion API Supabase: SUCCÈS');
    console.log(`Data: ${data ? 'Données reçues' : 'Aucune donnée (table vide ou inexistante)'}`);
    return true;
  } catch (err) {
    console.log(`Exception API Supabase: ${err.message}`);
    return false;
  }
}

// Test 2: Connexion directe PostgreSQL
async function testPostgresConnection() {
  const client = new Client({
    connectionString: postgresUrl
  });
  
  try {
    console.log('\nTest 2: Connexion directe PostgreSQL...');
    await client.connect();
    console.log('Connexion PostgreSQL: SUCCÈS');
    
    // Tester une requête simple
    const res = await client.query('SELECT current_database() as db_name');
    console.log(`Base de données connectée: ${res.rows[0].db_name}`);
    
    await client.end();
    return true;
  } catch (err) {
    console.log(`Erreur PostgreSQL: ${err.message}`);
    console.log('\nVérifiez que:');
    console.log('1. Le mot de passe est correct');
    console.log('2. Votre adresse IP est autorisée dans Supabase > Paramètres > Base de données > Configuration réseau');
    console.log('3. Le format de l\'URL est correct');
    
    try {
      await client.end();
    } catch (e) {}
    
    return false;
  }
}

// Exécution des tests
async function runTests() {
  const apiSuccess = await testSupabaseApi();
  const pgSuccess = await testPostgresConnection();
  
  console.log('\n=== Résumé des tests ===');
  console.log(`API Supabase: ${apiSuccess ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`PostgreSQL direct: ${pgSuccess ? '✅ OK' : '❌ ÉCHEC'}`);
  
  if (!pgSuccess) {
    console.log('\nPour résoudre le problème de connexion PostgreSQL:');
    console.log('1. Allez sur https://app.supabase.com/project/jxunryzxijkwdanaiohs/settings/database');
    console.log('2. Dans "Configuration réseau", ajoutez votre adresse IP actuelle');
    console.log('3. Vérifiez que le mot de passe dans .env correspond au "password" ou "db_password" dans les paramètres Supabase');
  }
}

runTests(); 