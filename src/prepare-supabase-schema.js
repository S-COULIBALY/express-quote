const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Utiliser la clé de service pour avoir les privilèges d'admin

console.log('Tentative de connexion à Supabase avec la clé de service...');

// Créer un client Supabase avec la clé de service
const supabase = createClient(supabaseUrl, supabaseKey);

async function prepareSchema() {
  try {
    console.log('Création des tables...');

    // Créer la table business_rules
    const { error: businessRulesError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS business_rules (
          id SERIAL PRIMARY KEY,
          activity_type VARCHAR(50) NOT NULL,
          rules JSONB NOT NULL,
          version INTEGER NOT NULL,
          valid_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          valid_to TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_business_rules_activity_type ON business_rules(activity_type);
        CREATE INDEX IF NOT EXISTS idx_business_rules_valid_dates ON business_rules(valid_from, valid_to);
      `
    });

    if (businessRulesError) {
      console.error('Erreur lors de la création de la table business_rules:', businessRulesError);
    } else {
      console.log('Table business_rules créée avec succès');
    }

    // Créer la table customers
    const { error: customersError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `
    });

    if (customersError) {
      console.error('Erreur lors de la création de la table customers:', customersError);
    } else {
      console.log('Table customers créée avec succès');
    }

    // Créer la table professionals
    const { error: professionalsError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS professionals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          service_type VARCHAR(50) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `
    });

    if (professionalsError) {
      console.error('Erreur lors de la création de la table professionals:', professionalsError);
    } else {
      console.log('Table professionals créée avec succès');
    }

    // Créer la table quotes
    const { error: quotesError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS quotes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          status VARCHAR(50) NOT NULL,
          service_type VARCHAR(50) NOT NULL,
          volume FLOAT,
          distance FLOAT,
          base_price FLOAT NOT NULL,
          final_price FLOAT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `
    });

    if (quotesError) {
      console.error('Erreur lors de la création de la table quotes:', quotesError);
    } else {
      console.log('Table quotes créée avec succès');
    }

    // Créer la table packs
    const { error: packsError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS packs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          price FLOAT NOT NULL,
          truck_size INTEGER,
          movers_count INTEGER,
          driver_included BOOLEAN NOT NULL DEFAULT FALSE,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `
    });

    if (packsError) {
      console.error('Erreur lors de la création de la table packs:', packsError);
    } else {
      console.log('Table packs créée avec succès');
    }

    // Créer la table services
    const { error: servicesError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS services (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          price FLOAT NOT NULL,
          service_type VARCHAR(50) NOT NULL,
          duration_days INTEGER,
          people_count INTEGER,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `
    });

    if (servicesError) {
      console.error('Erreur lors de la création de la table services:', servicesError);
    } else {
      console.log('Table services créée avec succès');
    }

    // Créer la table bookings
    const { error: bookingsError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS bookings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          status VARCHAR(50) NOT NULL,
          scheduled_date TIMESTAMP NOT NULL,
          origin_address TEXT,
          dest_address TEXT NOT NULL,
          quote_id UUID REFERENCES quotes(id),
          pack_id UUID REFERENCES packs(id),
          customer_id UUID NOT NULL REFERENCES customers(id),
          professional_id UUID NOT NULL REFERENCES professionals(id),
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_bookings_quote_id ON bookings(quote_id);
        CREATE INDEX IF NOT EXISTS idx_bookings_pack_id ON bookings(pack_id);
        CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
        CREATE INDEX IF NOT EXISTS idx_bookings_professional_id ON bookings(professional_id);
      `
    });

    if (bookingsError) {
      console.error('Erreur lors de la création de la table bookings:', bookingsError);
    } else {
      console.log('Table bookings créée avec succès');
    }

    // Créer la table booking_services
    const { error: bookingServicesError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS booking_services (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
          service_id UUID NOT NULL REFERENCES services(id),
          service_date TIMESTAMP NOT NULL,
          address TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(booking_id, service_id)
        );
        CREATE INDEX IF NOT EXISTS idx_booking_services_booking_id ON booking_services(booking_id);
        CREATE INDEX IF NOT EXISTS idx_booking_services_service_id ON booking_services(service_id);
      `
    });

    if (bookingServicesError) {
      console.error('Erreur lors de la création de la table booking_services:', bookingServicesError);
    } else {
      console.log('Table booking_services créée avec succès');
    }

    console.log('Schéma préparé avec succès!');
  } catch (err) {
    console.error('Exception lors de la préparation du schéma:', err);
  }
}

prepareSchema(); 