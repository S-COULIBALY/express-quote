/**
 * Template email de rappel de service
 * 
 * Utilité :
 * - Rappelle une intervention prévue dans les prochaines 24-48h
 * - Confirme les derniers détails et contacts
 * - Permet les modifications de dernière minute
 * - Fournit les instructions finales de préparation
 * 
 * Technologies utilisées :
 * - React Email : Template responsive optimisé
 * - Formatage intelligent : Compte à rebours dynamique
 * - Conditional rendering : Contenu adapté au type de service
 * - Call-to-actions clairs : Modification/annulation facile
 * 
 * Cas d'usage :
 * - Envoyé 24h avant le service
 * - Rappel météo pour services extérieurs
 * - Vérification de disponibilité client
 * - Instructions de dernière minute
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
 * Interface des données pour le template de rappel de service
 */
export interface ServiceReminderData {
  // Identifiant de réservation
  bookingId: string;

  // Destinataire principal
  email: string;

  // Informations client (pour prestataires le jour J)
  customerName?: string;
  customerPhone?: string;

  // Informations de réservation
  bookingReference?: string;
  serviceType?: 'MOVING' | 'CLEANING' | 'DELIVERY' | 'CUSTOM';
  serviceName?: string;

  // Planning (dans moins de 48h)
  serviceDate?: string;
  serviceTime?: string;
  estimatedDuration?: number;
  hoursUntilService?: number; // pour le compte à rebours

  // Adresses
  primaryAddress?: string;
  secondaryAddress?: string;

  // Équipe confirmée
  teamLeaderName?: string;
  teamLeaderPhone?: string;
  teamSize?: number;
  vehicleInfo?: string;

  // Météo (pour services extérieurs)
  weatherForecast?: {
    condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
    temperature: number;
    description: string;
  };

  // Préparation finale
  finalChecklist?: string[];
  lastMinuteInstructions?: string[];

  // Contacts et actions
  teamLeaderContact?: string;
  emergencyContact?: string;
  modifyUrl?: string;
  cancelUrl?: string;
  trackingUrl?: string;

  // Configuration
  companyName?: string;
  allowsModification?: boolean;
  allowsCancellation?: boolean;
  cancellationDeadlineHours?: number; // ex: 12h avant

  // 🆕 SUPPORT PRESTATAIRES JOUR J
  isProfessionalReminder?: boolean;
  professionalCompany?: string;
  supportUrl?: string;
  urgentContact?: string;

  // Détails de rappel spécifique
  reminderDetails?: {
    serviceName: string;
    appointmentDate: string;
    appointmentTime: string;
    address: string;
    preparationInstructions?: string[];
  };

  // 🔓 DONNÉES COMPLÈTES RÉVÉLÉES LE JOUR J (pour prestataires)
  fullClientData?: {
    customerName: string;           // ← Nom complet révélé
    customerPhone: string;          // ← Téléphone révélé
    fullPickupAddress: string;      // ← Adresse complète
    fullDeliveryAddress?: string;   // ← Adresse livraison complète
    specialInstructions?: string;   // ← Instructions spéciales
  };
}

/**
 * Formate une date en français avec jour et heure
 */
const formatDateTime = (dateString: string, timeString: string): string => {
  const date = new Date(`${dateString}T${timeString}`);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Génère un message de compte à rebours
 */
const getCountdownMessage = (hours: number): { message: string; urgency: 'low' | 'medium' | 'high' } => {
  if (hours <= 8) {
    return { 
      message: `⏰ C'est aujourd'hui ! Dans ${hours}h`, 
      urgency: 'high' 
    };
  } else if (hours <= 24) {
    return { 
      message: `⏱️ C'est demain ! Dans ${hours}h`, 
      urgency: 'medium' 
    };
  } else {
    return { 
      message: `📅 Dans ${Math.round(hours)}h (${Math.round(hours/24)} jour${Math.round(hours/24) > 1 ? 's' : ''})`, 
      urgency: 'low' 
    };
  }
};

/**
 * Obtient l'emoji météo
 */
const getWeatherEmoji = (condition: string): string => {
  switch (condition) {
    case 'sunny': return '☀️';
    case 'cloudy': return '☁️';
    case 'rainy': return '🌧️';
    case 'stormy': return '⛈️';
    default: return '🌤️';
  }
};

/**
 * Obtient la couleur d'urgence
 */
const getUrgencyColor = (urgency: string): string => {
  switch (urgency) {
    case 'high': return '#dc2626';
    case 'medium': return '#f59e0b';
    default: return '#3b82f6';
  }
};

/**
 * Template React Email pour le rappel de service
 */
export const ServiceReminder: React.FC<ServiceReminderData> = ({
  bookingId,
  email,
  customerName,
  customerPhone,
  bookingReference,
  serviceType,
  serviceName,
  serviceDate,
  serviceTime,
  estimatedDuration,
  hoursUntilService = 24,
  primaryAddress,
  secondaryAddress,
  teamLeaderName,
  teamLeaderPhone,
  teamSize,
  vehicleInfo,
  weatherForecast,
  finalChecklist = [],
  lastMinuteInstructions = [],
  teamLeaderContact,
  emergencyContact,
  modifyUrl,
  cancelUrl,
  trackingUrl,
  companyName = 'Express Quote',
  allowsModification = true,
  allowsCancellation = true,
  cancellationDeadlineHours = 12,

  // 🆕 Support prestataires
  isProfessionalReminder = false,
  professionalCompany,
  supportUrl,
  urgentContact,
  reminderDetails,
  fullClientData,
}) => {
  const countdown = getCountdownMessage(hoursUntilService);
  const urgencyColor = getUrgencyColor(countdown.urgency);
  const canModify = allowsModification && hoursUntilService > cancellationDeadlineHours;
  const canCancel = allowsCancellation && hoursUntilService > cancellationDeadlineHours;
  const isOutdoorService = serviceType === 'MOVING' || serviceType === 'DELIVERY';

  // 🎯 Mode prestataire : utiliser les données révélées le jour J
  const displayName = isProfessionalReminder && fullClientData
    ? fullClientData.customerName
    : customerName;

  const displayPhone = isProfessionalReminder && fullClientData
    ? fullClientData.customerPhone
    : customerPhone;

  const displayPickupAddress = isProfessionalReminder && fullClientData
    ? fullClientData.fullPickupAddress
    : primaryAddress || reminderDetails?.address;

  const displayDeliveryAddress = isProfessionalReminder && fullClientData
    ? fullClientData.fullDeliveryAddress
    : secondaryAddress;

  const displaySpecialInstructions = isProfessionalReminder && fullClientData
    ? fullClientData.specialInstructions
    : undefined;

  // Titre et contenu adaptés
  const emailTitle = isProfessionalReminder
    ? `Mission ${reminderDetails?.serviceName || serviceName} - Jour J`
    : `Rappel: ${serviceName} ${serviceDate ? formatDateTime(serviceDate, serviceTime || '') : ''}`;

  const greetingName = isProfessionalReminder
    ? (professionalCompany || companyName)
    : displayName;

  return (
    <Layout
      preview={emailTitle}
      title={emailTitle}
      brandName={companyName}
    >
      {/* En-tête avec compte à rebours */}
      <Section style={{ 
        textAlign: 'center', 
        backgroundColor: urgencyColor, 
        color: 'white',
        padding: '24px',
        borderRadius: '8px',
        margin: '0 0 24px 0'
      }}>
        <Text style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          margin: '0 0 8px 0',
          color: 'white'
        }}>
          {countdown.message}
        </Text>
        <Text style={{ 
          fontSize: '16px', 
          margin: '0',
          color: 'white',
          opacity: 0.9
        }}>
          {serviceName}
        </Text>
      </Section>

      <Title>
        👋 Bonjour {greetingName} !
      </Title>

      <Paragraph>
        {isProfessionalReminder ? (
          <>
            C'est le jour J ! Votre mission commence bientôt.
            Toutes les informations client sont maintenant disponibles. 🎯
          </>
        ) : (
          <>
            Nous voulions vous rappeler votre service prévu très bientôt.
            Tout est prêt de notre côté ! 🚀
          </>
        )}
      </Paragraph>

      {/* 🔓 Révélation des données client pour prestataires */}
      {isProfessionalReminder && fullClientData && (
        <Card highlight>
          <Subtitle>🔓 Informations Client Complètes</Subtitle>

          <Text style={{ margin: '8px 0' }}>
            <strong>Client :</strong> {fullClientData.customerName}
          </Text>

          <Text style={{ margin: '8px 0' }}>
            <strong>Téléphone :</strong>{' '}
            <Link href={`tel:${fullClientData.customerPhone}`} style={{ color: '#007ee6' }}>
              {fullClientData.customerPhone}
            </Link>
          </Text>

          {displaySpecialInstructions && (
            <Text style={{
              margin: '16px 0',
              padding: '12px',
              backgroundColor: '#fef3cd',
              border: '1px solid #fbbf24',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              ⚠️ <strong>Instructions spéciales :</strong> {displaySpecialInstructions}
            </Text>
          )}
        </Card>
      )}

      {/* Récapitulatif du rendez-vous */}
      <Card highlight>
        <Subtitle>📅 Récapitulatif de votre rendez-vous</Subtitle>
        
        <Text style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#007ee6',
          margin: '16px 0'
        }}>
          {reminderDetails
            ? `${reminderDetails.appointmentDate} à ${reminderDetails.appointmentTime}`
            : serviceDate && serviceTime
              ? formatDateTime(serviceDate, serviceTime)
              : 'À confirmer'
          }
        </Text>

        <Text style={{ margin: '8px 0' }}>
          <strong>Service :</strong> {reminderDetails?.serviceName || serviceName}
        </Text>

        {estimatedDuration && (
          <Text style={{ margin: '8px 0' }}>
            <strong>Durée estimée :</strong> {estimatedDuration} heure{estimatedDuration > 1 ? 's' : ''}
          </Text>
        )}

        <Text style={{ margin: '8px 0' }}>
          <strong>Référence :</strong> {bookingReference || bookingId}
        </Text>
      </Card>

      {/* Informations de l'équipe */}
      <Card>
        <Subtitle>👥 Votre équipe confirmée</Subtitle>
        
        <Row>
          <Column>
            <Text style={{ margin: '8px 0' }}>
              <strong>Chef d'équipe :</strong> {teamLeaderName}
            </Text>
            <Text style={{ margin: '8px 0' }}>
              <strong>Contact direct :</strong>{' '}
              <Link href={`tel:${teamLeaderPhone}`} style={{ color: '#007ee6' }}>
                {teamLeaderPhone}
              </Link>
            </Text>
            <Text style={{ margin: '8px 0' }}>
              <strong>Taille de l'équipe :</strong> {teamSize} personne{teamSize > 1 ? 's' : ''}
            </Text>
            {vehicleInfo && (
              <Text style={{ margin: '8px 0' }}>
                <strong>Véhicule :</strong> {vehicleInfo}
              </Text>
            )}
          </Column>
        </Row>
      </Card>

      {/* Adresses */}
      {displayPickupAddress && (
        <Card>
          <Subtitle>📍 Lieu{displayDeliveryAddress ? 'x' : ''} de service</Subtitle>

          <Text style={{ margin: '8px 0' }}>
            <strong>{displayDeliveryAddress ? 'Adresse de départ :' : 'Adresse :'}</strong>
          </Text>
          <Text style={{ margin: '0 0 16px 0', fontSize: '15px', lineHeight: '1.4' }}>
            {displayPickupAddress}
          </Text>

          {displayDeliveryAddress && (
            <>
              <Text style={{ margin: '8px 0' }}>
                <strong>Adresse de livraison :</strong>
              </Text>
              <Text style={{ margin: '0 0 16px 0', fontSize: '15px', lineHeight: '1.4' }}>
                {displayDeliveryAddress}
              </Text>
            </>
          )}
        </Card>
      )}

      {/* Météo pour services extérieurs */}
      {isOutdoorService && weatherForecast && (
        <Card>
          <Subtitle>🌤️ Prévisions météo</Subtitle>
          
          <Row>
            <Column align="center" width="80">
              <Text style={{ fontSize: '48px', margin: '0' }}>
                {getWeatherEmoji(weatherForecast.condition)}
              </Text>
            </Column>
            <Column>
              <Text style={{ margin: '8px 0', fontSize: '18px', fontWeight: '600' }}>
                {weatherForecast.temperature}°C
              </Text>
              <Text style={{ margin: '0', fontSize: '14px' }}>
                {weatherForecast.description}
              </Text>
            </Column>
          </Row>
          
          {weatherForecast.condition === 'rainy' || weatherForecast.condition === 'stormy' && (
            <Text style={{ 
              margin: '16px 0 0 0', 
              padding: '12px',
              backgroundColor: '#fef3cd',
              border: '1px solid #fbbf24',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              ⚠️ <strong>Météo défavorable prévue.</strong> Nous vous contactons si nous devons 
              reporter l'intervention pour votre sécurité et celle de notre équipe.
            </Text>
          )}
        </Card>
      )}

      {/* Checklist finale et instructions de préparation */}
      {(finalChecklist.length > 0 || (reminderDetails?.preparationInstructions && reminderDetails.preparationInstructions.length > 0)) && (
        <Card highlight>
          <Subtitle>✅ Checklist de dernière minute</Subtitle>

          <Text style={{ margin: '0 0 16px 0' }}>
            Pour que tout se passe parfaitement :
          </Text>

          <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '15px', lineHeight: '1.6' }}>
            {finalChecklist.map((item, index) => (
              <li key={`final-${index}`} style={{ marginBottom: '8px' }}>
                {item}
              </li>
            ))}

            {reminderDetails?.preparationInstructions?.map((instruction, index) => (
              <li key={`prep-${index}`} style={{ marginBottom: '8px' }}>
                {instruction}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Instructions de dernière minute */}
      {lastMinuteInstructions && lastMinuteInstructions.length > 0 && (
        <Card>
          <Subtitle>📝 Instructions importantes</Subtitle>
          
          {lastMinuteInstructions.map((instruction, index) => (
            <Text key={index} style={{ 
              margin: '12px 0',
              padding: '12px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              💡 {instruction}
            </Text>
          ))}
        </Card>
      )}

      {/* Actions rapides */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Row>
          <Column align="center">
            {isProfessionalReminder && displayPhone ? (
              <PrimaryButton href={`tel:${displayPhone}`}>
                📞 Appeler le client
              </PrimaryButton>
            ) : teamLeaderPhone ? (
              <PrimaryButton href={`tel:${teamLeaderPhone}`}>
                📞 Appeler l'équipe
              </PrimaryButton>
            ) : null}
          </Column>
        </Row>

        <Row style={{ marginTop: '16px' }}>
          {trackingUrl && !isProfessionalReminder && (
            <Column align="center" style={{ paddingRight: '8px' }}>
              <SecondaryButton href={trackingUrl}>
                📍 Suivre l'équipe
              </SecondaryButton>
            </Column>
          )}

          {canModify && modifyUrl && !isProfessionalReminder && (
            <Column align="center" style={{ paddingLeft: '8px' }}>
              <SecondaryButton href={modifyUrl}>
                ✏️ Modifier
              </SecondaryButton>
            </Column>
          )}

          {isProfessionalReminder && supportUrl && (
            <Column align="center">
              <SecondaryButton href={supportUrl}>
                🆘 Support Express Quote
              </SecondaryButton>
            </Column>
          )}
        </Row>
      </Section>

      <Separator />

      {/* Contacts d'urgence */}
      <Card>
        <Subtitle>🆘 Contacts importants</Subtitle>

        {isProfessionalReminder ? (
          <>
            {displayPhone && (
              <Row style={{ marginBottom: '12px' }}>
                <Column>
                  <Text><strong>Client :</strong></Text>
                  <Text style={{ fontSize: '18px', fontWeight: '600', color: '#007ee6' }}>
                    📞 <Link href={`tel:${displayPhone}`}>{displayPhone}</Link>
                  </Text>
                  <SmallText>({displayName})</SmallText>
                </Column>
              </Row>
            )}

            <Row>
              <Column>
                <Text><strong>Support Express Quote :</strong></Text>
                <Text style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>
                  📞 <Link href={`tel:${urgentContact || emergencyContact}`}>
                    {urgentContact || emergencyContact}
                  </Link>
                </Text>
                <SmallText>Pour tout imprévu technique</SmallText>
              </Column>
            </Row>
          </>
        ) : (
          <>
            {teamLeaderPhone && (
              <Row style={{ marginBottom: '12px' }}>
                <Column>
                  <Text><strong>Équipe sur site :</strong></Text>
                  <Text style={{ fontSize: '18px', fontWeight: '600', color: '#007ee6' }}>
                    📞 <Link href={`tel:${teamLeaderPhone}`}>{teamLeaderPhone}</Link>
                  </Text>
                  <SmallText>({teamLeaderName})</SmallText>
                </Column>
              </Row>
            )}

            <Row>
              <Column>
                <Text><strong>Urgence 24h/24 :</strong></Text>
                <Text style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>
                  📞 <Link href={`tel:${emergencyContact}`}>{emergencyContact}</Link>
                </Text>
                <SmallText>Pour tout imprévu</SmallText>
              </Column>
            </Row>
          </>
        )}
      </Card>

      {/* Gestion de la réservation (clients uniquement) */}
      {!isProfessionalReminder && (canModify || canCancel) && (
        <>
          <Separator />
          
          <Section>
            <Subtitle>⚙️ Gérer ma réservation</Subtitle>
            
            <Text style={{ marginBottom: '16px' }}>
              Vous pouvez encore modifier ou annuler jusqu'à {cancellationDeadlineHours}h avant l'intervention.
            </Text>
            
            {hoursUntilService <= cancellationDeadlineHours ? (
              <Text style={{ 
                color: '#dc2626', 
                fontWeight: '600',
                padding: '12px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px'
              }}>
                ⏰ Délai de modification dépassé. Contactez-nous directement pour tout changement.
              </Text>
            ) : (
              <Row>
                <Column align="center">
                  {canModify && modifyUrl && (
                    <Text>
                      <Link href={modifyUrl} style={{ color: '#007ee6' }}>
                        ✏️ Modifier ma réservation
                      </Link>
                    </Text>
                  )}
                </Column>
                <Column align="center">
                  {canCancel && cancelUrl && (
                    <Text>
                      <Link href={cancelUrl} style={{ color: '#dc2626' }}>
                        ❌ Annuler ma réservation
                      </Link>
                    </Text>
                  )}
                </Column>
              </Row>
            )}
          </Section>
        </>
      )}

      <Paragraph style={{
        marginTop: '32px',
        textAlign: 'center',
        fontSize: '18px',
        color: '#16a34a',
        fontWeight: '600'
      }}>
        {isProfessionalReminder ? 'Bonne mission ! 🎯' : 'À très bientôt ! 👋'}
      </Paragraph>

      <SmallText style={{ textAlign: 'center', marginTop: '16px' }}>
        Équipe {companyName}
      </SmallText>
    </Layout>
  );
};

export default ServiceReminder;