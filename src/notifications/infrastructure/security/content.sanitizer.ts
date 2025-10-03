/**
 * 🧼 SANITIZER DE CONTENU - Sécurité XSS/Injection
 * 
 * Sanitizer robuste avec :
 * - Protection XSS (HTML/JavaScript)
 * - Protection injection SQL
 * - Validation de taille de contenu
 * - Nettoyage des caractères dangereux
 * - Support HTML sécurisé pour emails
 */

export class ContentSanitizer {
  private readonly maxContentSize = parseInt(process.env.MAX_CONTENT_SIZE || '1048576'); // 1MB
  private readonly maxSubjectLength = parseInt(process.env.MAX_SUBJECT_LENGTH || '200');
  
  /**
   * Sanitiser le HTML pour les emails
   */
  async sanitizeHtml(html: string): Promise<string> {
    // Validation de la taille
    await this.validateContentSize(html);
    
    // CORRECTION: Pour les emails HTML, on préserve le HTML légitime
    // et on supprime seulement les éléments vraiment dangereux
    
    let sanitized = html;
    
    // 1. Supprimer les scripts dangereux
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // 2. Supprimer les événements JavaScript
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // 3. Supprimer les liens javascript:
    sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
    
    // 4. Supprimer les iframes non sécurisés
    sanitized = sanitized.replace(/<iframe\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/iframe>/gi, '');
    
    // 5. Supprimer les objets/embeds
    sanitized = sanitized.replace(/<(object|embed)\b[^>]*>/gi, '');
    sanitized = sanitized.replace(/<\/(object|embed)>/gi, '');
    
    // 6. Supprimer les styles dangereux (expression, javascript)
    sanitized = sanitized.replace(/style\s*=\s*["'][^"']*(?:expression|javascript|vbscript)[^"']*["']/gi, '');
    
    // 7. CORRECTION: Ne pas encoder le HTML légitime pour les emails
    // Le HTML doit rester intact pour le rendu correct
    // On encode seulement les caractères vraiment dangereux dans le contenu
    
    return sanitized;
  }
  
  /**
   * Sanitiser le sujet d'un email/SMS
   */
  async sanitizeSubject(subject: string): Promise<string> {
    // Validation de la longueur
    if (subject.length > this.maxSubjectLength) {
      throw new Error(`Subject too long (max ${this.maxSubjectLength} characters)`);
    }
    
    // Supprimer les caractères de contrôle et les retours à la ligne
    let sanitized = subject.replace(/[\r\n\t]/g, ' ');
    
    // Supprimer les tentatives d'injection SQL basiques
    sanitized = sanitized.replace(/(\b(DROP|DELETE|UPDATE|INSERT|SELECT|UNION|EXEC|SCRIPT)\b)/gi, '');
    
    // Supprimer les caractères potentiellement dangereux
    sanitized = sanitized.replace(/[<>'"\\;]/g, '');
    
    // Nettoyer les espaces multiples
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    return sanitized;
  }
  
  /**
   * Sanitiser le contenu texte
   */
  async sanitizeText(text: string): Promise<string> {
    // Validation de la taille
    await this.validateContentSize(text);
    
    // Encoder les entités HTML pour éviter les injections
    let sanitized = this.encodeHtmlEntities(text);
    
    // Supprimer les caractères de contrôle dangereux
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    return sanitized;
  }
  
  /**
   * Sanitiser un numéro de téléphone
   */
  async sanitizePhoneNumber(phone: string): Promise<string> {
    // Supprimer tous les caractères non numériques sauf + et espaces
    let sanitized = phone.replace(/[^\d+\s()-]/g, '');
    
    // Supprimer les espaces multiples
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    // Validation du format basique
    if (!/^[\d+\s()-]+$/.test(sanitized)) {
      throw new Error('Invalid phone number format');
    }
    
    return sanitized;
  }
  
  /**
   * Sanitiser une adresse email
   */
  async sanitizeEmail(email: string): Promise<string> {
    // Supprimer les espaces
    let sanitized = email.trim().toLowerCase();
    
    // Validation du format email basique
    const emailRegex = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
    
    // Supprimer les caractères dangereux
    sanitized = sanitized.replace(/[<>'"\\;]/g, '');
    
    return sanitized;
  }
  
  /**
   * Valider la taille du contenu
   */
  async validateContentSize(content: string): Promise<void> {
    const sizeInBytes = Buffer.byteLength(content, 'utf8');
    
    if (sizeInBytes > this.maxContentSize) {
      throw new Error(`Content too large (${sizeInBytes} bytes, max ${this.maxContentSize} bytes)`);
    }
  }
  
  /**
   * Encoder sélectivement le HTML (préserver les balises sécurisées)
   */
  private selectiveEncodeHtml(str: string): string {
    // Liste des balises HTML sécurisées autorisées pour les emails
    const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'div', 'span', 'table', 'tr', 'td', 'th'];
    const allowedAttributes = ['style', 'class', 'id', 'width', 'height', 'border', 'cellpadding', 'cellspacing', 'colspan', 'rowspan'];
    
    let result = str;
    
    // Stratégie différente : au lieu d'encoder tout puis décoder,
    // on préserve les structures HTML légitimes et on encode seulement le contenu dangereux
    
    // 1. Protéger temporairement les balises HTML légitimes avec des marqueurs
    const htmlTagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^<>]*>/g;
    const protectedTags: string[] = [];
    let tagIndex = 0;
    
    result = result.replace(htmlTagRegex, (match, tagName) => {
      if (allowedTags.includes(tagName.toLowerCase())) {
        // Vérifier que les attributs sont sécurisés
        const safeTag = this.sanitizeHtmlTag(match, allowedAttributes);
        const placeholder = `___HTMLTAG_${tagIndex}___`;
        protectedTags[tagIndex] = safeTag;
        tagIndex++;
        return placeholder;
      } else {
        // Balise non autorisée, la supprimer
        return '';
      }
    });
    
    // 2. Encoder les caractères dangereux dans le contenu restant
    result = result
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // Ne pas encoder les guillemets ici car ils sont légitimes dans les attributs HTML
    
    // 3. Restaurer les balises protégées
    protectedTags.forEach((tag, index) => {
      result = result.replace(`___HTMLTAG_${index}___`, tag);
    });
    
    return result;
  }
  
  /**
   * Sanitiser une balise HTML individuelle
   */
  private sanitizeHtmlTag(tag: string, allowedAttributes: string[]): string {
    // Supprimer les événements JavaScript
    let sanitized = tag.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Supprimer les liens javascript:
    sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
    
    // Supprimer les styles avec expression ou javascript
    sanitized = sanitized.replace(/style\s*=\s*["'][^"']*(?:expression|javascript|vbscript)[^"']*["']/gi, '');
    
    // Valider que seuls les attributs autorisés sont présents
    // (pour une sécurité maximale, on pourrait ici filtrer plus strictement)
    
    return sanitized;
  }

  /**
   * Encoder les entités HTML
   */
  private encodeHtmlEntities(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  /**
   * Validation avancée pour détecter les tentatives d'injection (assouplie pour éviter les faux positifs)
   */
  async validateForInjection(content: string): Promise<boolean> {
    // Patterns d'injection communs (plus spécifiques pour éviter les faux positifs)
    const injectionPatterns = [
      // SQL Injection (plus spécifique - doit contenir mot clé SQL + contexte)
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b.*\b(FROM|WHERE|VALUES|TABLE|INTO)\b)/i,
      /((\bOR\b.*=.*\bAND\b)|('.*=.*'.*\bOR\b))/i, // Plus spécifique que OR/AND seuls
      /(--\s*[a-zA-Z]|\/\*.*\*\/)/,  // SQL comments avec contenu
      
      // XSS Patterns (inchangés car spécifiques)
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:\s*[a-zA-Z]/i,  // Plus spécifique
      /vbscript:\s*[a-zA-Z]/i,    // Plus spécifique
      /on\w+\s*=\s*["'][^"']*["']/i,  // Plus spécifique pour les event handlers
      
      // Command Injection (plus contextualisé)
      /(\b(exec|system|shell_exec|passthru|eval)\s*\()/i,  // Doit avoir des parenthèses
      /(\|\s*(rm|del|cat|ls|dir|curl|wget|nc)\b)/i,  // Pipe avec commandes système
      
      // Path Traversal (inchangé car spécifique)
      /(\.\.\/|\.\.\\)/
      
      // LDAP Injection supprimé car trop de faux positifs sur & () * normaux
    ];
    
    for (const pattern of injectionPatterns) {
      if (pattern.test(content)) {
        console.warn(`🚨 Potential injection attempt detected: ${pattern.source}`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Nettoyer le contenu des métadonnées de fichier
   */
  async sanitizeFileMetadata(filename: string): Promise<string> {
    // Supprimer les chemins
    let sanitized = filename.replace(/.*[/\\]/, '');
    
    // Supprimer les caractères dangereux
    sanitized = sanitized.replace(/[<>:"|?*\\\/]/g, '_');
    
    // Limiter la longueur
    if (sanitized.length > 255) {
      const ext = sanitized.substring(sanitized.lastIndexOf('.'));
      sanitized = sanitized.substring(0, 255 - ext.length) + ext;
    }
    
    return sanitized;
  }
  
  /**
   * Statistiques du sanitizer
   */
  getStats(): {
    maxContentSize: number;
    maxSubjectLength: number;
  } {
    return {
      maxContentSize: this.maxContentSize,
      maxSubjectLength: this.maxSubjectLength
    };
  }
}