import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Service d'infrastructure pour la gestion du stockage de fichiers
 */
export class StorageService {
  private basePath: string;
  private maxSizeBytes: number;

  /**
   * Constructeur avec injection des dépendances
   */
  constructor(basePath: string, maxSizeMB: number = 10) {
    this.basePath = basePath;
    this.maxSizeBytes = maxSizeMB * 1024 * 1024;

    // Créer le répertoire de stockage s'il n'existe pas
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  /**
   * Sauvegarde un fichier dans le stockage
   */
  async saveFile(
    fileContent: Buffer,
    fileName: string,
    subDirectory?: string
  ): Promise<string> {
    // Vérifier la taille du fichier
    if (fileContent.length > this.maxSizeBytes) {
      throw new Error(`Fichier trop volumineux. Maximum: ${this.maxSizeBytes / (1024 * 1024)}MB`);
    }

    try {
      // Créer le sous-répertoire si spécifié
      let targetDir = this.basePath;
      if (subDirectory) {
        targetDir = path.join(this.basePath, subDirectory);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      }

      // Générer un nom de fichier unique si nécessaire
      const uniqueFileName = this.generateUniqueFileName(fileName);
      const filePath = path.join(targetDir, uniqueFileName);

      // Sauvegarder le fichier
      fs.writeFileSync(filePath, fileContent);
      
      // Retourner le chemin relatif du fichier
      return subDirectory 
        ? path.join(subDirectory, uniqueFileName) 
        : uniqueFileName;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du fichier:', error);
      throw new Error(`Erreur lors de la sauvegarde du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère un fichier du stockage
   */
  async getFile(fileRelativePath: string): Promise<Buffer> {
    const filePath = path.join(this.basePath, fileRelativePath);
    
    try {
      // Vérifier si le fichier existe
      if (!fs.existsSync(filePath)) {
        throw new Error(`Fichier non trouvé: ${fileRelativePath}`);
      }

      // Lire et retourner le contenu du fichier
      return fs.readFileSync(filePath);
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
      throw new Error(`Erreur lors de la lecture du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Supprime un fichier du stockage
   */
  async deleteFile(fileRelativePath: string): Promise<boolean> {
    const filePath = path.join(this.basePath, fileRelativePath);
    
    try {
      // Vérifier si le fichier existe
      if (!fs.existsSync(filePath)) {
        return false;
      }

      // Supprimer le fichier
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      throw new Error(`Erreur lors de la suppression du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Vérifie si un fichier existe
   */
  fileExists(fileRelativePath: string): boolean {
    const filePath = path.join(this.basePath, fileRelativePath);
    return fs.existsSync(filePath);
  }

  /**
   * Génère un nom de fichier unique basé sur le nom original
   */
  private generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const hash = crypto.createHash('md5').update(`${originalName}${timestamp}`).digest('hex').substring(0, 8);
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    
    return `${baseName}_${timestamp}_${hash}${ext}`;
  }
} 