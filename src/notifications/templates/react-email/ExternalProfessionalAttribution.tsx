/**
 * Template React Email pour l'attribution de missions aux professionnels EXTERNES
 * 
 * Utilité :
 * - Attribution de missions aux professionnels externes partenaires
 * - Design attractif pour motiver les prestataires à accepter les missions
 * - Fournit tous les détails financiers et logistiques
 * - Inclut les documents nécessaires et les avantages partenaires
 * 
 * Technologies utilisées :
 * - React Email : Rendu HTML optimisé pour tous les clients
 * - TypeScript : Type safety pour les données d'attribution
 * - Layout réutilisable : Consistance visuelle
 * - Formatage automatique : Dates, prix, distances
 * 
 * Cas d'usage :
 * - Envoyé automatiquement lors de l'attribution d'une mission
 * - Contient les détails complets de la mission et des revenus
 * - Guide vers l'acceptation ou le refus de la mission
 * - Inclut les documents et informations de contact
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
} from './components/Layout';

/**
 * Interface des données pour le template d'attribution professionnel externe
 */
export interface ExternalProfessionalAttributionData {
  // Données professionnel
  companyName: string;
  businessType: 'MOVING_COMPANY' | 'CLEANING_COMPANY' | 'DELIVERY_COMPANY' | 'CUSTOM';
  professionalId: string;

  // Données mission attractive
  bookingId: string;
  bookingReference: string;
  serviceType: 'MOVING' | 'CLEANING' | 'DELIVERY' | 'CUSTOM';
  serviceName?: string;
  totalAmount: number;
  estimatedRevenue: number;
  commission: number;
  currency?: string;

  // Données client (limitées)
  customerFirstName: string;
  customerPhone?: string;

  // Détails mission
  serviceDate: string;
  serviceTime: string;
  estimatedDuration?: number;
  pickupAddress: string;
  deliveryAddress?: string;
  volume?: number;
  distance?: number;

  // Attribution & Actions
  attributionId: string;
  priority: 'normal' | 'high' | 'urgent';
  timeoutDate: string;
  acceptUrl: string;
  refuseUrl: string;
  allowsAcceptance?: boolean;
  allowsRefusal?: boolean;

  // Documents
  attachedDocuments?: Array<{
    type: string;
    filename: string;
    size: number;
    url?: string;
  }>;

  // URLs utiles
  professionalDashboardUrl?: string;
  missionDetailsUrl?: string;
  supportUrl?: string;

  // Informations entreprise
  supportPhone?: string;
  supportEmail?: string;

  // Motivations
  benefits?: string[];
  urgencyLevel?: string;
  
  // Configuration
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
 * Formate une date de timeout
 */
const formatTimeout = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
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
    default: return 'Service personnalisé';
  }
};

/**
 * Obtient la configuration de priorité
 */
const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return { emoji: '🚨', color: '#dc2626', label: 'URGENT' };
    case 'high':
      return { emoji: '⚡', color: '#ea580c', label: 'HAUTE' };
    default:
      return { emoji: '📋', color: '#059669', label: 'NORMALE' };
  }
};

/**
 * Obtient l'emoji pour le type de business
 */
const getBusinessEmoji = (businessType: string): string => {
  switch (businessType) {
    case 'MOVING_COMPANY': return '🚛';
    case 'CLEANING_COMPANY': return '🧽';
    case 'DELIVERY_COMPANY': return '📦';
    default: return '🏢';
  }
};

/**
 * Template React Email pour l'attribution professionnel externe
 */
export const ExternalProfessionalAttribution: React.FC<ExternalProfessionalAttributionData> = ({
  companyName,
  businessType,
  professionalId,
  bookingId,
  bookingReference,
  serviceType,
  serviceName,
  totalAmount,
  estimatedRevenue,
  commission,
  currency = 'EUR',
  customerFirstName,
  customerPhone,
  serviceDate,
  serviceTime,
  estimatedDuration,
  pickupAddress,
  deliveryAddress,
  volume,
  distance,
  attributionId,
  priority = 'normal',
  timeoutDate,
  acceptUrl,
  refuseUrl,
  allowsAcceptance = true,
  allowsRefusal = true,
  attachedDocuments = [],
  professionalDashboardUrl,
  missionDetailsUrl,
  supportUrl,
  supportPhone,
  supportEmail,
  benefits = [
    'Paiement garanti sous 48h',
    'Pas de démarchage nécessaire',
    'Clients pré-qualifiés',
    'Support technique 7j/7'
  ],
  urgencyLevel = 'Standard',
  unsubscribeUrl,
  preferencesUrl,
}) => {
  const serviceEmoji = getServiceEmoji(serviceType);
  const serviceDisplayName = getServiceDisplayName(serviceType);
  const priorityConfig = getPriorityConfig(priority);
  const businessEmoji = getBusinessEmoji(businessType);
  
  return (
    <Layout
      preview={`🎯 Nouvelle mission ${serviceDisplayName} - ${formatPrice(estimatedRevenue, currency)} de revenus`}
      title={`Nouvelle mission - ${bookingReference}`}
      brandName="Express Quote"
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      {/* En-tête avec priorité */}
      <Title>
        {serviceEmoji} Nouvelle mission {serviceDisplayName}
      </Title>
      
      <Paragraph>
        Bonjour <strong>{companyName}</strong>,
      </Paragraph>
      
      <Paragraph>
        Nous avons une nouvelle mission parfaitement adaptée à votre expertise {businessEmoji}.
        <strong> Revenus estimés : {formatPrice(estimatedRevenue, currency)}</strong>
      </Paragraph>

      {/* Badge de priorité */}
      <Card highlight>
        <Row>
          <Column>
            <Text style={{ 
              display: 'inline-block',
              padding: '8px 16px',
              borderRadius: '20px',
              backgroundColor: priorityConfig.color,
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 'bold',
              margin: '0'
            }}>
              {priorityConfig.emoji} Priorité {priorityConfig.label}
            </Text>
          </Column>
        </Row>
      </Card>

      {/* Détails de la mission */}
      <Card>
        <Subtitle>📋 Détails de la mission</Subtitle>
        
        <Row>
          <Column>
            <SmallText><strong>Référence :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
              {bookingReference}
            </Text>
          </Column>
          <Column>
            <SmallText><strong>ID de mission :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
              {attributionId}
            </Text>
          </Column>
        </Row>

        <Hr style={{ margin: '16px 0', borderColor: '#e0e0e0' }} />

        <Row>
          <Column>
            <SmallText><strong>Service :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0' }}>
              {serviceName || serviceDisplayName}
            </Text>
          </Column>
          <Column>
            <SmallText><strong>Date :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0' }}>
              {formatDate(serviceDate)}
            </Text>
          </Column>
        </Row>

        <Row>
          <Column>
            <SmallText><strong>Heure :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0' }}>
              {formatTime(serviceTime)}
              {estimatedDuration && ` (${estimatedDuration}h)`}
            </Text>
          </Column>
          <Column>
            <SmallText><strong>Client :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0' }}>
              M./Mme {customerFirstName}
              {customerPhone && ` - ${customerPhone}`}
            </Text>
          </Column>
        </Row>

        <Hr style={{ margin: '16px 0', borderColor: '#e0e0e0' }} />

        <Row>
          <Column>
            <SmallText><strong>Montant total :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0' }}>
              {formatPrice(totalAmount, currency)}
            </Text>
          </Column>
          <Column>
            <SmallText><strong>Vos revenus :</strong></SmallText>
            <Text style={{ 
              margin: '0 0 12px 0', 
              fontSize: '18px', 
              fontWeight: '700',
              color: '#16a34a'
            }}>
              {formatPrice(estimatedRevenue, currency)}
            </Text>
          </Column>
        </Row>

        <Row>
          <Column>
            <SmallText><strong>Commission :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0' }}>
              {commission}%
            </Text>
          </Column>
          {volume && (
            <Column>
              <SmallText><strong>Volume :</strong></SmallText>
              <Text style={{ margin: '0 0 12px 0' }}>
                {volume}m³
              </Text>
            </Column>
          )}
        </Row>
      </Card>

      {/* Itinéraire */}
      <Card>
        <Subtitle>📍 Itinéraire</Subtitle>
        
        <Text style={{ margin: '8px 0' }}>
          <strong>Départ :</strong>
        </Text>
        <Text style={{ margin: '0 0 16px 0', fontSize: '15px', lineHeight: '1.4' }}>
          {pickupAddress}
        </Text>
        
        {deliveryAddress && (
          <>
            <Text style={{ margin: '8px 0' }}>
              <strong>Arrivée :</strong>
            </Text>
            <Text style={{ margin: '0 0 16px 0', fontSize: '15px', lineHeight: '1.4' }}>
              {deliveryAddress}
            </Text>
          </>
        )}
        
        {distance && (
          <Text style={{ margin: '8px 0' }}>
            <strong>Distance :</strong> ~{distance}km
          </Text>
        )}
      </Card>

      {/* Actions principales */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Subtitle>⏰ Répondez avant le {formatTimeout(timeoutDate)}</Subtitle>
        
        <Row style={{ marginTop: '20px' }}>
          {allowsAcceptance && (
            <Column align="center" style={{ paddingRight: '8px' }}>
              <PrimaryButton href={acceptUrl}>
                ✅ J'accepte cette mission
              </PrimaryButton>
            </Column>
          )}
          {allowsRefusal && (
            <Column align="center" style={{ paddingLeft: '8px' }}>
              <SecondaryButton href={refuseUrl}>
                ❌ Je refuse
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
          {priority === 'urgent' && '🚨 Mission URGENTE - Réponse souhaitée rapidement'}
          {priority === 'high' && '⚡ Mission PRIORITAIRE - Réponse souhaitée aujourd\'hui'}
          {priority === 'normal' && '📋 Prenez le temps de consulter les documents'}
        </Text>
      </Section>

      <Separator />

      {/* Documents joints */}
      {attachedDocuments.length > 0 && (
        <Card>
          <Subtitle>📎 Documents joints ({attachedDocuments.length})</Subtitle>
          
          {attachedDocuments.map((doc, index) => (
            <Row key={index} style={{ 
              marginBottom: '12px',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px'
            }}>
              <Column style={{ width: '40px' }}>
                <Text style={{ fontSize: '20px', margin: '0' }}>📄</Text>
              </Column>
              <Column>
                <Text style={{ 
                  margin: '0 0 4px 0', 
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  {doc.type} - {doc.filename}
                </Text>
                <Text style={{ 
                  margin: '0', 
                  fontSize: '12px',
                  color: '#666'
                }}>
                  {Math.round(doc.size / 1024)}KB
                </Text>
              </Column>
            </Row>
          ))}
          
          <Text style={{ 
            margin: '16px 0 0 0',
            fontSize: '13px',
            color: '#007ee6',
            fontStyle: 'italic',
            textAlign: 'center'
          }}>
            💡 Les documents sont en pièce jointe de cet email
          </Text>
        </Card>
      )}

      {/* Avantages partenaires */}
      <Card>
        <Subtitle>🌟 Vos avantages Express Quote</Subtitle>
        
        <ul style={{ margin: '16px 0', paddingLeft: '20px', fontSize: '15px', lineHeight: '1.6' }}>
          {benefits.map((benefit, index) => (
            <li key={index} style={{ marginBottom: '8px' }}>
              ✅ {benefit}
            </li>
          ))}
        </ul>
      </Card>

      {/* Contact support */}
      {(supportPhone || supportEmail) && (
        <Card>
          <Subtitle>📞 Besoin d'aide ?</Subtitle>
          
          <Text style={{ margin: '8px 0' }}>
            Notre équipe support est là pour vous accompagner :
          </Text>
          
          <Row>
            <Column>
              {supportPhone && (
                <Text style={{ margin: '4px 0' }}>
                  📞 <Link href={`tel:${supportPhone}`} style={{ color: '#007ee6' }}>
                    {supportPhone}
                  </Link>
                </Text>
              )}
            </Column>
          </Row>
          
          <Row>
            <Column>
              {supportEmail && (
                <Text style={{ margin: '4px 0' }}>
                  📧 <Link href={`mailto:${supportEmail}`} style={{ color: '#007ee6' }}>
                    {supportEmail}
                  </Link>
                </Text>
              )}
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
      )}

      {/* Liens utiles */}
      <Section style={{ textAlign: 'center', margin: '24px 0' }}>
        <Text style={{ margin: '8px 0' }}>
          {professionalDashboardUrl && (
            <>
              <Link href={professionalDashboardUrl} style={{ color: '#007ee6' }}>
                📊 Accéder à votre tableau de bord
              </Link>
              {' | '}
            </>
          )}
          {missionDetailsUrl && (
            <Link href={missionDetailsUrl} style={{ color: '#007ee6' }}>
              📋 Voir les détails complets
            </Link>
          )}
        </Text>
      </Section>

      <div style={{ 
        marginTop: '32px', 
        textAlign: 'center', 
        fontSize: '14px',
        color: '#666666'
      }}>
        <strong>Express Quote</strong> - Votre partenaire de confiance
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#999999' }}>
        ID de mission : {attributionId} | ID professionnel : {professionalId}
      </div>
    </Layout>
  );
};

export default ExternalProfessionalAttribution;