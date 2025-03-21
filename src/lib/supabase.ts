import { createClient } from '@supabase/supabase-js';

// Récupérer les variables d'environnement
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Vérifier que les variables sont définies
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Les variables d\'environnement SUPABASE_URL et SUPABASE_KEY doivent être définies');
}

// Créer le client Supabase avec les clés publiques (pour les clients)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Créer un client avec les droits d'administration (pour les opérations serveur)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Fonction utilitaire pour obtenir une instance du client
export const getSupabase = () => supabase;
export const getSupabaseAdmin = () => supabaseAdmin; 