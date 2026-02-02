/**
 * Template email de confirmation de paiement
 * 
 * Utilité :
 * - Confirme la réception d'un paiement pour une réservation
 * - Fournit les détails de la transaction (montant, méthode, ID)
 * - Confirme la validation du service
 * - Inclut la facture PDF en pièce jointe
 * - Guide vers les prochaines étapes
 * 
 * Technologies utilisées :
 * - React Email : Template responsive et accessible
 * - TypeScript : Validation des données de paiement
 * - Formatage intelligent : Montants, dates, devises
 * - Intégration PDF : Facture en pièce jointe
 * 
 * Cas d'usage :
 * - Envoyé après webhook Stripe payment_intent.succeeded
 * - Confirme la validation du service
 * - Contient les informations de facturation
 * - Guide vers le suivi de réservation
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
 * Interface des données pour le template de confirmation de paiement
 */
export interface PaymentConfirmationData {
  // Informations client
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Informations de paiement
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  paymentDate: string;
  
  // Informations de réservation
  bookingId: string;
  bookingReference: string;
  serviceType: 'MOVING' | 'MOVING_PREMIUM' | 'CUSTOM';
  serviceName: string;
  serviceDate: string;
  serviceTime?: string;
  
  // Informations de facturation
  invoiceNumber?: string;
  invoiceUrl?: string;
  
  // URLs d'action
  viewBookingUrl: string;
  downloadInvoiceUrl?: string;
  supportUrl?: string;
  
  // Configuration
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  
  // Politiques
  refundPolicy?: string;
  cancellationPolicy?: string;

  // 🆕 Pièces jointes PDF
  attachments?: Array<{
    filename: string;
    content: string; // Base64 content
    contentType: string;
    size: number;
  }>;

  // 🆕 Contexte du trigger
  trigger?: string;

  // 🆕 Support prestataires externes
  isProfessionalAttribution?: boolean;
  limitedData?: {
    customerName: string;
    pickupAddress: string;
    deliveryAddress?: string;
    serviceType: string;
    quoteDetails: {
      estimatedAmount: number;
      currency: string;
      serviceCategory: string;
    };
  };

  // Actions pour prestataires
  acceptUrl?: string;
  refuseUrl?: string;
  timeoutDate?: string;
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
 * Obtient l'emoji pour la méthode de paiement
 */
const getPaymentMethodEmoji = (method: string): string => {
  const methodLower = method.toLowerCase();
  if (methodLower.includes('card') || methodLower.includes('carte')) return '💳';
  if (methodLower.includes('paypal')) return '🅿️';
  if (methodLower.includes('sepa')) return '🏦';
  if (methodLower.includes('apple')) return '🍎';
  if (methodLower.includes('google')) return '🔵';
  return '💰';
};

/**
 * Template React Email pour la confirmation de paiement
 */
export const PaymentConfirmation: React.FC<PaymentConfirmationData> = ({
  customerName,
  customerEmail,
  customerPhone,
  amount,
  currency = 'EUR',
  paymentMethod,
  transactionId,
  paymentDate,
  bookingId,
  bookingReference,
  serviceType,
  serviceName,
  serviceDate,
  serviceTime,
  invoiceNumber,
  invoiceUrl,
  viewBookingUrl,
  downloadInvoiceUrl,
  supportUrl,
  companyName = 'Express Quote',
  companyAddress,
  companyPhone,
  companyEmail,
  refundPolicy,
  cancellationPolicy,
  attachments,
  trigger,
  isProfessionalAttribution = false,
  limitedData,
  acceptUrl,
  refuseUrl,
  timeoutDate,
}) => {
  const serviceEmoji = getServiceEmoji(serviceType);
  const paymentEmoji = getPaymentMethodEmoji(paymentMethod);
  
  // Contenu adapté selon le type (client vs prestataire)
  const isAttribution = isProfessionalAttribution && trigger === 'PROFESSIONAL_ATTRIBUTION';

  return (
    <Layout
      preview={isAttribution
        ? `Nouvelle mission disponible - ${bookingReference}`
        : `Paiement confirmé - ${bookingReference} - ${formatPrice(amount, currency)}`}
      title={isAttribution
        ? `Mission ${serviceType} - ${bookingReference}`
        : `Confirmation de paiement - ${bookingReference}`}
      brandName={companyName}
    >
      {/* En-tête adapté */}
      <Title>
        {isAttribution ? '🎯 Nouvelle Mission Disponible !' : `${paymentEmoji} Paiement confirmé !`}
      </Title>

      <Paragraph>
        Bonjour <strong>{customerName}</strong>,
      </Paragraph>

      {isAttribution ? (
        <Paragraph>
          Une nouvelle mission <strong>{serviceType}</strong> est disponible pour votre entreprise.
          Consultez les détails ci-dessous et acceptez rapidement pour confirmer votre participation.
        </Paragraph>
      ) : (
        <Paragraph>
          Excellente nouvelle ! Nous avons bien reçu votre paiement pour votre réservation <strong>{bookingReference}</strong>.
          Votre service est maintenant confirmé et programmé.
        </Paragraph>
      )}

      {/* Section spécialisée pour attribution prestataires */}
      {isAttribution && limitedData && (
        <>
          <Card highlight>
            <Row>
              <Column>
                <Subtitle>🎯 Détails de la Mission</Subtitle>
              </Column>
            </Row>

            <Text style={{ fontSize: '24px', fontWeight: '700', color: '#007ee6', margin: '16px 0' }}>
              {formatPrice(limitedData.quoteDetails.estimatedAmount, limitedData.quoteDetails.currency)} estimé
            </Text>

            <Row style={{ marginTop: '16px' }}>
              <Column>
                <SmallText><strong>Client :</strong></SmallText>
                <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
                  {limitedData.customerName}
                </Text>
                <SmallText style={{ color: '#6b7280', fontStyle: 'italic' }}>
                  📍 Informations complètes révélées après acceptation
                </SmallText>
              </Column>
            </Row>

            <Row style={{ marginTop: '16px' }}>
              <Column>
                <SmallText><strong>Trajet :</strong></SmallText>
                <Text style={{ margin: '0 0 4px 0', fontWeight: '600' }}>
                  📍 {limitedData.pickupAddress}
                </Text>
                {limitedData.deliveryAddress && (
                  <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
                    🎯 {limitedData.deliveryAddress}
                  </Text>
                )}
              </Column>
              <Column align="right">
                <SmallText><strong>Date du service :</strong></SmallText>
                <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
                  {formatDate(serviceDate)}
                </Text>
              </Column>
            </Row>

            {timeoutDate && (
              <Row style={{
                marginTop: '16px',
                backgroundColor: '#fef3c7',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #f59e0b'
              }}>
                <Column>
                  <SmallText style={{ color: '#92400e', fontWeight: '600' }}>
                    ⏰ Réponse attendue avant : {timeoutDate}
                  </SmallText>
                </Column>
              </Row>
            )}
          </Card>

          {/* Actions pour prestataires */}
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Text style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Acceptez-vous cette mission ?
            </Text>

            <Row>
              <Column align="center" style={{ paddingRight: '8px' }}>
                {acceptUrl && (
                  <PrimaryButton href={acceptUrl}>
                    ✅ Accepter la mission
                  </PrimaryButton>
                )}
              </Column>
              <Column align="center" style={{ paddingLeft: '8px' }}>
                {refuseUrl && (
                  <SecondaryButton href={refuseUrl}>
                    ❌ Décliner
                  </SecondaryButton>
                )}
              </Column>
            </Row>
          </Section>

          <Separator />
        </>
      )}

      {/* Informations principales du paiement (clients seulement) */}
      {!isAttribution && (
        <Card highlight>
        <Row>
          <Column>
            <Subtitle>💰 Détails du paiement</Subtitle>
          </Column>
        </Row>
        
        <Text style={{ fontSize: '32px', fontWeight: '700', color: '#16a34a', margin: '16px 0' }}>
          {formatPrice(amount, currency)}
        </Text>
        
        <Row style={{ marginTop: '16px' }}>
          <Column>
            <SmallText><strong>Méthode de paiement :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
              {paymentEmoji} {paymentMethod}
            </Text>
          </Column>
          <Column align="right">
            <SmallText><strong>Date de paiement :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
              {formatDate(paymentDate)}
            </Text>
          </Column>
        </Row>
        
        <Row style={{ marginTop: '16px' }}>
          <Column>
            <SmallText><strong>ID de transaction :</strong></SmallText>
            <Text style={{ 
              margin: '0 0 8px 0', 
              fontFamily: 'monospace',
              fontSize: '12px',
              backgroundColor: '#f3f4f6',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              {transactionId}
            </Text>
          </Column>
        </Row>
        </Card>
      )}

      {/* Confirmation du service (clients seulement) */}
      {!isAttribution && (
        <Card>
        <Subtitle>{serviceEmoji} Votre service confirmé</Subtitle>
        
        <Text style={{ fontSize: '20px', fontWeight: '600', margin: '16px 0' }}>
          {serviceName}
        </Text>
        
        <Row>
          <Column>
            <SmallText><strong>Date du service :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
              {formatDate(serviceDate)}
            </Text>
          </Column>
          {serviceTime && (
            <Column align="right">
              <SmallText><strong>Heure :</strong></SmallText>
              <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
                {formatTime(serviceTime)}
              </Text>
            </Column>
          )}
        </Row>
        
        <Row style={{ marginTop: '16px' }}>
          <Column>
            <SmallText><strong>Référence de réservation :</strong></SmallText>
            <Text style={{ 
              margin: '0 0 8px 0', 
              fontWeight: '600',
              color: '#007ee6'
            }}>
              {bookingReference}
            </Text>
          </Column>
        </Row>
        </Card>
      )}

      {/* Documents (adapté selon le contexte) */}
      <Card>
        <Subtitle>
          {isAttribution ? '📄 Documents de mission' : '📄 Documents et facture'}
        </Subtitle>

        <Text style={{ marginBottom: '16px' }}>
          {isAttribution ? (
            attachments && attachments.length > 0
              ? `Les documents de la mission sont disponibles en pièces jointes (${attachments.length} fichier${attachments.length > 1 ? 's' : ''}). Consultez les détails complets de votre proposition.`
              : 'Les documents de mission seront envoyés après acceptation.'
          ) : (
            attachments && attachments.length > 0
              ? `Vos documents sont disponibles et ont été envoyés en pièces jointes à cet email (${attachments.length} fichier${attachments.length > 1 ? 's' : ''}).`
              : 'Votre facture est disponible et a été envoyée en pièce jointe à cet email.'
          )}
        </Text>

        {/* 🆕 Affichage des pièces jointes */}
        {attachments && attachments.length > 0 && (
          <Section style={{
            backgroundColor: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            marginBottom: '16px'
          }}>
            <SmallText style={{ fontWeight: '600', marginBottom: '8px' }}>
              📎 Documents joints :
            </SmallText>
            {attachments.map((attachment, index) => (
              <Text key={index} style={{
                margin: '4px 0',
                fontSize: '14px',
                color: '#64748b',
                fontFamily: 'monospace'
              }}>
                • {attachment.filename} ({Math.round(attachment.size / 1024)}KB)
              </Text>
            ))}
            {trigger && (
              <SmallText style={{
                marginTop: '8px',
                fontStyle: 'italic',
                color: '#64748b'
              }}>
                Générés suite à : {trigger}
              </SmallText>
            )}
          </Section>
        )}

        {invoiceNumber && (
          <Row style={{ marginBottom: '12px' }}>
            <Column>
              <SmallText><strong>Numéro de facture :</strong></SmallText>
              <Text style={{
                margin: '0 0 8px 0',
                fontWeight: '600',
                fontFamily: 'monospace'
              }}>
                {invoiceNumber}
              </Text>
            </Column>
          </Row>
        )}

        {downloadInvoiceUrl && (
          <Row>
            <Column>
              <SecondaryButton href={downloadInvoiceUrl}>
                📥 Télécharger la facture
              </SecondaryButton>
            </Column>
          </Row>
        )}
      </Card>

      {/* Actions principales */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <PrimaryButton href={viewBookingUrl}>
          📄 Voir ma réservation
        </PrimaryButton>
        
        <Row style={{ marginTop: '16px' }}>
          <Column align="center" style={{ paddingRight: '8px' }}>
            {supportUrl && (
              <SecondaryButton href={supportUrl}>
                🆘 Support client
              </SecondaryButton>
            )}
          </Column>
          <Column align="center" style={{ paddingLeft: '8px' }}>
            {downloadInvoiceUrl && (
              <SecondaryButton href={downloadInvoiceUrl}>
                📄 Ma facture
              </SecondaryButton>
            )}
          </Column>
        </Row>
      </Section>

      <Separator />

      {/* Prochaines étapes */}
      <Card>
        <Subtitle>🚀 Prochaines étapes</Subtitle>
        
        <ol style={{ margin: '16px 0', paddingLeft: '20px', fontSize: '15px', lineHeight: '1.6' }}>
          <li style={{ marginBottom: '8px' }}>
            <strong>Conservez cet email</strong> comme preuve de paiement
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Vérifiez vos informations</strong> dans votre réservation
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Préparez-vous</strong> selon les instructions reçues
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Contactez-nous</strong> si vous avez des questions
          </li>
        </ol>
      </Card>

      {/* Informations de contact */}
      <Card>
        <Subtitle>📞 Besoin d'aide ?</Subtitle>
        
        <Text style={{ marginBottom: '16px' }}>
          Notre équipe est là pour vous accompagner jusqu'à la réalisation de votre service.
        </Text>
        
        <Row>
          <Column>
            {companyPhone && (
              <Text style={{ marginBottom: '8px' }}>
                📞 <Link href={`tel:${companyPhone}`} style={{ color: '#007ee6' }}>
                  {companyPhone}
                </Link>
              </Text>
            )}
            {companyEmail && (
              <Text style={{ marginBottom: '8px' }}>
                📧 <Link href={`mailto:${companyEmail}`} style={{ color: '#007ee6' }}>
                  {companyEmail}
                </Link>
              </Text>
            )}
            {supportUrl && (
              <Text>
                🌐 <Link href={supportUrl} style={{ color: '#007ee6' }}>
                  Centre d'aide
                </Link>
              </Text>
            )}
          </Column>
        </Row>
      </Card>

      {/* Politiques importantes */}
      <Section>
        <Subtitle>📋 Informations importantes</Subtitle>
        
        {refundPolicy && (
          <Text style={{ marginBottom: '12px' }}>
            <strong>🔄 Remboursement :</strong> {refundPolicy}
          </Text>
        )}
        
        {cancellationPolicy && (
          <Text style={{ marginBottom: '12px' }}>
            <strong>🚫 Annulation :</strong> {cancellationPolicy}
          </Text>
        )}
        
        <Text style={{ marginBottom: '12px' }}>
          <strong>📧 Communication :</strong> Nous vous tiendrons informé de l'avancement de votre service par email et SMS.
        </Text>
        
        <Text style={{ marginBottom: '12px' }}>
          <strong>🛡️ Sécurité :</strong> Vos données de paiement sont sécurisées et ne sont pas stockées sur nos serveurs.
        </Text>
      </Section>

      <Section style={{ 
        marginTop: '32px', 
        textAlign: 'center'
      }}>
        <Text style={{ 
          fontSize: '16px',
          color: '#16a34a',
          fontWeight: '600'
        }}>
          Merci pour votre confiance ! 🎉
        </Text>
      </Section>
      
      <Section style={{ textAlign: 'center', marginTop: '16px' }}>
        <SmallText>
          ID de transaction : {transactionId} | ID de réservation : {bookingId}
        </SmallText>
      </Section>
    </Layout>
  );
};

export default PaymentConfirmation;
