/**
 * Template email de confirmation de réservation
 * 
 * Utilité :
 * - Confirme une réservation de service validée et payée
 * - Fournit tous les détails de la réservation (date, heure, adresse, équipe)
 * - Inclut les instructions de préparation
 * - Guide vers l'annulation/modification si nécessaire
 * 
 * Technologies utilisées :
 * - React Email : Template responsive et accessible
 * - TypeScript : Validation des données de réservation
 * - Formatage intelligent : Dates, heures, adresses
 * - QR Code intégré : Accès rapide aux détails
 * 
 * Cas d'usage :
 * - Envoyé après paiement confirmé
 * - Rappel 24h avant le service
 * - Contient les contacts d'urgence
 * - Instructions spécifiques par type de service
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
 * Interface des données pour le template de confirmation de réservation
 */
export interface BookingConfirmationData {
  // Informations client
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Informations de réservation
  bookingId: string;
  bookingReference?: string;
  serviceType?: 'MOVING' | 'CLEANING' | 'DELIVERY' | 'CUSTOM' | string;
  serviceName?: string;
  
  // Planning
  serviceDate: string;
  serviceTime: string;
  estimatedDuration: number; // en heures
  endTime?: string; // calculé ou fourni
  
  // Adresses
  pickupAddress?: string;
  deliveryAddress?: string;
  serviceAddress?: string;
  
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
  
  // Équipement et matériel
  equipment: string[];
  suppliedMaterials?: string[];
  clientMustProvide?: string[];
  
  // Pricing (confirmé)
  totalAmount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
  paymentMethod?: string;
  currency: string;
  
  // Instructions spécifiques
  preparationInstructions: string[];
  accessInstructions?: string;
  specialRequirements?: string;
  
  // Contacts d'urgence
  emergencyContact: {
    name: string;
    phone: string;
    hours: string; // "24h/24" ou "9h-18h"
  };
  
  // URLs d'action
  viewBookingUrl: string;
  modifyBookingUrl?: string;
  cancelBookingUrl?: string;
  trackingUrl?: string;
  supportUrl?: string;
  
  // Configuration
  cancellationPolicy?: string;
  weatherPolicy?: string;
  companyName?: string;
  
  // QR Code pour accès rapide
  qrCodeUrl?: string;

  // 🆕 Support des pièces jointes PDF
  attachments?: Array<{
    filename: string;
    content: string; // Base64
    contentType: string;
    size: number;
  }>;

  // 🆕 Contexte de génération
  trigger?: string;
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
 * Obtient l'emoji et couleur pour le statut de paiement
 */
const getPaymentStatusInfo = (status: string): { emoji: string; color: string; text: string } => {
  switch (status) {
    case 'PAID':
      return { emoji: '✅', color: '#16a34a', text: 'Payé' };
    case 'PENDING':
      return { emoji: '⏳', color: '#f59e0b', text: 'En attente' };
    case 'PARTIAL':
      return { emoji: '🔄', color: '#3b82f6', text: 'Partiellement payé' };
    default:
      return { emoji: '❓', color: '#6b7280', text: 'Statut inconnu' };
  }
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
 * Template React Email pour la confirmation de réservation
 */
export const BookingConfirmation: React.FC<BookingConfirmationData> = ({
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
  pickupAddress,
  deliveryAddress,
  serviceAddress,
  teamSize,
  teamLeader,
  vehicleInfo,
  equipment = [],
  suppliedMaterials = [],
  clientMustProvide = [],
  totalAmount,
  paymentStatus,
  paymentMethod,
  currency = 'EUR',
  preparationInstructions = [],
  accessInstructions,
  specialRequirements,
  emergencyContact,
  viewBookingUrl,
  modifyBookingUrl,
  cancelBookingUrl,
  trackingUrl,
  supportUrl,
  cancellationPolicy,
  weatherPolicy,
  companyName = 'Express Quote',
  qrCodeUrl,

  // 🆕 Nouvelles props
  attachments = [],
  trigger,
}) => {
  const serviceEmoji = getServiceEmoji(serviceType);
  const paymentInfo = getPaymentStatusInfo(paymentStatus);
  const finalEndTime = endTime || calculateEndTime(serviceTime, estimatedDuration);
  
  return (
    <Layout
      preview={`Réservation confirmée ${bookingReference} - ${formatDate(serviceDate)}`}
      title={`Confirmation de réservation - ${bookingReference}`}
      brandName={companyName}
    >
      {/* En-tête de confirmation */}
      <Title>
        {serviceEmoji} Réservation confirmée !
      </Title>
      
      <Paragraph>
        Bonjour <strong>{customerName}</strong>,
      </Paragraph>
      
      <Paragraph>
        Excellente nouvelle ! Votre réservation pour <strong>{serviceName}</strong> est confirmée. 
        Notre équipe sera chez vous comme prévu.
      </Paragraph>

      {/* Informations principales de la réservation */}
      <Card highlight>
        <Row>
          <Column>
            <Subtitle>📅 Votre rendez-vous</Subtitle>
          </Column>
          {qrCodeUrl && (
            <Column align="right" width="80">
              <Img
                src={qrCodeUrl}
                width="80"
                height="80"
                alt="QR Code réservation"
                style={{ border: '1px solid #e0e0e0', borderRadius: '8px' }}
              />
            </Column>
          )}
        </Row>
        
        <Text style={{ fontSize: '24px', fontWeight: '700', color: '#007ee6', margin: '16px 0' }}>
          {formatDate(serviceDate)}
        </Text>
        
        <Text style={{ fontSize: '20px', fontWeight: '600', margin: '8px 0' }}>
          {formatTime(serviceTime)} - {formatTime(finalEndTime)}
          <SmallText style={{ fontWeight: 'normal', marginLeft: '12px' }}>
            ({estimatedDuration}h environ)
          </SmallText>
        </Text>
        
        <Row style={{ marginTop: '16px' }}>
          <Column>
            <SmallText><strong>Référence :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
              {bookingReference}
            </Text>
          </Column>
          <Column align="right">
            <SmallText><strong>Statut paiement :</strong></SmallText>
            <Text style={{ 
              margin: '0 0 8px 0', 
              color: paymentInfo.color,
              fontWeight: '600'
            }}>
              {paymentInfo.emoji} {paymentInfo.text}
            </Text>
          </Column>
        </Row>
      </Card>

      {/* Détails de l'équipe */}
      <Card>
        <Subtitle>👥 Votre équipe</Subtitle>
        
        <Row>
          <Column>
            <SmallText><strong>Taille de l'équipe :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0' }}>
              {teamSize} professionnel{teamSize > 1 ? 's' : ''}
            </Text>
          </Column>
        </Row>

        {teamLeader && (
          <>
            <Hr style={{ margin: '16px 0', borderColor: '#e0e0e0' }} />
            <Row>
              <Column>
                {teamLeader.photo && (
                  <Img
                    src={teamLeader.photo}
                    width="60"
                    height="60"
                    alt={`Photo de ${teamLeader.name}`}
                    style={{ 
                      borderRadius: '50%', 
                      marginBottom: '12px',
                      border: '2px solid #e0e0e0'
                    }}
                  />
                )}
                <SmallText><strong>Chef d'équipe :</strong></SmallText>
                <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
                  {teamLeader.name}
                </Text>
                {teamLeader.phone && (
                  <Text style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                    📞 <Link href={`tel:${teamLeader.phone}`}>
                      {teamLeader.phone}
                    </Link>
                  </Text>
                )}
              </Column>
            </Row>
          </>
        )}

        {vehicleInfo && (
          <>
            <Hr style={{ margin: '16px 0', borderColor: '#e0e0e0' }} />
            <Row>
              <Column>
                <SmallText><strong>🚐 Véhicule :</strong></SmallText>
                <Text style={{ margin: '0 0 8px 0' }}>{vehicleInfo.type}</Text>
                {vehicleInfo.licensePlate && (
                  <SmallText>Plaque : {vehicleInfo.licensePlate}</SmallText>
                )}
              </Column>
            </Row>
          </>
        )}
      </Card>

      {/* Adresses de service */}
      <Card>
        <Subtitle>📍 Adresses</Subtitle>
        
        {serviceAddress && (
          <Row style={{ marginBottom: '16px' }}>
            <Column>
              <SmallText><strong>Lieu du service :</strong></SmallText>
              <Text style={{ margin: '0 0 8px 0' }}>{serviceAddress}</Text>
            </Column>
          </Row>
        )}
        
        {pickupAddress && (
          <Row style={{ marginBottom: '16px' }}>
            <Column>
              <SmallText><strong>Adresse de départ :</strong></SmallText>
              <Text style={{ margin: '0 0 8px 0' }}>{pickupAddress}</Text>
            </Column>
          </Row>
        )}
        
        {deliveryAddress && (
          <Row style={{ marginBottom: '16px' }}>
            <Column>
              <SmallText><strong>Adresse de livraison :</strong></SmallText>
              <Text style={{ margin: '0 0 8px 0' }}>{deliveryAddress}</Text>
            </Column>
          </Row>
        )}

        {accessInstructions && (
          <>
            <Hr style={{ margin: '16px 0', borderColor: '#e0e0e0' }} />
            <SmallText><strong>🗝️ Instructions d'accès :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
              {accessInstructions}
            </Text>
          </>
        )}
      </Card>

      {/* Équipement et matériel */}
      {(equipment.length > 0 || suppliedMaterials.length > 0 || clientMustProvide.length > 0) && (
        <Card>
          <Subtitle>🛠️ Équipement et matériel</Subtitle>
          
          {equipment.length > 0 && (
            <Row style={{ marginBottom: '12px' }}>
              <Column>
                <SmallText><strong>Équipement utilisé :</strong></SmallText>
                <Text style={{ margin: '0 0 8px 0' }}>
                  {equipment.join(', ')}
                </Text>
              </Column>
            </Row>
          )}
          
          {suppliedMaterials.length > 0 && (
            <Row style={{ marginBottom: '12px' }}>
              <Column>
                <SmallText><strong>✅ Fourni par nos soins :</strong></SmallText>
                <ul style={{ margin: '4px 0', paddingLeft: '16px', fontSize: '14px' }}>
                  {suppliedMaterials.map((material, index) => (
                    <li key={index}>{material}</li>
                  ))}
                </ul>
              </Column>
            </Row>
          )}
          
          {clientMustProvide.length > 0 && (
            <Row>
              <Column>
                <SmallText><strong>⚠️ À prévoir de votre côté :</strong></SmallText>
                <ul style={{ margin: '4px 0', paddingLeft: '16px', fontSize: '14px' }}>
                  {clientMustProvide.map((item, index) => (
                    <li key={index} style={{ color: '#f59e0b' }}>{item}</li>
                  ))}
                </ul>
              </Column>
            </Row>
          )}
        </Card>
      )}

      {/* Instructions de préparation */}
      {preparationInstructions.length > 0 && (
        <Card highlight>
          <Subtitle>📝 Comment bien préparer votre service</Subtitle>
          
          <ol style={{ margin: '16px 0', paddingLeft: '20px', fontSize: '15px', lineHeight: '1.6' }}>
            {preparationInstructions.map((instruction, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>
                {instruction}
              </li>
            ))}
          </ol>
          
          {specialRequirements && (
            <>
              <Hr style={{ margin: '16px 0', borderColor: '#e0e0e0' }} />
              <SmallText><strong>⭐ Exigences particulières :</strong></SmallText>
              <Text style={{ margin: '0 0 8px 0', fontSize: '14px', fontStyle: 'italic' }}>
                {specialRequirements}
              </Text>
            </>
          )}
        </Card>
      )}

      {/* Actions principales */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <PrimaryButton href={viewBookingUrl}>
          📄 Voir ma réservation complète
        </PrimaryButton>
        
        <Row style={{ marginTop: '16px' }}>
          <Column align="center" style={{ paddingRight: '8px' }}>
            {trackingUrl && (
              <SecondaryButton href={trackingUrl}>
                📍 Suivre mon équipe
              </SecondaryButton>
            )}
          </Column>
          <Column align="center" style={{ paddingLeft: '8px' }}>
            {modifyBookingUrl && (
              <SecondaryButton href={modifyBookingUrl}>
                ✏️ Modifier ma réservation
              </SecondaryButton>
            )}
          </Column>
        </Row>
      </Section>

      <Separator />

      {/* Contact d'urgence */}
      <Card>
        <Subtitle>🆘 Contact d'urgence</Subtitle>
        
        <Text>
          En cas d'imprévu le jour J, contactez directement :
        </Text>
        
        <Row style={{ 
          backgroundColor: '#fee2e2', 
          padding: '16px', 
          borderRadius: '8px',
          margin: '12px 0' 
        }}>
          <Column>
            <Text style={{ fontWeight: '600', margin: '0 0 4px 0' }}>
              {emergencyContact.name}
            </Text>
            <Text style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626' }}>
              📞 {emergencyContact.phone}
            </Text>
            <SmallText style={{ margin: '4px 0 0 0' }}>
              Disponible {emergencyContact.hours}
            </SmallText>
          </Column>
        </Row>
      </Card>

      {/* Récapitulatif financier */}
      <Card>
        <Subtitle>💰 Récapitulatif financier</Subtitle>
        
        <Row>
          <Column>
            <Text style={{ fontSize: '18px', fontWeight: '600' }}>
              Total : {formatPrice(totalAmount, currency)}
            </Text>
            <Text style={{ 
              fontSize: '14px', 
              color: paymentInfo.color,
              fontWeight: '500',
              margin: '4px 0 0 0'
            }}>
              {paymentInfo.emoji} {paymentInfo.text}
              {paymentMethod && ` (${paymentMethod})`}
            </Text>
          </Column>
        </Row>
      </Card>

      {/* Politiques importantes */}
      <Section>
        <Subtitle>📋 Informations importantes</Subtitle>
        
        {cancellationPolicy && (
          <Text style={{ marginBottom: '12px' }}>
            <strong>🚫 Annulation :</strong> {cancellationPolicy}
          </Text>
        )}
        
        {weatherPolicy && (
          <Text style={{ marginBottom: '12px' }}>
            <strong>🌦️ Météo :</strong> {weatherPolicy}
          </Text>
        )}
        
        <Text style={{ marginBottom: '12px' }}>
          <strong>⏰ Retard :</strong> Merci de nous prévenir au plus tôt si vous avez un empêchement.
        </Text>
      </Section>

      {/* Actions de gestion */}
      {(modifyBookingUrl || cancelBookingUrl) && (
        <>
          <Separator />
          
          <Section>
            <Subtitle>⚙️ Gérer ma réservation</Subtitle>
            
            <Row>
              <Column align="center">
                {modifyBookingUrl && (
                  <Text>
                    <Link href={modifyBookingUrl} style={{ color: '#007ee6' }}>
                      ✏️ Modifier ma réservation
                    </Link>
                  </Text>
                )}
              </Column>
              <Column align="center">
                {cancelBookingUrl && (
                  <Text>
                    <Link href={cancelBookingUrl} style={{ color: '#dc2626' }}>
                      ❌ Annuler ma réservation
                    </Link>
                  </Text>
                )}
              </Column>
            </Row>
          </Section>
        </>
      )}

      {/* 🆕 Section pièces jointes PDF */}
      {attachments && attachments.length > 0 && (
        <Card highlight>
          <Subtitle>📎 Documents joints</Subtitle>
          <Paragraph>
            Les documents suivants sont joints à cet email et contiennent tous les détails de votre réservation :
          </Paragraph>

          {attachments.map((attachment, index) => (
            <Text key={index} style={{
              margin: '8px 0',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
              fontSize: '14px'
            }}>
              📄 <strong>{attachment.filename}</strong>
              <br />
              <span style={{ color: '#666', fontSize: '12px' }}>
                Type: {attachment.contentType} • Taille: {Math.round(attachment.size / 1024)} KB
              </span>
            </Text>
          ))}

          <Text style={{
            fontSize: '13px',
            color: '#007ee6',
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: '12px'
          }}>
            💡 Ces documents contiennent tous les détails légaux et pratiques de votre réservation
          </Text>
        </Card>
      )}

      {/* 🆕 Message contextuel selon le trigger */}
      {trigger && (
        <Text style={{
          fontSize: '14px',
          color: '#666',
          fontStyle: 'italic',
          textAlign: 'center',
          marginTop: '16px'
        }}>
          Email généré automatiquement suite à : {trigger === 'PAYMENT_COMPLETED' ? 'confirmation de votre paiement' : trigger}
        </Text>
      )}

      <Paragraph style={{
        marginTop: '32px', 
        textAlign: 'center', 
        fontSize: '16px',
        color: '#007ee6',
        fontWeight: '600'
      }}>
        Nous avons hâte de vous servir ! 🚀
      </Paragraph>
      
      <SmallText style={{ textAlign: 'center', marginTop: '16px' }}>
        ID de réservation : {bookingId}
      </SmallText>
    </Layout>
  );
};

export default BookingConfirmation;