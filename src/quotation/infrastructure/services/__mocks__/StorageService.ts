/**
 * Mock du service de stockage de fichiers
 */

class StorageService {
  private static storedFiles: Array<{
    buffer: Buffer;
    path: string;
    filename: string;
    mimeType: string;
    size: number;
    url: string;
  }> = [];

  /**
   * Stocke un fichier dans le système de stockage
   */
  async storeFile(
    buffer: Buffer,
    path: string,
    filename: string,
    mimeType: string = 'application/octet-stream'
  ): Promise<string> {
    console.log(`[MOCK StorageService] Stockage de fichier simulé: ${path}/${filename}`);
    
    // Génère une URL simulée
    const url = `https://storage.example.com/${path}/${filename}`;
    
    // Enregistre le fichier pour les tests
    StorageService.storedFiles.push({
      buffer,
      path,
      filename,
      mimeType,
      size: buffer.length,
      url
    });
    
    return url;
  }

  /**
   * Stocke un document PDF
   */
  async storePdf(
    pdfBuffer: Buffer,
    path: string,
    filename: string
  ): Promise<string> {
    return this.storeFile(pdfBuffer, path, filename, 'application/pdf');
  }

  /**
   * Stocke une image
   */
  async storeImage(
    imageBuffer: Buffer,
    path: string,
    filename: string,
    mimeType: string = 'image/jpeg'
  ): Promise<string> {
    return this.storeFile(imageBuffer, path, filename, mimeType);
  }

  /**
   * Supprime un fichier du système de stockage
   */
  async deleteFile(url: string): Promise<boolean> {
    console.log(`[MOCK StorageService] Suppression de fichier simulée: ${url}`);
    
    // Trouve l'index du fichier à supprimer
    const fileIndex = StorageService.storedFiles.findIndex(file => file.url === url);
    
    // Si le fichier existe, le supprimer
    if (fileIndex !== -1) {
      StorageService.storedFiles.splice(fileIndex, 1);
      return true;
    }
    
    return false;
  }

  /**
   * Récupère tous les fichiers stockés (pour les tests)
   */
  static getStoredFiles(): Array<{
    buffer: Buffer;
    path: string;
    filename: string;
    mimeType: string;
    size: number;
    url: string;
  }> {
    return [...StorageService.storedFiles];
  }

  /**
   * Réinitialise les fichiers enregistrés (pour les tests)
   */
  static resetMock(): void {
    StorageService.storedFiles = [];
  }
}

// Exporter le service pour la compatibilité avec Jest
module.exports = { StorageService };
// Pour assurer la compatibilité des imports nommés
export { StorageService }; 