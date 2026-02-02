/**
 * Template email de rappel 7 jours avant service
 * 
 * Utilité :
 * - Rappel préventif envoyé 7 jours avant l'intervention
 * - Permet au client de se préparer et d'organiser son planning
 * - Confirme les détails du rendez-vous avec possibilité de modification
 * - Fournit les premières instructions de préparation
 * 
 * Technologies utilisées :
 * - React Email : Template responsive et accessible
 * - TypeScript : Validation des données de rappel
 * - Layout réutilisable : Consistance visuelle avec les autres templates
 * 
 * Cas d'usage :
 * - Envoyé automatiquement 7 jours avant le service
 * - Solution de recours pour clients email-only (sans téléphone)
 * - Permet la planification et préparation en amont
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
  SecondaryButton,
} from '../components/Layout';

/**
 * Interface des données pour le template de rappel 7 jours
 */
export interface Reminder7dData {
  // Informations client
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Informations de réservation
  bookingId: string;
  serviceType: 'MOVING' | 'MOVING_PREMIUM' | 'CUSTOM';
  serviceName: string;
  
  // Planning
  serviceDate: string;
  serviceTime: string;
  estimatedDuration?: number;
  serviceAddress: string;
  
  // Instructions et préparation
  preparationItems?: string[];
  
  // Contacts
  supportPhone: string;
  companyName?: string;
  
  // URLs optionnelles
  modifyUrl?: string;
  cancelUrl?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

/**
 * Formate une date au format français
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formate une heure
 */
const formatTime = (timeString: string): string => {
  return timeString.replace(':', 'h');
};

export const Reminder7dEmail = ({
  customerName,
  bookingId,
  serviceName,
  serviceDate,
  serviceTime,
  serviceAddress,
  preparationItems = [
    'Vérifier la disponibilité',
    'Préparer les documents nécessaires',
    'Libérer l\'accès à la zone de service'
  ],
  supportPhone,
  companyName = 'Express Quote',
  modifyUrl,
  cancelUrl,
  unsubscribeUrl,
  preferencesUrl
}: Reminder7dData) => {
  const formattedDate = formatDate(serviceDate);
  const formattedTime = formatTime(serviceTime);

  return (
    <Layout
      preview={`Rappel : Votre service ${serviceName} est prévu dans 7 jours`}
      title={`Rappel de service - ${serviceName}`}
      brandName={companyName}
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      {/* Header avec info préventive */}
      <Section style={infoSection}>
        <Text style={infoText}>
          📅 <strong>RAPPEL PRÉVENTIF</strong> - Service dans 7 jours
        </Text>
      </Section>

      {/* Salutation personnalisée */}
      <Section style={greetingSection}>
        <Text style={greetingTitle}>Bonjour {customerName},</Text>
        <Text style={greetingText}>
          Nous souhaitons vous rappeler que votre <strong>{serviceName}</strong> est prévu 
          <strong> le {formattedDate} à {formattedTime}</strong>.
        </Text>
        <Text style={greetingText}>
          Cette notification vous permet de vous organiser et de préparer votre rendez-vous.
        </Text>
      </Section>

      {/* Détails de la réservation */}
      <Card>
        <Text style={cardTitle}>📋 Récapitulatif de votre rendez-vous</Text>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>Service :</Column>
          <Column style={detailValue}>{serviceName}</Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>Date :</Column>
          <Column style={detailValue}>{formattedDate}</Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>Heure :</Column>
          <Column style={detailValue}>{formattedTime}</Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>Adresse :</Column>
          <Column style={detailValue}>{serviceAddress}</Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>Référence :</Column>
          <Column style={detailValue}>{bookingId}</Column>
        </Row>
      </Card>

      {/* Instructions de préparation */}
      <Section style={preparationSection}>
        <Text style={sectionTitle}>✅ Préparation recommandée</Text>
        <Text style={preparationIntro}>
          Voici ce que nous recommandons de faire d'ici le jour J :
        </Text>
        
        {preparationItems.map((item, index) => (
          <Text key={index} style={preparationItem}>
            • {item}
          </Text>
        ))}
      </Section>

      {/* Actions disponibles */}
      <Section style={actionsSection}>
        <Text style={sectionTitle}>🔧 Besoin de modifier ?</Text>
        <Text style={actionsText}>
          Vous avez encore le temps de modifier ou annuler votre rendez-vous si nécessaire.
        </Text>
        
        <Row style={buttonRow}>
          {modifyUrl && (
            <Column style={buttonColumn}>
              <PrimaryButton href={modifyUrl}>
                Modifier le rendez-vous
              </PrimaryButton>
            </Column>
          )}
          {cancelUrl && (
            <Column style={buttonColumn}>
              <SecondaryButton href={cancelUrl}>
                Annuler le service
              </SecondaryButton>
            </Column>
          )}
        </Row>
      </Section>

      {/* Contact */}
      <Hr style={separator} />
      <Section style={contactSection}>
        <Text style={contactTitle}>📞 Une question ?</Text>
        <Text style={contactText}>
          Notre équipe est disponible au <strong>{supportPhone}</strong>
        </Text>
        <Text style={contactText}>
          Nous vous confirmerons les détails 24h avant votre rendez-vous.
        </Text>
      </Section>

      {/* Footer */}
      <Section style={footerSection}>
        <Text style={footerText}>
          À bientôt,<br />
          L'équipe {companyName}
        </Text>
      </Section>
    </Layout>
  );
};

// Styles
const infoSection = {
  backgroundColor: '#e3f2fd',
  padding: '16px',
  borderRadius: '8px',
  textAlign: 'center' as const,
  margin: '0 0 24px 0'
};

const infoText = {
  color: '#1565c0',
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

const greetingText = {
  color: '#34495e',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 12px 0'
};

const cardTitle = {
  color: '#2c3e50',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  margin: '0 0 20px 0'
};

const detailRow = {
  margin: '0 0 12px 0'
};

const detailLabel = {
  color: '#7f8c8d',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  width: '120px'
};

const detailValue = {
  color: '#2c3e50',
  fontSize: '14px'
};

const preparationSection = {
  margin: '32px 0'
};

const sectionTitle = {
  color: '#2c3e50',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  margin: '0 0 16px 0'
};

const preparationIntro = {
  color: '#34495e',
  fontSize: '16px',
  margin: '0 0 16px 0'
};

const preparationItem = {
  color: '#34495e',
  fontSize: '15px',
  margin: '0 0 8px 0',
  paddingLeft: '8px'
};

const actionsSection = {
  margin: '32px 0'
};

const actionsText = {
  color: '#34495e',
  fontSize: '16px',
  margin: '0 0 20px 0'
};

const buttonRow = {
  margin: '20px 0'
};

const buttonColumn = {
  width: '50%',
  padding: '0 8px'
};

const separator = {
  borderColor: '#e1e8ed',
  margin: '32px 0'
};

const contactSection = {
  textAlign: 'center' as const,
  margin: '24px 0'
};

const contactTitle = {
  color: '#2c3e50',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  margin: '0 0 12px 0'
};

const contactText = {
  color: '#34495e',
  fontSize: '14px',
  margin: '0 0 8px 0'
};

const footerSection = {
  textAlign: 'center' as const,
  margin: '32px 0 0 0'
};

const footerText = {
  color: '#7f8c8d',
  fontSize: '14px',
  fontStyle: 'italic' as const
};