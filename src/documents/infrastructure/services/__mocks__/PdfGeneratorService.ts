/**
 * Mock du service de génération de PDF
 */

class PdfGeneratorService {
  private static generatedPdfs: Array<{
    templateName: string;
    data: any;
    filename: string;
    buffer?: Buffer;
  }> = [];

  /**
   * Génère un PDF à partir d'un template
   */
  async generatePdf(
    templateName: string,
    data: any,
    filename: string
  ): Promise<Buffer> {
    console.log(`[MOCK PdfGeneratorService] Génération de PDF simulée: ${filename}`);
    
    // Créer un Buffer simulé pour le PDF
    const mockPdfContent = `Mock PDF content for ${templateName} with data: ${JSON.stringify(data)}`;
    const buffer = Buffer.from(mockPdfContent);
    
    // Enregistrer le PDF pour les tests
    PdfGeneratorService.generatedPdfs.push({
      templateName,
      data,
      filename,
      buffer
    });
    
    return buffer;
  }

  /**
   * Génère un devis en PDF
   */
  async generateQuotePdf(quoteData: any, filename?: string): Promise<Buffer> {
    const pdfFilename = filename || `quote-${quoteData.id || 'new'}.pdf`;
    return this.generatePdf('quote-template', quoteData, pdfFilename);
  }

  /**
   * Génère une facture en PDF
   */
  async generateInvoicePdf(invoiceData: any, filename?: string): Promise<Buffer> {
    const pdfFilename = filename || `invoice-${invoiceData.id || 'new'}.pdf`;
    return this.generatePdf('invoice-template', invoiceData, pdfFilename);
  }

  /**
   * Récupère tous les PDFs générés (pour les tests)
   */
  static getGeneratedPdfs(): Array<{
    templateName: string;
    data: any;
    filename: string;
    buffer?: Buffer;
  }> {
    return [...PdfGeneratorService.generatedPdfs];
  }

  /**
   * Réinitialise les PDFs enregistrés (pour les tests)
   */
  static resetMock(): void {
    PdfGeneratorService.generatedPdfs = [];
  }
}

// Exporter le service pour la compatibilité avec Jest
module.exports = { PdfGeneratorService };
// Pour assurer la compatibilité des imports nommés
export { PdfGeneratorService }; 