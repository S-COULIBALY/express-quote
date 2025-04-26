import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Chemin vers le fichier de stockage temporaire des numéros de commande
// En production, cela serait remplacé par une base de données
const DATA_DIR = path.join(process.cwd(), 'data');
const ORDERS_FILE_PATH = path.join(DATA_DIR, 'orders.json');

// Fonction qui génère un numéro de commande unique
function generateOrderNumber() {
  // Préfixe standard
  const prefix = 'ORD';
  
  // Date actuelle formatée YYYYMMDD
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${year}${month}${day}`;
  
  // Partie aléatoire pour garantir l'unicité (substring de UUID)
  const randomPart = uuidv4().replace(/-/g, '').substring(0, 6).toUpperCase();
  
  // Numéro de commande final
  return `${prefix}-${dateString}-${randomPart}`;
}

// Fonction pour lire les numéros de commande existants
function getExistingOrderNumbers(): string[] {
  try {
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Créer le fichier s'il n'existe pas
    if (!fs.existsSync(ORDERS_FILE_PATH)) {
      fs.writeFileSync(ORDERS_FILE_PATH, JSON.stringify([], null, 2));
      return [];
    }
    
    const data = fs.readFileSync(ORDERS_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors de la lecture des numéros de commande:', error);
    return [];
  }
}

// Fonction pour sauvegarder un nouveau numéro de commande
function saveOrderNumber(orderNumber: string): boolean {
  try {
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    const existingOrderNumbers = getExistingOrderNumbers();
    existingOrderNumbers.push(orderNumber);
    fs.writeFileSync(ORDERS_FILE_PATH, JSON.stringify(existingOrderNumbers, null, 2));
    
    // Log pour déboguer
    console.log(`Numéro de commande ${orderNumber} sauvegardé dans ${ORDERS_FILE_PATH}`);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du numéro de commande:', error);
    return false;
  }
}

// Route POST pour générer un numéro de commande
export async function POST() {
  try {
    // Générer un numéro de commande unique
    let orderNumber = generateOrderNumber();
    const existingOrderNumbers = getExistingOrderNumbers();
    
    // Vérifier l'unicité (dans un cas réel avec beaucoup de commandes, vous utiliseriez une base de données avec un index unique)
    let attempts = 0;
    while (existingOrderNumbers.includes(orderNumber) && attempts < 5) {
      orderNumber = generateOrderNumber();
      attempts++;
    }
    
    if (attempts >= 5) {
      throw new Error("Impossible de générer un numéro de commande unique après plusieurs tentatives");
    }
    
    // Sauvegarder le numéro de commande
    const saved = saveOrderNumber(orderNumber);
    if (!saved) {
      throw new Error("Échec de la sauvegarde du numéro de commande");
    }
    
    // Log serveur (utile pour le débogage en production)
    console.log(`Nouveau numéro de commande généré: ${orderNumber}`);
    
    // Renvoyer le numéro de commande au client
    return NextResponse.json({ 
      success: true,
      orderNumber 
    });
  } catch (error) {
    console.error('Erreur lors de la génération du numéro de commande:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la génération du numéro de commande' 
      },
      { status: 500 }
    );
  }
} 