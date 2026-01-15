/**
 * Layout de base pour tous les templates d'email
 * 
 * Utilité :
 * - Structure HTML consistante pour tous les emails
 * - Styles responsifs et compatibilité multi-clients
 * - Branding uniforme avec logo et couleurs
 * - Footer standardisé avec liens de désinscription
 * 
 * Technologies utilisées :
 * - React Email : Framework moderne pour créer des emails
 *   * Avantages : JSX familiar, composants réutilisables, responsive design
 *   * Gratuit et open source, alternative à Mailjet/SendGrid templates
 *   * Rendu HTML optimisé pour tous les clients email
 *   * Preview en temps réel pendant le développement
 * - Tailwind CSS intégré : Styles utilitaires pour la cohérence
 * - Support multi-langue : Props pour personnalisation
 * 
 * Configuration :
 * - Compatible avec tous les clients (Outlook, Gmail, Apple Mail, etc.)
 * - Dark mode supporté automatiquement
 * - Images optimisées avec CDN
 * - Liens de tracking optionnels
 */

import {
  Html,
  Head,
  Font,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Img,
  Text,
  Link,
  Hr,
  Button
} from '@react-email/components';
import * as React from 'react';

/**
 * Props du layout principal
 */
export interface LayoutProps {
  children: React.ReactNode;
  preview?: string;
  title?: string;
  lang?: string;
  
  // Configuration du branding
  brandName?: string;
  brandLogo?: string;
  brandColor?: string;
  brandUrl?: string;
  
  // Configuration du footer
  companyAddress?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
  supportEmail?: string;
  
  // Configuration technique
  trackingPixel?: string;
  darkModeSupported?: boolean;
}

/**
 * Styles globaux pour les emails
 * 
 * Note : React Email compile ces styles en CSS inline pour la compatibilité
 * avec tous les clients email, y compris Outlook qui ne supporte pas <style>
 */
const styles = {
  // Conteneur principal
  main: {
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  },
  
  // Container responsive
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '0 20px',
  },
  
  // Header avec logo
  header: {
    padding: '32px 0',
    textAlign: 'center' as const,
    borderBottom: '1px solid #eaeaea',
  },
  
  // Logo
  logo: {
    height: '40px',
    width: 'auto',
  },
  
  // Contenu principal
  content: {
    padding: '32px 0',
    lineHeight: '1.6',
  },
  
  // Titres
  h1: {
    color: '#333333',
    fontSize: '28px',
    fontWeight: '600',
    lineHeight: '1.3',
    margin: '0 0 24px 0',
  },
  
  h2: {
    color: '#333333',
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.3',
    margin: '32px 0 16px 0',
  },
  
  h3: {
    color: '#333333',
    fontSize: '20px',
    fontWeight: '600',
    lineHeight: '1.3',
    margin: '24px 0 12px 0',
  },
  
  // Texte
  text: {
    color: '#555555',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
  },
  
  textSmall: {
    color: '#888888',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 12px 0',
  },
  
  // Boutons
  button: {
    backgroundColor: '#007ee6',
    borderRadius: '8px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '1',
    padding: '16px 24px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    margin: '16px 0',
  },
  
  buttonSecondary: {
    backgroundColor: 'transparent',
    border: '2px solid #007ee6',
    borderRadius: '8px',
    color: '#007ee6',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '1',
    padding: '14px 22px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    margin: '16px 0',
  },
  
  // Cards/Boxes
  card: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    padding: '24px',
    margin: '16px 0',
  },
  
  cardHighlight: {
    backgroundColor: '#e3f2fd',
    border: '1px solid #bbdefb',
    borderRadius: '8px',
    padding: '24px',
    margin: '16px 0',
  },
  
  // Footer
  footer: {
    borderTop: '1px solid #eaeaea',
    padding: '32px 0',
    textAlign: 'center' as const,
  },
  
  footerText: {
    color: '#888888',
    fontSize: '12px',
    lineHeight: '1.5',
    margin: '0 0 8px 0',
  },
  
  footerLink: {
    color: '#007ee6',
    textDecoration: 'none',
  },
  
  // Responsive
  '@media only screen and (max-width: 600px)': {
    container: {
      width: '100% !important',
      padding: '0 10px !important',
    },
    h1: {
      fontSize: '24px !important',
    },
    h2: {
      fontSize: '20px !important',
    },
    content: {
      padding: '24px 0 !important',
    },
    button: {
      width: '100% !important',
      maxWidth: '300px',
    },
  },
};

/**
 * Layout principal pour tous les emails Express Quote
 * 
 * Fonctionnalités :
 * - Header avec logo personnalisable
 * - Contenu responsive et accessible
 * - Footer avec informations légales
 * - Support du dark mode
 * - Tracking optionnel
 * - Désinscription intégrée
 */
export const Layout: React.FC<LayoutProps> = ({
  children,
  preview = 'Express Quote - Votre devis en ligne',
  title = 'Express Quote',
  lang = 'fr',
  brandName = 'Express Quote',
  brandLogo = 'https://express-quote.com/logo.png',
  brandColor = '#007ee6',
  brandUrl = 'https://express-quote.com',
  companyAddress = 'Express Quote, 123 Avenue des Devis, 75001 Paris, France',
  unsubscribeUrl,
  preferencesUrl,
  supportEmail = 'support@express-quote.com',
  trackingPixel,
  darkModeSupported = true,
}) => {
  // Styles personnalisés avec la couleur de marque
  const customStyles = {
    ...styles,
    button: {
      ...styles.button,
      backgroundColor: brandColor,
    },
    buttonSecondary: {
      ...styles.buttonSecondary,
      borderColor: brandColor,
      color: brandColor,
    },
    footerLink: {
      ...styles.footerLink,
      color: brandColor,
    },
  };

  return (
    <Html lang={lang}>
      <Head>
        {/* Fonts Google pour une meilleure lisibilité */}
        <Font
          fontFamily="Inter"
          fallbackFontFamily="sans-serif"
          webFont={{
            url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        
        {/* Meta tags pour la responsivité */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
        
        {/* Support du dark mode */}
        {darkModeSupported && (
          <meta name="color-scheme" content="light dark" />
        )}
        
        <title>{title}</title>
      </Head>
      
      {/* Texte de preview (affiché dans la liste des emails) */}
      <Preview>{preview}</Preview>
      
      <Body style={customStyles.main}>
        {/* Tracking pixel (optionnel) */}
        {trackingPixel && (
          <Img
            src={trackingPixel}
            width="1"
            height="1"
            alt=""
            style={{ display: 'block', width: '1px', height: '1px' }}
          />
        )}
        
        <Container style={customStyles.container}>
          {/* Header avec logo */}
          <Section style={customStyles.header}>
            <Link href={brandUrl} target="_blank">
              <Img
                src={brandLogo}
                alt={`Logo ${brandName}`}
                style={customStyles.logo}
              />
            </Link>
          </Section>
          
          {/* Contenu principal */}
          <Section style={customStyles.content}>
            {children}
          </Section>
          
          {/* Footer */}
          <Section style={customStyles.footer}>
            <Text style={customStyles.footerText}>
              {companyAddress}
            </Text>
            
            <Text style={customStyles.footerText}>
              Vous recevez cet email car vous avez un compte sur {brandName}.
            </Text>
            
            {/* Liens du footer */}
            <Row>
              <Column align="center">
                {preferencesUrl && (
                  <>
                    <Link
                      href={preferencesUrl}
                      style={customStyles.footerLink}
                      target="_blank"
                    >
                      Gérer mes préférences
                    </Link>
                    {(unsubscribeUrl || supportEmail) && (
                      <Text style={customStyles.footerText}> | </Text>
                    )}
                  </>
                )}
                
                {unsubscribeUrl && (
                  <>
                    <Link
                      href={unsubscribeUrl}
                      style={customStyles.footerLink}
                      target="_blank"
                    >
                      Se désinscrire
                    </Link>
                    {supportEmail && (
                      <Text style={customStyles.footerText}> | </Text>
                    )}
                  </>
                )}
                
                {supportEmail && (
                  <Link
                    href={`mailto:${supportEmail}`}
                    style={customStyles.footerLink}
                  >
                    Support
                  </Link>
                )}
              </Column>
            </Row>
            
            <Hr style={{ margin: '24px 0', borderColor: '#eaeaea' }} />
            
            <Text style={customStyles.footerText}>
              © {new Date().getFullYear()} {brandName}. Tous droits réservés.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

/**
 * Composants utilitaires exportés pour réutilisation
 */

// Titre principal
export const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={styles.h1}>{children}</Text>
);

// Sous-titre
export const Subtitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={styles.h2}>{children}</Text>
);

// Paragraphe standard
export const Paragraph: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <Text style={{ ...styles.text, ...style }}>{children}</Text>
);

// Texte petit (pour les notes, disclaimers, etc.)
export const SmallText: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <Text style={{ ...styles.textSmall, ...style }}>{children}</Text>
);

// Bouton principal
export const PrimaryButton: React.FC<{
  href: string;
  children: React.ReactNode;
  brandColor?: string;
}> = ({ href, children, brandColor = '#007ee6' }) => (
  <Button
    href={href}
    style={{
      ...styles.button,
      backgroundColor: brandColor,
    }}
  >
    {children}
  </Button>
);

// Bouton secondaire
export const SecondaryButton: React.FC<{
  href: string;
  children: React.ReactNode;
  brandColor?: string;
}> = ({ href, children, brandColor = '#007ee6' }) => (
  <Button
    href={href}
    style={{
      ...styles.buttonSecondary,
      borderColor: brandColor,
      color: brandColor,
    }}
  >
    {children}
  </Button>
);

// Card/Box pour mettre en évidence du contenu
export const Card: React.FC<{
  children: React.ReactNode;
  highlight?: boolean;
  style?: React.CSSProperties;
}> = ({ children, highlight = false, style }) => (
  <Section style={{ ...(highlight ? styles.cardHighlight : styles.card), ...style }}>
    {children}
  </Section>
);

// Séparateur
export const Separator: React.FC = () => (
  <Hr style={{ margin: '32px 0', borderColor: '#eaeaea' }} />
);

export default Layout;