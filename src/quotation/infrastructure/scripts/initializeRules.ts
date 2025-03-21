import { Pool } from 'pg';
import dotenv from 'dotenv';
import { movingRules } from '../activities/moving/rules/movingRules';
import { cleaningRules } from '../activities/cleaning/rules/cleaningRules';

dotenv.config();

async function initializeRules() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insérer les règles de déménagement
    await client.query(
      `INSERT INTO business_rules (activity_type, rules, version)
       VALUES ($1, $2, $3)`,
      ['moving', JSON.stringify(movingRules), 1]
    );

    // Insérer les règles de nettoyage
    await client.query(
      `INSERT INTO business_rules (activity_type, rules, version)
       VALUES ($1, $2, $3)`,
      ['cleaning', JSON.stringify(cleaningRules), 1]
    );

    await client.query('COMMIT');
    console.log('Rules initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing rules:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  initializeRules()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} 