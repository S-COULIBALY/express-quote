/**
 * Template email de rappel 1 heure avant service
 * 
 * Utilité :
 * - Rappel URGENT envoyé 1 heure avant l'intervention
 * - Alerte critique pour présence obligatoire
 * - Fournit tous les contacts d'urgence
 * - Confirme les derniers détails pratiques
 * 
 * Technologies utilisées :
 * - React Email : Template responsive et accessible
 * - TypeScript : Validation des données de rappel
 * - Layout réutilisable : Consistance visuelle avec les autres templates
 * - Design urgent : Couleurs et typographie d'alerte
 * 
 * Cas d'usage :
 * - Envoyé automatiquement 1 heure avant le service
 * - Solution de recours CRITIQUE pour clients email-only (sans téléphone)
 * - Dernière chance de contact avant intervention
 */

import * as React from 'react';
import {
  Section,
  Row,
  Column,
  Text,
  Hr,
} from '@react-email/components';

import {
  Layout,
  Paragraph,
  Card,
  PrimaryButton,
} from '../components/Layout';

/**
 * Interface des données pour le template de rappel 1h
 */
export interface Reminder1hData {
  // Informations client
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Informations de réservation
  bookingId: string;
  serviceType: 'MOVING' | 'CLEANING' | 'DELIVERY' | 'CUSTOM';
  serviceName: string;
  
  // Planning
  serviceDate: string;
  serviceTime: string;
  estimatedDuration?: number;
  serviceAddress: string;
  
  // Instructions urgentes
  preparationItems?: string[];
  
  // Contacts d'urgence
  supportPhone: string;
  teamLeaderContact?: string;
  emergencyContact?: string;
  companyName?: string;
  
  // URLs optionnelles
  trackingUrl?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

/**
 * Formate une heure avec emphase
 */
const formatTime = (timeString: string): string => {
  return timeString.replace(':', 'h');
};

export const Reminder1hEmail = ({
  customerName,
  bookingId,
  serviceName,
  serviceDate,
  serviceTime,
  serviceAddress,
  preparationItems = [
    'URGENT: Service dans 1 heure !',
    'Veuillez être présent à l\'adresse indiquée',
    'Libérez l\'accès pour notre équipe',
    'Contactez-nous immédiatement en cas de problème'
  ],
  supportPhone,
  teamLeaderContact,
  emergencyContact,
  companyName = 'Express Quote',
  trackingUrl,
  unsubscribeUrl,
  preferencesUrl
}: Reminder1hData) => {
  const formattedTime = formatTime(serviceTime);

  return (
    <Layout
      preview={`🚨 URGENT : Votre service ${serviceName} commence dans 1 heure !`}
      title={`🚨 URGENT - Service dans 1h`}
      brandName={companyName}
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      {/* Header URGENT */}
      <Section style={urgentSection}>
        <Text style={urgentText}>
          🚨 <strong>ALERTE URGENTE</strong> 🚨
        </Text>
        <Text style={urgentSubtext}>
          Votre service commence dans 1 HEURE
        </Text>
      </Section>

      {/* Salutation urgente */}
      <Section style={greetingSection}>
        <Text style={greetingTitle}>Bonjour {customerName},</Text>
        <Text style={urgentMessage}>
          <strong>IMPORTANT :</strong> Votre <strong>{serviceName}</strong> commence 
          <strong style={highlightText}> AUJOURD'HUI À {formattedTime}</strong> !
        </Text>
        <Text style={urgentMessage}>
          Notre équipe arrive dans moins d'une heure à votre adresse.
        </Text>
      </Section>

      {/* Détails critiques */}
      <Card style={urgentCard}>
        <Text style={cardTitle}>🕐 Détails URGENTS</Text>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>⏰ HEURE :</Column>
          <Column style={urgentValue}>{formattedTime} - AUJOURD'HUI</Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>📍 ADRESSE :</Column>
          <Column style={urgentValue}>{serviceAddress}</Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>🔖 RÉFÉRENCE :</Column>
          <Column style={detailValue}>{bookingId}</Column>
        </Row>
      </Card>

      {/* Instructions urgentes */}
      <Section style={instructionsSection}>
        <Text style={sectionTitle}>🚨 ACTIONS IMMÉDIATES</Text>
        
        {preparationItems.map((item, index) => (
          <Text key={index} style={urgentInstruction}>
            {index === 0 ? '🔥' : '•'} {item}
          </Text>
        ))}
      </Section>

      {/* Contacts d'urgence */}
      <Section style={contactsSection}>
        <Text style={sectionTitle}>📞 CONTACTS D'URGENCE</Text>
        
        <Card style={contactCard}>
          <Text style={contactTitle}>Support principal :</Text>
          <Text style={phoneNumber}>{supportPhone}</Text>
          
          {teamLeaderContact && (
            <>
              <Text style={contactTitle}>Chef d'équipe :</Text>
              <Text style={phoneNumber}>{teamLeaderContact}</Text>
            </>
          )}
          
          {emergencyContact && emergencyContact !== supportPhone && (
            <>
              <Text style={contactTitle}>Urgence :</Text>
              <Text style={phoneNumber}>{emergencyContact}</Text>
            </>
          )}
        </Card>
      </Section>

      {/* Suivi en temps réel */}
      {trackingUrl && (
        <Section style={trackingSection}>
          <Text style={sectionTitle}>📍 Suivi en temps réel</Text>
          <Text style={trackingText}>
            Suivez l'arrivée de notre équipe :
          </Text>
          <PrimaryButton href={trackingUrl}>
            🚚 Suivre l'équipe
          </PrimaryButton>
        </Section>
      )}

      {/* Message final urgent */}
      <Hr style={separator} />
      <Section style={finalSection}>
        <Text style={finalMessage}>
          <strong>⚠️ PRÉSENCE OBLIGATOIRE</strong>
        </Text>
        <Text style={finalText}>
          Votre présence est indispensable pour le bon déroulement du service.
          En cas d'absence, des frais de déplacement pourraient s'appliquer.
        </Text>
        <Text style={finalText}>
          <strong>Contactez-nous IMMÉDIATEMENT</strong> si vous ne pouvez pas être présent.
        </Text>
      </Section>

      {/* Footer urgent */}
      <Section style={footerSection}>
        <Text style={footerText}>
          ⏰ <strong>Rendez-vous dans 1 heure !</strong><br />
          L'équipe {companyName}
        </Text>
      </Section>
    </Layout>
  );
};

// Styles urgents
const urgentSection = {
  backgroundColor: '#ffebee',
  border: '2px solid #f44336',
  padding: '20px',
  borderRadius: '8px',
  textAlign: 'center' as const,
  margin: '0 0 24px 0'
};

const urgentText = {
  color: '#c62828',
  fontSize: '20px',
  fontWeight: 'bold' as const,
  margin: '0 0 8px 0'
};

const urgentSubtext = {
  color: '#d32f2f',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  margin: '0'
};

const greetingSection = {
  margin: '0 0 32px 0'
};

const greetingTitle = {
  color: '#2c3e50',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  margin: '0 0 16px 0'
};

const urgentMessage = {
  color: '#c62828',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  lineHeight: '1.4',
  margin: '0 0 12px 0'
};

const highlightText = {
  backgroundColor: '#fff3e0',
  padding: '2px 6px',
  borderRadius: '4px',
  color: '#e65100'
};

const urgentCard = {
  border: '2px solid #ff9800',
  backgroundColor: '#fff8e1'
};

const cardTitle = {
  color: '#e65100',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  margin: '0 0 20px 0'
};

const detailRow = {
  margin: '0 0 12px 0'
};

const detailLabel = {
  color: '#bf360c',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  width: '120px'
};

const urgentValue = {
  color: '#d84315',
  fontSize: '16px',
  fontWeight: 'bold' as const
};

const detailValue = {
  color: '#2c3e50',
  fontSize: '14px'
};

const instructionsSection = {
  margin: '32px 0'
};

const sectionTitle = {
  color: '#d32f2f',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  margin: '0 0 16px 0'
};

const urgentInstruction = {
  color: '#c62828',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  margin: '0 0 10px 0',
  paddingLeft: '8px'
};

const contactsSection = {
  margin: '32px 0'
};

const contactCard = {
  backgroundColor: '#e8f5e8',
  border: '1px solid #4caf50'
};

const contactTitle = {
  color: '#2e7d32',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  margin: '12px 0 4px 0'
};

const phoneNumber = {
  color: '#1b5e20',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  margin: '0 0 8px 0'
};

const trackingSection = {
  textAlign: 'center' as const,
  margin: '32px 0'
};

const trackingText = {
  color: '#34495e',
  fontSize: '16px',
  margin: '0 0 16px 0'
};

const separator = {
  borderColor: '#f44336',
  borderWidth: '2px',
  margin: '32px 0'
};

const finalSection = {
  textAlign: 'center' as const,
  backgroundColor: '#ffecb3',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #ffa000',
  margin: '24px 0'
};

const finalMessage = {
  color: '#e65100',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  margin: '0 0 12px 0'
};

const finalText = {
  color: '#ef6c00',
  fontSize: '15px',
  margin: '0 0 10px 0'
};

const footerSection = {
  textAlign: 'center' as const,
  margin: '32px 0 0 0'
};

const footerText = {
  color: '#d32f2f',
  fontSize: '16px',
  fontWeight: 'bold' as const
};