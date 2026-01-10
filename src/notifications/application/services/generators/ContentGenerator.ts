/**
 * ContentGenerator - Génération de contenu simple (fallback)
 * 
 * Responsabilité unique : Génération de contenu HTML/text simple pour fallback
 */

export class ContentGenerator {
  /**
   * Génère un texte simple pour un rappel
   */
  generateSimpleReminderText(data: {
    customerName: string;
    serviceName: string;
    serviceDate: string;
    serviceTime: string;
    bookingId: string;
    companyName?: string;
    supportPhone?: string;
  }): string {
    const companyName = data.companyName || 'Express Quote';
    const supportPhone = data.supportPhone || '01 23 45 67 89';
    
    return `Bonjour ${data.customerName},

Rappel : Votre service ${data.serviceName} est prévu le ${data.serviceDate} à ${data.serviceTime}.

Référence : ${data.bookingId}

Pour toute question, contactez-nous au ${supportPhone}.

Cordialement,
L'équipe ${companyName}`;
  }

  /**
   * Génère un HTML simple à partir d'un contenu texte
   */
  generateSimpleHtml(content: string, subject: string): string {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .content {
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div class="content">${content.replace(/\n/g, '<br>')}</div>
</body>
</html>`;
  }
}

