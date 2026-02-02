/**
 * Template React Email pour confirmer l'acceptation d'une mission par un professionnel
 * 
 * Utilité :
 * - Confirme l'acceptation d'une mission par un professionnel
 * - Fournit tous les détails de la mission acceptée
 * - Inclut les prochaines étapes et contacts
 * - Guide vers les actions de gestion de mission
 * 
 * Technologies utilisées :
 * - React Email : Template responsive et accessible
 * - TypeScript : Validation des données de mission
 * - Formatage intelligent : Dates, heures, montants
 * - Rendu conditionnel : Informations client selon timing
 * 
 * Cas d'usage :
 * - Envoyé après acceptation d'une mission par un professionnel
 * - Contient les détails complets de la mission
 * - Informations client disponibles 24h avant
 * - Guide les prochaines étapes
 */

import * as React from 'react';
import {
  Section,
  Row,
  Column,
  Text,
  Link,
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
 * Interface des données pour le template de confirmation d'acceptation de mission
 */
export interface MissionAcceptedConfirmationData {
  // Informations professionnel
  professionalName: string;
  professionalEmail: string;
  professionalPhone?: string;
  
  // Informations mission
  attributionId: string;
  bookingReference: string;
  serviceType: 'MOVING' | 'MOVING_PREMIUM' | 'CUSTOM';
  serviceName?: string;
  totalAmount: number;
  currency?: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedDuration?: number; // en heures
  location: string;
  
  // Informations client (partielles jusqu'à 24h avant)
  customerInitials: string;
  customerPhone?: string; // Disponible 24h avant
  customerEmail?: string; // Disponible 24h avant
  customerName?: string; // Disponible 24h avant
  
  // Détails mission
  description: string;
  requirements: string[];
  specialInstructions?: string;
  
  // Équipe et logistique
  teamSize?: number;
  vehicleRequired?: boolean;
  equipmentRequired?: string[];
  
  // URLs d'action
  missionDetailsUrl: string;
  dashboardUrl: string;
  cancelUrl: string;
  trackingUrl?: string;
  supportUrl?: string;
  
  // Informations de contact
  supportEmail: string;
  supportPhone: string;
  
  // Métadonnées
  acceptedAt: string;
  informationAvailableAt: string; // 24h avant
  missionStartTime?: string; // calculé
  
  // Configuration
  companyName?: string;
  allowsCancellation: boolean;
  cancellationDeadlineHours: number;
  
  // Tracking et personnalisation
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

/**
 * Formate un prix avec la devise
 */
const formatPrice = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formate une date en français
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Formate une heure
 */
const formatTime = (timeString: string): string => {
  return timeString.replace(':', 'h');
};

/**
 * Obtient l'emoji correspondant au type de service
 */
const getServiceEmoji = (serviceType: string): string => {
  switch (serviceType) {
    case 'MOVING':
    case 'MOVING_PREMIUM': return '📦';
    case 'CUSTOM': return '⚡';
    default: return '📦';
  }
};

/**
 * Obtient le nom d'affichage du service
 */
const getServiceDisplayName = (serviceType: string): string => {
  switch (serviceType) {
    case 'MOVING': return 'Déménagement';
    case 'MOVING_PREMIUM': return 'Déménagement premium';
    case 'CUSTOM': return 'Service personnalisé';
    default: return serviceType || 'Service';
  }
};

/**
 * Calcule l'heure de fin si non fournie
 */
const calculateEndTime = (startTime: string, duration: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);
  return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
};

/**
 * Template React Email pour la confirmation d'acceptation de mission
 */
export const MissionAcceptedConfirmation: React.FC<MissionAcceptedConfirmationData> = ({
  professionalName,
  professionalEmail,
  professionalPhone,
  attributionId,
  bookingReference,
  serviceType,
  serviceName,
  totalAmount,
  currency = 'EUR',
  scheduledDate,
  scheduledTime,
  estimatedDuration,
  location,
  customerInitials,
  customerPhone,
  customerEmail,
  customerName,
  description,
  requirements = [],
  specialInstructions,
  teamSize,
  vehicleRequired,
  equipmentRequired = [],
  missionDetailsUrl,
  dashboardUrl,
  cancelUrl,
  trackingUrl,
  supportUrl,
  supportEmail,
  supportPhone,
  acceptedAt,
  informationAvailableAt,
  missionStartTime,
  companyName = 'Express Quote',
  allowsCancellation = true,
  cancellationDeadlineHours = 24,
  unsubscribeUrl,
  preferencesUrl,
}) => {
  const serviceEmoji = getServiceEmoji(serviceType);
  const serviceDisplayName = serviceName || getServiceDisplayName(serviceType);
  const hasCustomerContact = !!(customerName && customerEmail);
  const finalEndTime = estimatedDuration ? calculateEndTime(scheduledTime, estimatedDuration) : null;

  return (
    <Layout
      preview={`✅ Mission ${serviceDisplayName} acceptée - ${bookingReference} - ${formatPrice(totalAmount, currency)}`}
      title={`Mission acceptée - ${bookingReference}`}
      brandName={companyName}
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      {/* En-tête de confirmation */}
      <Title>
        {serviceEmoji} Mission acceptée !
      </Title>
      
      <Paragraph>
        Félicitations <strong>{professionalName}</strong> !
      </Paragraph>
      
      <Paragraph>
        Vous avez accepté la mission <strong>{bookingReference}</strong> pour un {serviceDisplayName}.
        Acceptée le {acceptedAt}.
      </Paragraph>

      {/* Récapitulatif de la mission */}
      <Card highlight>
        <Subtitle>📋 Récapitulatif de la mission</Subtitle>
        
        <Text style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a', margin: '16px 0' }}>
          {formatPrice(totalAmount, currency)}
        </Text>
        
        <Row style={{ marginTop: '16px' }}>
          <Column>
            <SmallText><strong>Référence :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
              {bookingReference}
            </Text>
          </Column>
          <Column align="right">
            <SmallText><strong>Service :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
              {serviceDisplayName}
            </Text>
          </Column>
        </Row>
        
        <Row style={{ marginTop: '16px' }}>
          <Column>
            <SmallText><strong>Date :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
              {formatDate(scheduledDate)}
            </Text>
          </Column>
          <Column align="right">
            <SmallText><strong>Heure :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
              {formatTime(scheduledTime)}
              {finalEndTime && ` - ${formatTime(finalEndTime)}`}
            </Text>
          </Column>
        </Row>
        
        <Row style={{ marginTop: '16px' }}>
          <Column>
            <SmallText><strong>Lieu :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0' }}>
              {location}
            </Text>
          </Column>
          {estimatedDuration && (
            <Column align="right">
              <SmallText><strong>Durée :</strong></SmallText>
              <Text style={{ margin: '0 0 8px 0' }}>
                {estimatedDuration}h
              </Text>
            </Column>
          )}
        </Row>
      </Card>

      {/* Détails de la mission */}
      <Card>
        <Subtitle>📝 Détails de la mission</Subtitle>
        
        <Text style={{ margin: '8px 0' }}>
          <strong>Description :</strong>
        </Text>
        <Text style={{ margin: '0 0 16px 0' }}>
          {description}
        </Text>
        
        {requirements.length > 0 && (
          <>
            <Text style={{ margin: '8px 0' }}>
              <strong>Prérequis :</strong>
            </Text>
            <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px' }}>
              {requirements.map((requirement, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>
                  {requirement}
                </li>
              ))}
            </ul>
          </>
        )}
        
        {specialInstructions && (
          <>
            <Text style={{ margin: '8px 0' }}>
              <strong>Instructions spéciales :</strong>
            </Text>
            <Text style={{ margin: '0 0 8px 0', fontStyle: 'italic' }}>
              {specialInstructions}
            </Text>
          </>
        )}
      </Card>

      {/* Informations client */}
      <Card>
        <Subtitle>👤 Informations client</Subtitle>
        
        {hasCustomerContact ? (
          <>
            <Text style={{ 
              color: '#16a34a', 
              fontWeight: '600', 
              margin: '0 0 16px 0' 
            }}>
              🟢 Informations complètes disponibles
            </Text>
            <Row style={{ marginBottom: '12px' }}>
              <Column>
                <SmallText><strong>Nom :</strong></SmallText>
                <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
                  {customerName}
                </Text>
              </Column>
            </Row>
            <Row style={{ marginBottom: '12px' }}>
              <Column>
                <SmallText><strong>Email :</strong></SmallText>
                <Text style={{ margin: '0 0 8px 0' }}>
                  <Link href={`mailto:${customerEmail}`} style={{ color: '#007ee6' }}>
                    {customerEmail}
                  </Link>
                </Text>
              </Column>
            </Row>
            {customerPhone && (
              <Row style={{ marginBottom: '12px' }}>
                <Column>
                  <SmallText><strong>Téléphone :</strong></SmallText>
                  <Text style={{ margin: '0 0 8px 0' }}>
                    <Link href={`tel:${customerPhone}`} style={{ color: '#007ee6' }}>
                      {customerPhone}
                    </Link>
                  </Text>
                </Column>
              </Row>
            )}
          </>
        ) : (
          <>
            <Text style={{ 
              color: '#f59e0b', 
              fontWeight: '600', 
              margin: '0 0 16px 0' 
            }}>
              🟡 Informations partielles (pour l'instant)
            </Text>
            <Row style={{ marginBottom: '12px' }}>
              <Column>
                <SmallText><strong>Client :</strong></SmallText>
                <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
                  {customerInitials}
                </Text>
                <Text style={{ 
                  fontSize: '12px', 
                  color: '#666666', 
                  fontStyle: 'italic',
                  margin: '4px 0 0 0'
                }}>
                  Coordonnées complètes disponibles le {informationAvailableAt}
                </Text>
              </Column>
            </Row>
          </>
        )}
      </Card>

      {/* Prochaines étapes */}
      <Card>
        <Subtitle>🚀 Prochaines étapes</Subtitle>
        
        <ol style={{ margin: '16px 0', paddingLeft: '20px', fontSize: '15px', lineHeight: '1.6' }}>
          <li style={{ marginBottom: '12px' }}>
            <strong>Préparez votre intervention</strong><br />
            Vérifiez que vous disposez du matériel requis selon la liste des prérequis
          </li>
          <li style={{ marginBottom: '12px' }}>
            <strong>Coordonnées client</strong><br />
            {hasCustomerContact 
              ? 'Les informations complètes du client sont déjà disponibles'
              : `Les informations complètes du client vous seront transmises le ${informationAvailableAt}`
            }
          </li>
          <li style={{ marginBottom: '12px' }}>
            <strong>Réalisez la mission</strong><br />
            Contactez le client la veille pour confirmer et réalisez la prestation le jour J
          </li>
        </ol>
      </Card>

      {/* Actions principales */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <PrimaryButton href={missionDetailsUrl}>
          📋 Voir les détails
        </PrimaryButton>
        
        <Row style={{ marginTop: '16px' }}>
          <Column align="center" style={{ paddingRight: '8px' }}>
            <SecondaryButton href={dashboardUrl}>
              🏠 Mon dashboard
            </SecondaryButton>
          </Column>
          <Column align="center" style={{ paddingLeft: '8px' }}>
            {trackingUrl && (
              <SecondaryButton href={trackingUrl}>
                📍 Suivre la mission
              </SecondaryButton>
            )}
          </Column>
        </Row>
      </Section>

      <Separator />

      {/* Avertissement sur l'annulation */}
      {allowsCancellation && (
        <Card>
          <Subtitle>⚠️ Annulation</Subtitle>
          
          <Text style={{ margin: '8px 0' }}>
            En cas d'empêchement majeur, vous pouvez encore annuler cette mission via votre dashboard.
          </Text>
          
          <Text style={{ margin: '8px 0', fontWeight: '600' }}>
            Attention : Les annulations répétées peuvent affecter votre statut de partenaire.
          </Text>
          
          <Text style={{ margin: '8px 0' }}>
            <Link href={cancelUrl} style={{ color: '#dc2626' }}>
              Annuler cette mission (en cas d'urgence)
            </Link>
          </Text>
        </Card>
      )}

      {/* Contact support */}
      <Card>
        <Subtitle>🆘 Support professionnel</Subtitle>
        
        <Text style={{ margin: '8px 0' }}>
          Support disponible 24h/7j :
        </Text>
        
        <Row style={{ marginBottom: '8px' }}>
          <Column>
            <Text style={{ margin: '4px 0' }}>
              📞 <Link href={`tel:${supportPhone}`} style={{ color: '#007ee6' }}>
                {supportPhone}
              </Link>
            </Text>
          </Column>
        </Row>
        
        <Row>
          <Column>
            <Text style={{ margin: '4px 0' }}>
              📧 <Link href={`mailto:${supportEmail}`} style={{ color: '#007ee6' }}>
                {supportEmail}
              </Link>
            </Text>
          </Column>
        </Row>
        
        {supportUrl && (
          <Row style={{ marginTop: '8px' }}>
            <Column>
              <Text style={{ margin: '4px 0' }}>
                🌐 <Link href={supportUrl} style={{ color: '#007ee6' }}>
                  Centre d'aide professionnel
                </Link>
              </Text>
            </Column>
          </Row>
        )}
      </Card>

      <Paragraph style={{ 
        marginTop: '32px', 
        textAlign: 'center', 
        fontSize: '16px',
        color: '#16a34a',
        fontWeight: '600'
      }}>
        Bonne mission ! 🚀
      </Paragraph>
      
      <SmallText style={{ textAlign: 'center', marginTop: '16px' }}>
        ID de mission : {attributionId}
      </SmallText>
    </Layout>
  );
};

export default MissionAcceptedConfirmation;