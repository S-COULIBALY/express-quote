/**
 * Template React Email pour les responsables internes (professionnels)
 * 
 * Utilité :
 * - Notifie une nouvelle intervention avec devis et informations client
 * - Fournit un récapitulatif détaillé de l'intervention
 * - Guide le professionnel vers les actions recommandées
 * - Inclut les documents attachés et informations de contact
 * 
 * Technologies utilisées :
 * - React Email : Rendu HTML optimisé pour tous les clients
 * - TypeScript : Type safety pour les données d'intervention
 * - Layout réutilisable : Consistance visuelle
 * - Formatage automatique : Dates, prix, adresses
 * 
 * Cas d'usage :
 * - Envoyé automatiquement lors d'une nouvelle intervention
 * - Contient les détails complets de l'intervention
 * - Guide vers les actions spécifiques au rôle
 * - Inclut les documents et informations de contact
 */

import React from 'react';
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
 * Interface des données pour le template de document professionnel
 */
export interface ProfessionalDocumentData {
  // Données responsable
  professionalName: string;
  role: string;
  department?: string;
  
  // Données intervention
  bookingId: string;
  bookingReference: string;
  serviceType: 'MOVING' | 'MOVING_PREMIUM' | 'CUSTOM';
  serviceName?: string;
  totalAmount: number;
  currency?: string;
  
  // Données client
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  // Données service
  serviceDate: string;
  serviceTime?: string;
  serviceAddress: string;
  
  // Contexte
  trigger: string;
  reason: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  
  // Documents attachés
  attachedDocuments?: Array<{
    filename: string;
    type: string;
    size: number;
    url?: string;
  }>;
  
  // URLs
  viewBookingUrl: string;
  planningUrl?: string;
  supportUrl?: string;
  
  // Info entreprise
  companyName?: string;
  supportPhone?: string;
  supportEmail?: string;
  
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
 * Obtient la configuration de priorité
 */
const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return { emoji: '🚨', color: '#dc2626', label: 'URGENT' };
    case 'HIGH':
      return { emoji: '⚠️', color: '#ea580c', label: 'HAUTE' };
    case 'MEDIUM':
      return { emoji: '📋', color: '#d97706', label: 'MOYENNE' };
    case 'LOW':
      return { emoji: '📝', color: '#16a34a', label: 'FAIBLE' };
    default:
      return { emoji: '📋', color: '#6b7280', label: 'NORMALE' };
  }
};

/**
 * Obtient les instructions par rôle
 */
const getInstructionsByRole = (role: string): Array<{ icon: string; text: string }> => {
  switch (role) {
    case 'MOVING_MANAGER':
      return [
        { icon: '📋', text: 'Vérifier la disponibilité des équipes et du matériel' },
        { icon: '📞', text: 'Contacter le client pour confirmer les détails logistiques' },
        { icon: '🚛', text: 'Planifier les véhicules et optimiser les tournées' },
        { icon: '📅', text: 'Intégrer l\'intervention au planning général' }
      ];
    case 'CLEANING_MANAGER': // Rôle supprimé - affichage rétrocompat
    case 'OPERATIONS_MANAGER':
      return [
        { icon: '👁️', text: 'Superviser la planification globale de l\'intervention' },
        { icon: '💰', text: 'Valider la rentabilité et les marges' },
        { icon: '📊', text: 'Suivre les KPIs et la satisfaction client' },
        { icon: '🔄', text: 'Coordonner avec les autres services si nécessaire' }
      ];
    default:
      return [
        { icon: '📋', text: 'Examiner les détails de la réservation' },
        { icon: '📞', text: 'Contacter le client si nécessaire' },
        { icon: '📅', text: 'Intégrer au planning de votre service' }
      ];
  }
};

/**
 * Template React Email pour les documents professionnels
 */
export const ProfessionalDocument: React.FC<ProfessionalDocumentData> = ({
  professionalName,
  role,
  department,
  bookingId,
  bookingReference,
  serviceType,
  serviceName,
  totalAmount,
  currency = 'EUR',
  customerName,
  customerEmail,
  customerPhone,
  serviceDate,
  serviceTime,
  serviceAddress,
  trigger,
  reason,
  priority = 'MEDIUM',
  attachedDocuments = [],
  viewBookingUrl,
  planningUrl,
  supportUrl,
  companyName = 'Express Quote',
  supportPhone,
  supportEmail,
  unsubscribeUrl,
  preferencesUrl,
}) => {
  const serviceEmoji = getServiceEmoji(serviceType);
  const serviceDisplayName = getServiceDisplayName(serviceType);
  const priorityConfig = getPriorityConfig(priority);
  const instructions = getInstructionsByRole(role);
  
  return (
    <Layout
      preview={`Nouvelle intervention ${serviceDisplayName} - ${customerName} - ${formatPrice(totalAmount, currency)}`}
      title={`Nouvelle intervention - ${bookingReference}`}
      brandName={companyName}
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      {/* En-tête avec priorité */}
      <Title>
        {serviceEmoji} Nouvelle intervention {serviceDisplayName}
      </Title>
      
      <Paragraph>
        Bonjour <strong>{professionalName}</strong>,
      </Paragraph>
      
      <Paragraph>
        Une nouvelle intervention vient d'être confirmée et nécessite votre attention en tant que <strong>{role}</strong>
        {department && ` du département ${department}`}.
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

      {/* Détails de l'intervention */}
      <Card>
        <Subtitle>📋 Détails de l'intervention</Subtitle>
        
        <Row>
          <Column>
            <SmallText><strong>Référence :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
              {bookingReference}
            </Text>
          </Column>
          <Column>
            <SmallText><strong>ID de réservation :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
              {bookingId}
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
            <SmallText><strong>Montant :</strong></SmallText>
            <Text style={{ 
              margin: '0 0 12px 0', 
              fontSize: '18px', 
              fontWeight: '700',
              color: '#007ee6'
            }}>
              {formatPrice(totalAmount, currency)}
            </Text>
          </Column>
        </Row>

        <Hr style={{ margin: '16px 0', borderColor: '#e0e0e0' }} />

        <Row>
          <Column>
            <SmallText><strong>Date :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0' }}>
              {formatDate(serviceDate)}
            </Text>
          </Column>
          {serviceTime && (
            <Column>
              <SmallText><strong>Heure :</strong></SmallText>
              <Text style={{ margin: '0 0 12px 0' }}>
                {formatTime(serviceTime)}
              </Text>
            </Column>
          )}
        </Row>

        <Hr style={{ margin: '16px 0', borderColor: '#e0e0e0' }} />

        <Row>
          <Column>
            <SmallText><strong>📍 Adresse :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0' }}>{serviceAddress}</Text>
          </Column>
        </Row>
      </Card>

      {/* Informations client */}
      <Card>
        <Subtitle>👤 Informations client</Subtitle>
        
        <Row>
          <Column>
            <SmallText><strong>Nom :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0', fontWeight: '600' }}>
              {customerName}
            </Text>
          </Column>
        </Row>

        <Row>
          <Column>
            <SmallText><strong>Email :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0' }}>
              <Link href={`mailto:${customerEmail}`} style={{ color: '#007ee6' }}>
                {customerEmail}
              </Link>
            </Text>
          </Column>
          <Column>
            <SmallText><strong>Téléphone :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0' }}>
              <Link href={`tel:${customerPhone}`} style={{ color: '#007ee6' }}>
                {customerPhone}
              </Link>
            </Text>
          </Column>
        </Row>
      </Card>

      {/* Documents attachés */}
      {attachedDocuments.length > 0 && (
        <Card>
          <Subtitle>📎 Documents attachés ({attachedDocuments.length})</Subtitle>
          
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
                  {doc.filename}
                </Text>
                <Text style={{ 
                  margin: '0', 
                  fontSize: '12px',
                  color: '#666'
                }}>
                  {doc.type} • {(doc.size / 1024).toFixed(1)} KB
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

      {/* Actions principales */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <PrimaryButton href={viewBookingUrl}>
          📄 Voir la réservation
        </PrimaryButton>
        
        <Row style={{ marginTop: '16px' }}>
          <Column align="center" style={{ paddingRight: '8px' }}>
            {planningUrl && (
              <SecondaryButton href={planningUrl}>
                📅 Ouvrir le planning
              </SecondaryButton>
            )}
          </Column>
          <Column align="center" style={{ paddingLeft: '8px' }}>
            {supportUrl && (
              <SecondaryButton href={supportUrl}>
                🆘 Support
              </SecondaryButton>
            )}
          </Column>
        </Row>
      </Section>

      <Separator />

      {/* Actions recommandées */}
      <Card>
        <Subtitle>🔧 Actions recommandées</Subtitle>
        
        <ul style={{ margin: '16px 0', paddingLeft: '20px', fontSize: '15px', lineHeight: '1.6' }}>
          {instructions.map((instruction, index) => (
            <li key={index} style={{ marginBottom: '8px' }}>
              {instruction.icon} {instruction.text}
            </li>
          ))}
        </ul>
      </Card>

      {/* Contact support */}
      {(supportPhone || supportEmail) && (
        <Card>
          <Subtitle>📞 Besoin d'aide ?</Subtitle>
          
          <Text style={{ margin: '8px 0' }}>
            Contactez notre support :
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
        </Card>
      )}

      <div style={{ 
        marginTop: '32px', 
        textAlign: 'center', 
        fontSize: '14px',
        color: '#666666'
      }}>
        Cet email a été généré automatiquement suite à : {reason}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#999999' }}>
        ID de réservation : {bookingId} | Déclencheur : {trigger}
      </div>
    </Layout>
  );
};


export default ProfessionalDocument;