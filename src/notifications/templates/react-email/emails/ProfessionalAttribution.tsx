/**
 * Template React Email pour les notifications d'attribution de missions aux professionnels
 * 
 * Utilité :
 * - Notifie un professionnel d'une nouvelle mission disponible
 * - Fournit tous les détails de la mission (montant, lieu, date)
 * - Permet l'acceptation ou le refus rapide
 * - Inclut les informations de priorité et d'expiration
 * 
 * Technologies utilisées :
 * - React Email : Template responsive et accessible
 * - TypeScript : Validation des données de mission
 * - Formatage intelligent : Montants, dates, distances
 * - Rendu conditionnel : Priorité et actions dynamiques
 * 
 * Cas d'usage :
 * - Envoyé lors de l'attribution d'une nouvelle mission
 * - Contient les boutons d'action rapide
 * - Informations client disponibles 24h avant
 * - Système de priorité et d'expiration
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
 * Interface des données pour le template d'attribution de mission
 */
export interface ProfessionalAttributionData {
  // Informations professionnel
  professionalEmail: string;
  professionalName?: string;
  
  // Informations mission
  attributionId: string;
  serviceType: 'MOVING' | 'CLEANING' | 'DELIVERY' | 'CUSTOM';
  serviceName?: string;
  totalAmount: number;
  currency?: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedDuration?: number; // en heures
  locationCity: string;
  locationDistrict: string;
  distanceKm: number;
  
  // Détails mission
  description: string;
  requirements: string[];
  specialInstructions?: string;
  
  // Équipe et logistique
  teamSize?: number;
  vehicleRequired?: boolean;
  equipmentRequired?: string[];
  
  // Actions
  acceptUrl: string;
  refuseUrl: string;
  
  // URLs dashboard
  dashboardUrl: string;
  attributionDetailsUrl: string;
  trackingUrl?: string;
  supportUrl?: string;
  
  // Métadonnées
  priority: 'normal' | 'high' | 'urgent';
  expiresAt: string;
  timeUntilExpiry?: number; // en heures
  
  // Informations de contact
  supportEmail: string;
  supportPhone: string;
  
  // Configuration
  companyName?: string;
  allowsAcceptance: boolean;
  allowsRefusal: boolean;
  
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
    case 'MOVING': return '📦';
    case 'CLEANING': return '🧹';
    case 'DELIVERY': return '🚚';
    default: return '⚡';
  }
};

/**
 * Obtient le nom d'affichage du service
 */
const getServiceDisplayName = (serviceType: string): string => {
  switch (serviceType) {
    case 'MOVING': return 'Déménagement';
    case 'CLEANING': return 'Nettoyage';
    case 'DELIVERY': return 'Livraison';
    case 'CUSTOM': return 'Service personnalisé';
    default: return serviceType;
  }
};

/**
 * Obtient la configuration de priorité
 */
const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return { color: '#dc2626', label: 'Urgente', bgColor: '#fef2f2', emoji: '🚨' };
    case 'high':
      return { color: '#f59e0b', label: 'Élevée', bgColor: '#fffbeb', emoji: '⚠️' };
    default:
      return { color: '#3b82f6', label: 'Normale', bgColor: '#eff6ff', emoji: '📋' };
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
 * Template React Email pour l'attribution de mission
 */
export const ProfessionalAttribution: React.FC<ProfessionalAttributionData> = ({
  professionalEmail,
  professionalName,
  attributionId,
  serviceType,
  serviceName,
  totalAmount,
  currency = 'EUR',
  scheduledDate,
  scheduledTime,
  estimatedDuration,
  locationCity,
  locationDistrict,
  distanceKm,
  description,
  requirements = [],
  specialInstructions,
  teamSize,
  vehicleRequired,
  equipmentRequired = [],
  acceptUrl,
  refuseUrl,
  dashboardUrl,
  attributionDetailsUrl,
  trackingUrl,
  supportUrl,
  priority,
  expiresAt,
  timeUntilExpiry,
  supportEmail,
  supportPhone,
  companyName = 'Express Quote',
  allowsAcceptance = true,
  allowsRefusal = true,
  unsubscribeUrl,
  preferencesUrl,
}) => {
  const serviceEmoji = getServiceEmoji(serviceType);
  const serviceDisplayName = serviceName || getServiceDisplayName(serviceType);
  const priorityConfig = getPriorityConfig(priority);
  const finalEndTime = estimatedDuration ? calculateEndTime(scheduledTime, estimatedDuration) : null;

  return (
    <Layout
      preview={`🚀 Nouvelle mission ${serviceDisplayName} disponible - ${formatPrice(totalAmount, currency)} à ${locationCity}`}
      title={`Nouvelle mission - ${serviceDisplayName}`}
      brandName={companyName}
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      {/* En-tête avec priorité */}
      <Title>
        {serviceEmoji} Nouvelle mission disponible !
      </Title>
      
      <Paragraph>
        Bonjour{professionalName ? ` ${professionalName}` : ''},
      </Paragraph>
      
      <Paragraph>
        Une nouvelle mission <strong>{serviceDisplayName}</strong> vient d'être publiée dans votre secteur.
      </Paragraph>

      {/* Badge de priorité */}
      <Card>
        <Row style={{ alignItems: 'center' }}>
          <Column>
            <Text style={{ 
              fontSize: '16px', 
              fontWeight: '600',
              color: priorityConfig.color,
              margin: '0'
            }}>
              {priorityConfig.emoji} Priorité {priorityConfig.label}
            </Text>
          </Column>
          {timeUntilExpiry && (
            <Column align="right">
              <Text style={{ 
                fontSize: '14px', 
                color: '#666666',
                margin: '0'
              }}>
                Expire dans {timeUntilExpiry}h
              </Text>
            </Column>
          )}
        </Row>
      </Card>

      {/* Détails de la mission */}
      <Card highlight>
        <Subtitle>📋 Détails de la mission</Subtitle>
        
        <Text style={{ fontSize: '32px', fontWeight: '700', color: '#16a34a', margin: '16px 0' }}>
          {formatPrice(totalAmount, currency)}
        </Text>
        
        <Row style={{ marginTop: '16px' }}>
          <Column>
            <SmallText><strong>Service :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
              {serviceDisplayName}
            </Text>
          </Column>
          <Column align="right">
            <SmallText><strong>Date :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
              {formatDate(scheduledDate)}
            </Text>
          </Column>
        </Row>
        
        <Row style={{ marginTop: '16px' }}>
          <Column>
            <SmallText><strong>Heure :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
              {formatTime(scheduledTime)}
              {finalEndTime && ` - ${formatTime(finalEndTime)}`}
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
        
        <Row style={{ marginTop: '16px' }}>
          <Column>
            <SmallText><strong>Localisation :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0' }}>
              {locationCity}, {locationDistrict}
            </Text>
            <Text style={{ 
              fontSize: '12px', 
              color: '#666666',
              margin: '0'
            }}>
              À {distanceKm}km de votre secteur
            </Text>
          </Column>
        </Row>
      </Card>

      {/* Description et prérequis */}
      <Card>
        <Subtitle>📝 Description de la mission</Subtitle>
        
        <Text style={{ margin: '8px 0' }}>
          {description}
        </Text>
        
        {requirements.length > 0 && (
          <>
            <Text style={{ margin: '16px 0 8px 0', fontWeight: '600' }}>
              Prérequis :
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
            <Text style={{ margin: '16px 0 8px 0', fontWeight: '600' }}>
              Instructions spéciales :
            </Text>
            <Text style={{ margin: '0 0 8px 0', fontStyle: 'italic' }}>
              {specialInstructions}
            </Text>
          </>
        )}
      </Card>

      {/* Actions principales */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Subtitle>Que souhaitez-vous faire ?</Subtitle>
        
        <Row style={{ marginTop: '20px' }}>
          {allowsAcceptance && (
            <Column align="center" style={{ paddingRight: '8px' }}>
              <PrimaryButton href={acceptUrl}>
                ✅ Accepter la mission
              </PrimaryButton>
            </Column>
          )}
          {allowsRefusal && (
            <Column align="center" style={{ paddingLeft: '8px' }}>
              <SecondaryButton href={refuseUrl}>
                ❌ Refuser
              </SecondaryButton>
            </Column>
          )}
        </Row>
        
        <Text style={{ 
          margin: '16px 0 0 0',
          fontSize: '14px',
          color: '#666666',
          fontStyle: 'italic'
        }}>
          ⚡ <strong>Action rapide :</strong> Cliquez directement sur les boutons ci-dessus pour répondre immédiatement
        </Text>
      </Section>

      <Separator />

      {/* Informations importantes */}
      <Card>
        <Subtitle>🚨 Informations importantes</Subtitle>
        
        <ul style={{ margin: '16px 0', paddingLeft: '20px', fontSize: '15px', lineHeight: '1.6' }}>
          <li style={{ marginBottom: '8px' }}>
            <strong>Premier arrivé, premier servi :</strong> La mission sera attribuée au premier professionnel qui accepte
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Informations client :</strong> Les coordonnées complètes du client vous seront transmises 24h avant l'intervention
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Expiration :</strong> Cette offre expire le {expiresAt}
          </li>
        </ul>
      </Card>

      {/* Liens alternatifs */}
      <Section style={{ textAlign: 'center', margin: '24px 0' }}>
        <Text style={{ margin: '8px 0' }}>
          Ou consultez tous les détails sur votre{' '}
          <Link href={dashboardUrl} style={{ color: '#007ee6' }}>
            tableau de bord professionnel
          </Link>
        </Text>
      </Section>

      {/* Contact support */}
      <Card>
        <Subtitle>🆘 Besoin d'aide ?</Subtitle>
        
        <Text style={{ margin: '8px 0' }}>
          Contactez notre support :
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

      <div style={{ 
        marginTop: '32px', 
        textAlign: 'center', 
        fontSize: '14px',
        color: '#666666'
      }}>
        Vous recevez cet email car vous êtes professionnel partenaire d'Express Quote.
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#999999' }}>
        ID de mission : {attributionId}
      </div>
    </Layout>
  );
};

export default ProfessionalAttribution;