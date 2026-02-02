/**
 * Template email de rappel 24h avant service
 * 
 * Utilité :
 * - Rappel important envoyé 24h avant l'intervention
 * - Confirme les détails du rendez-vous (date, heure, adresse)
 * - Fournit les instructions de préparation
 * - Inclut les contacts de l'équipe
 * - Alerte sur l'urgence du rendez-vous
 * 
 * Technologies utilisées :
 * - React Email : Template responsive et accessible
 * - TypeScript : Validation des données de rappel
 * - Layout réutilisable : Consistance visuelle avec les autres templates
 * - Formatage intelligent : Dates, heures, adresses
 * 
 * Cas d'usage :
 * - Envoyé automatiquement 24h avant le service
 * - Complète le SMS de rappel pour plus de détails
 * - Contient les instructions spécifiques de préparation
 * - Permet la modification/annulation en urgence
 */

import * as React from 'react';
import {
  Section,
  Row,
  Column,
  Text,
  Link,
  Img,
  Hr,
} from '@react-email/components';

import {
  Layout,
  Title,
  Subtitle,
  Paragraph,
  SmallText,
  PrimaryButton,
  SecondaryButton,
  Card,
  Separator,
} from '../components/Layout';

/**
 * Interface des données pour le template de rappel 24h
 */
export interface Reminder24hData {
  // Informations client
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Informations de réservation
  bookingId: string;
  bookingReference: string;
  serviceType: 'MOVING' | 'MOVING_PREMIUM' | 'CUSTOM';
  serviceName: string;
  
  // Planning
  serviceDate: string;
  serviceTime: string;
  estimatedDuration: number; // en heures
  endTime?: string; // calculé ou fourni
  
  // Adresses
  serviceAddress: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  
  // Équipe et logistique
  teamSize: number;
  teamLeader?: {
    name: string;
    phone?: string;
    photo?: string;
  };
  vehicleInfo?: {
    type: string; // "Camion 12m³", "Utilitaire", etc.
    licensePlate?: string;
  };
  
  // Instructions spécifiques
  preparationInstructions: string[];
  accessInstructions?: string;
  specialRequirements?: string;
  
  // Contacts d'urgence
  teamLeaderContact: string;
  emergencyContact: string;
  supportPhone: string;
  
  // URLs d'action
  modifyUrl?: string;
  cancelUrl?: string;
  trackingUrl?: string;
  
  // Configuration
  companyName?: string;
  allowsModification: boolean;
  allowsCancellation: boolean;
  cancellationDeadlineHours: number;
  
  // Tracking et personnalisation
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

/**
 * Formate une date en français
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formate une heure en français
 */
const formatTime = (timeStr: string): string => {
  return timeStr;
};

/**
 * Calcule l'heure de fin du service
 */
const calculateEndTime = (startTime: string, duration: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate.getTime() + (duration * 60 * 60 * 1000));
  return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
};

export const Reminder24hEmail = ({
  customerName,
  customerEmail,
  customerPhone,
  bookingId,
  bookingReference,
  serviceType,
  serviceName,
  serviceDate,
  serviceTime,
  estimatedDuration,
  endTime,
  serviceAddress,
  pickupAddress,
  deliveryAddress,
  teamSize,
  teamLeader,
  vehicleInfo,
  preparationInstructions,
  accessInstructions,
  specialRequirements,
  teamLeaderContact,
  emergencyContact,
  supportPhone,
  modifyUrl,
  cancelUrl,
  trackingUrl,
  companyName = 'Express Quote',
  allowsModification = true,
  allowsCancellation = true,
  cancellationDeadlineHours = 12,
  unsubscribeUrl,
  preferencesUrl
}: Reminder24hData) => {
  const finalEndTime = endTime || calculateEndTime(serviceTime, estimatedDuration);
  const formattedDate = formatDate(serviceDate);
  const formattedTime = formatTime(serviceTime);
  
  return (
    <Layout
      preview={`Rappel important : Votre service ${serviceName} est prévu demain à ${formattedTime}`}
      title={`Rappel de service - ${serviceName}`}
      brandName={companyName}
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      {/* Header avec alerte d'urgence */}
      <Section style={alertSection}>
        <Text style={alertText}>
          ⏰ <strong>RAPPEL IMPORTANT</strong> - Votre service est prévu demain
        </Text>
      </Section>

      {/* Salutation personnalisée */}
      <Section style={greetingSection}>
        <Text style={greetingTitle}>Bonjour {customerName},</Text>
        <Text style={greetingText}>
          Nous vous rappelons que votre <strong>{serviceName}</strong> est prévu 
          <strong> demain, le {formattedDate} à {formattedTime}</strong>.
        </Text>
      </Section>

      {/* Détails de la réservation */}
      <Section style={detailsCard}>
        <Text style={cardTitle}>📋 Détails de votre rendez-vous</Text>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>Service :</Column>
          <Column style={detailValue}>{serviceName}</Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>Référence :</Column>
          <Column style={detailValue}>{bookingReference}</Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>Date :</Column>
          <Column style={detailValue}>{formattedDate}</Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>Heure :</Column>
          <Column style={detailValue}>{formattedTime} - {finalEndTime}</Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>Durée :</Column>
          <Column style={detailValue}>{estimatedDuration}h</Column>
        </Row>
        
        <Row style={detailRow}>
          <Column style={detailLabel}>Adresse :</Column>
          <Column style={detailValue}>{serviceAddress}</Column>
        </Row>
        
        {pickupAddress && (
          <Row style={detailRow}>
            <Column style={detailLabel}>Adresse de départ :</Column>
            <Column style={detailValue}>{pickupAddress}</Column>
          </Row>
        )}
        
        {deliveryAddress && (
          <Row style={detailRow}>
            <Column style={detailLabel}>Adresse d'arrivée :</Column>
            <Column style={detailValue}>{deliveryAddress}</Column>
          </Row>
        )}
        
        <Row style={detailRow}>
          <Column style={detailLabel}>Équipe :</Column>
          <Column style={detailValue}>{teamSize} personne{teamSize > 1 ? 's' : ''}</Column>
        </Row>
        
        {vehicleInfo && (
          <Row style={detailRow}>
            <Column style={detailLabel}>Véhicule :</Column>
            <Column style={detailValue}>
              {vehicleInfo.type}
              {vehicleInfo.licensePlate && ` (${vehicleInfo.licensePlate})`}
            </Column>
          </Row>
        )}
      </Section>

      {/* Instructions de préparation */}
      <Section style={preparationCard}>
        <Text style={cardTitle}>✅ Préparatifs recommandés</Text>
        <Text style={preparationText}>
          Pour que votre service se déroule dans les meilleures conditions :
        </Text>
        <ul style={instructionList}>
          {preparationInstructions.map((instruction, index) => (
            <li key={index} style={instructionItem}>{instruction}</li>
          ))}
        </ul>
        
        {accessInstructions && (
          <>
            <Hr style={{ borderColor: '#e5e7eb', margin: '16px 0' }} />
            <Text style={accessTitle}>🚪 Instructions d'accès :</Text>
            <Text style={accessText}>{accessInstructions}</Text>
          </>
        )}
        
        {specialRequirements && (
          <>
            <Hr style={{ borderColor: '#e5e7eb', margin: '16px 0' }} />
            <Text style={requirementsTitle}>⚠️ Exigences particulières :</Text>
            <Text style={requirementsText}>{specialRequirements}</Text>
          </>
        )}
      </Section>

      {/* Contacts de l'équipe */}
      <Section style={contactCard}>
        <Text style={cardTitle}>📞 Contact de l'équipe</Text>
        
        {teamLeader && (
          <Row style={contactRow}>
            <Column style={contactLabel}>Chef d'équipe :</Column>
            <Column style={contactValue}>
              {teamLeader.name}
              {teamLeader.phone && ` - ${teamLeader.phone}`}
            </Column>
          </Row>
        )}
        
        <Row style={contactRow}>
          <Column style={contactLabel}>Contact équipe :</Column>
          <Column style={contactValue}>{teamLeaderContact}</Column>
        </Row>
        
        <Row style={contactRow}>
          <Column style={contactLabel}>Urgences :</Column>
          <Column style={contactValue}>{emergencyContact}</Column>
        </Row>
        
        <Row style={contactRow}>
          <Column style={contactLabel}>Support :</Column>
          <Column style={contactValue}>{supportPhone}</Column>
        </Row>
      </Section>

      {/* Actions rapides */}
      {(allowsModification || allowsCancellation) && (
        <Section style={actionsSection}>
          <Text style={actionsTitle}>🔧 Actions rapides</Text>
          
          <Row style={buttonRow}>
            {allowsModification && modifyUrl && (
              <Column style={buttonColumn}>
                <SecondaryButton href={modifyUrl}>
                  Modifier le rendez-vous
                </SecondaryButton>
              </Column>
            )}
            
            {allowsCancellation && cancelUrl && (
              <Column style={buttonColumn}>
                <SecondaryButton href={cancelUrl}>
                  Annuler le service
                </SecondaryButton>
              </Column>
            )}
          </Row>
          
          {trackingUrl && (
            <Row style={buttonRow}>
              <Column style={buttonColumn}>
                <PrimaryButton href={trackingUrl}>
                  Suivre le service
                </PrimaryButton>
              </Column>
            </Row>
          )}
        </Section>
      )}

      {/* Alerte d'urgence */}
      <Section style={urgencyCard}>
        <Text style={urgencyText}>
          ⚠️ <strong>Important :</strong> Si vous devez annuler ou reporter votre rendez-vous, 
          merci de nous prévenir au plus vite (délai de {cancellationDeadlineHours}h).
        </Text>
      </Section>
    </Layout>
  );
};

// Styles spécifiques au template de rappel 24h
const alertSection = {
  backgroundColor: '#fef3c7',
  border: '2px solid #f59e0b',
  borderRadius: '8px',
  padding: '16px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const alertText = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
};

const greetingSection = {
  margin: '0 0 24px',
};

const greetingTitle = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const greetingText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
};

const detailsCard = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '24px',
  margin: '0 0 24px',
};

const preparationCard = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #bae6fd',
  borderRadius: '8px',
  padding: '24px',
  margin: '0 0 24px',
};

const contactCard = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '24px',
  margin: '0 0 24px',
};

const urgencyCard = {
  backgroundColor: '#fef2f2',
  border: '2px solid #fca5a5',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const cardTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const detailRow = {
  margin: '8px 0',
  display: 'flex',
  alignItems: 'flex-start',
};

const detailLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  width: '140px',
  flexShrink: 0,
};

const detailValue = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '500',
  flex: 1,
};

const preparationText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 12px',
};

const instructionList = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 16px',
  paddingLeft: '20px',
};

const instructionItem = {
  margin: '6px 0',
};

const accessTitle = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '16px 0 8px',
};

const accessText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const requirementsTitle = {
  color: '#dc2626',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '16px 0 8px',
};

const requirementsText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const contactRow = {
  margin: '8px 0',
  display: 'flex',
  alignItems: 'flex-start',
};

const contactLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  width: '140px',
  flexShrink: 0,
};

const contactValue = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '500',
  flex: 1,
};

const actionsSection = {
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const actionsTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const buttonRow = {
  margin: '12px 0',
};

const buttonColumn = {
  padding: '0 8px',
};

const urgencyText = {
  color: '#dc2626',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '20px',
};

export default Reminder24hEmail;
