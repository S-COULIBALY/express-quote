/**
 * Template email de confirmation de devis
 * 
 * Utilité :
 * - Confirme la réception d'une demande de devis
 * - Fournit un récapitulatif détaillé des services demandés
 * - Guide l'utilisateur vers les prochaines étapes
 * - Inclut les informations de contact et support
 * 
 * Technologies utilisées :
 * - React Email : Rendu HTML optimisé pour tous les clients
 * - TypeScript : Type safety pour les données du devis
 * - Layout réutilisable : Consistance visuelle
 * - Formatage automatique : Dates, prix, adresses
 * 
 * Cas d'usage :
 * - Envoyé automatiquement après soumission d'un devis
 * - Contient un lien de suivi et modification
 * - Rappel des délais de validation
 * - Information sur le processus de réservation
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
 * Interface des données pour le template de confirmation de devis
 */
export interface QuoteConfirmationData {
  // Informations client
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Informations du devis
  quoteId: string;
  quoteNumber: string;
  serviceType: 'MOVING' | 'CLEANING' | 'DELIVERY' | 'CUSTOM';
  serviceName: string;
  
  // Détails du service
  serviceDate?: string;
  serviceTime?: string;
  estimatedDuration?: number; // en heures
  
  // Adresses
  pickupAddress?: string;
  deliveryAddress?: string;
  serviceAddress?: string;
  
  // Pricing
  subtotalAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  currency: string;
  
  // Détails additionnels
  specialRequirements?: string;
  equipment?: string[];
  teamSize?: number;
  
  // URLs d'action
  viewQuoteUrl: string;
  modifyQuoteUrl?: string;
  bookServiceUrl?: string;
  supportUrl?: string;
  
  // Configuration
  validUntil?: string;
  estimatedProcessingTime?: string; // ex: "24-48 heures"
  companyName?: string;
  
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
 * Template React Email pour la confirmation de devis
 */
export const QuoteConfirmation: React.FC<QuoteConfirmationData> = ({
  customerName,
  customerEmail,
  customerPhone,
  quoteId,
  quoteNumber,
  serviceType,
  serviceName,
  serviceDate,
  serviceTime,
  estimatedDuration,
  pickupAddress,
  deliveryAddress,
  serviceAddress,
  subtotalAmount,
  discountAmount = 0,
  taxAmount = 0,
  totalAmount,
  currency = 'EUR',
  specialRequirements,
  equipment = [],
  teamSize,
  viewQuoteUrl,
  modifyQuoteUrl,
  bookServiceUrl,
  supportUrl,
  validUntil,
  estimatedProcessingTime = '24-48 heures',
  companyName = 'Express Quote',
  unsubscribeUrl,
  preferencesUrl,
}) => {
  const serviceEmoji = getServiceEmoji(serviceType);
  
  return (
    <Layout
      preview={`Votre devis ${quoteNumber} a été reçu - ${formatPrice(totalAmount, currency)}`}
      title={`Confirmation de devis - ${quoteNumber}`}
      brandName={companyName}
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      {/* En-tête personnalisé */}
      <Title>
        {serviceEmoji} Votre devis a été reçu !
      </Title>
      
      <Paragraph>
        Bonjour <strong>{customerName}</strong>,
      </Paragraph>
      
      <Paragraph>
        Nous avons bien reçu votre demande de devis pour <strong>{serviceName}</strong>. 
        Notre équipe analyse votre demande et vous recevrez une réponse détaillée dans les <strong>{estimatedProcessingTime}</strong>.
      </Paragraph>

      {/* Informations du devis */}
      <Card>
        <Subtitle>📋 Récapitulatif de votre demande</Subtitle>
        
        <Row>
          <Column>
            <SmallText><strong>Numéro de devis :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
              {quoteNumber}
            </Text>
          </Column>
          <Column>
            <SmallText><strong>ID de référence :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
              {quoteId}
            </Text>
          </Column>
        </Row>

        <Hr style={{ margin: '16px 0', borderColor: '#e0e0e0' }} />

        {/* Service demandé */}
        <Row>
          <Column>
            <SmallText><strong>Service demandé :</strong></SmallText>
            <Text style={{ margin: '0 0 12px 0' }}>{serviceName}</Text>
          </Column>
        </Row>

        {/* Date et heure */}
        {serviceDate && (
          <Row>
            <Column>
              <SmallText><strong>Date prévue :</strong></SmallText>
              <Text style={{ margin: '0 0 12px 0' }}>
                {formatDate(serviceDate)}
                {serviceTime && ` à ${serviceTime}`}
              </Text>
            </Column>
            {estimatedDuration && (
              <Column>
                <SmallText><strong>Durée estimée :</strong></SmallText>
                <Text style={{ margin: '0 0 12px 0' }}>
                  {estimatedDuration} heure{estimatedDuration > 1 ? 's' : ''}
                </Text>
              </Column>
            )}
          </Row>
        )}

        {/* Adresses */}
        {(pickupAddress || deliveryAddress || serviceAddress) && (
          <>
            <Hr style={{ margin: '16px 0', borderColor: '#e0e0e0' }} />
            
            {pickupAddress && (
              <Row style={{ marginBottom: '12px' }}>
                <Column>
                  <SmallText><strong>📍 Adresse de départ :</strong></SmallText>
                  <Text style={{ margin: '0 0 8px 0' }}>{pickupAddress}</Text>
                </Column>
              </Row>
            )}
            
            {deliveryAddress && (
              <Row style={{ marginBottom: '12px' }}>
                <Column>
                  <SmallText><strong>📍 Adresse de livraison :</strong></SmallText>
                  <Text style={{ margin: '0 0 8px 0' }}>{deliveryAddress}</Text>
                </Column>
              </Row>
            )}
            
            {serviceAddress && (
              <Row style={{ marginBottom: '12px' }}>
                <Column>
                  <SmallText><strong>📍 Adresse du service :</strong></SmallText>
                  <Text style={{ margin: '0 0 8px 0' }}>{serviceAddress}</Text>
                </Column>
              </Row>
            )}
          </>
        )}

        {/* Équipe et équipement */}
        {(teamSize || equipment.length > 0) && (
          <>
            <Hr style={{ margin: '16px 0', borderColor: '#e0e0e0' }} />
            
            {teamSize && (
              <Row style={{ marginBottom: '12px' }}>
                <Column>
                  <SmallText><strong>👥 Taille de l'équipe :</strong></SmallText>
                  <Text style={{ margin: '0 0 8px 0' }}>
                    {teamSize} personne{teamSize > 1 ? 's' : ''}
                  </Text>
                </Column>
              </Row>
            )}
            
            {equipment.length > 0 && (
              <Row style={{ marginBottom: '12px' }}>
                <Column>
                  <SmallText><strong>🛠️ Équipement requis :</strong></SmallText>
                  <Text style={{ margin: '0 0 8px 0' }}>
                    {equipment.join(', ')}
                  </Text>
                </Column>
              </Row>
            )}
          </>
        )}

        {/* Exigences spéciales */}
        {specialRequirements && (
          <>
            <Hr style={{ margin: '16px 0', borderColor: '#e0e0e0' }} />
            <Row>
              <Column>
                <SmallText><strong>📝 Exigences spéciales :</strong></SmallText>
                <Text style={{ margin: '0 0 8px 0' }}>{specialRequirements}</Text>
              </Column>
            </Row>
          </>
        )}
      </Card>

      {/* Estimation des coûts */}
      <Card highlight>
        <Subtitle>💰 Estimation des coûts</Subtitle>
        
        <Row style={{ marginBottom: '8px' }}>
          <Column>
            <Text>Sous-total :</Text>
          </Column>
          <Column align="right">
            <Text>{formatPrice(subtotalAmount, currency)}</Text>
          </Column>
        </Row>
        
        {discountAmount > 0 && (
          <Row style={{ marginBottom: '8px' }}>
            <Column>
              <Text style={{ color: '#16a34a' }}>Remise :</Text>
            </Column>
            <Column align="right">
              <Text style={{ color: '#16a34a' }}>
                -{formatPrice(discountAmount, currency)}
              </Text>
            </Column>
          </Row>
        )}
        
        {taxAmount > 0 && (
          <Row style={{ marginBottom: '8px' }}>
            <Column>
              <Text>TVA :</Text>
            </Column>
            <Column align="right">
              <Text>{formatPrice(taxAmount, currency)}</Text>
            </Column>
          </Row>
        )}
        
        <Hr style={{ margin: '12px 0', borderColor: '#d0d0d0' }} />
        
        <Row>
          <Column>
            <Text style={{ fontSize: '18px', fontWeight: '700' }}>
              Total estimé :
            </Text>
          </Column>
          <Column align="right">
            <Text style={{ 
              fontSize: '18px', 
              fontWeight: '700',
              color: '#007ee6'
            }}>
              {formatPrice(totalAmount, currency)}
            </Text>
          </Column>
        </Row>

        {validUntil && (
          <SmallText style={{ marginTop: '12px', textAlign: 'center' }}>
            Cette estimation est valable jusqu'au {formatDate(validUntil)}
          </SmallText>
        )}
      </Card>

      {/* Actions principales */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <PrimaryButton href={viewQuoteUrl}>
          📄 Voir mon devis complet
        </PrimaryButton>
        
        <Row style={{ marginTop: '16px' }}>
          <Column align="center" style={{ paddingRight: '8px' }}>
            {modifyQuoteUrl && (
              <SecondaryButton href={modifyQuoteUrl}>
                ✏️ Modifier ma demande
              </SecondaryButton>
            )}
          </Column>
          <Column align="center" style={{ paddingLeft: '8px' }}>
            {bookServiceUrl && (
              <SecondaryButton href={bookServiceUrl}>
                📅 Réserver maintenant
              </SecondaryButton>
            )}
          </Column>
        </Row>
      </Section>

      <Separator />

      {/* Prochaines étapes */}
      <Subtitle>🚀 Que se passe-t-il maintenant ?</Subtitle>
      
      <Text>
        <strong>1. Analyse de votre demande</strong><br />
        Notre équipe étudie les détails de votre demande pour vous fournir un devis précis.
      </Text>
      
      <Text>
        <strong>2. Devis personnalisé</strong><br />
        Vous recevrez un devis détaillé avec les tarifs finaux dans les {estimatedProcessingTime}.
      </Text>
      
      <Text>
        <strong>3. Validation et réservation</strong><br />
        Une fois le devis validé, vous pourrez réserver votre créneau en quelques clics.
      </Text>

      <Separator />

      {/* Contact et support */}
      <Subtitle>🆘 Besoin d'aide ?</Subtitle>
      
      <Paragraph>
        Notre équipe support est là pour vous aider ! N'hésitez pas à nous contacter :
      </Paragraph>
      
      <Row>
        <Column align="center">
          {customerPhone && (
            <Text>
              📞 <Link href={`tel:${customerPhone}`}>Nous appeler</Link>
            </Text>
          )}
        </Column>
        <Column align="center">
          <Text>
            ✉️ <Link href={`mailto:support@${companyName?.toLowerCase().replace(' ', '-')}.com`}>
              Nous écrire
            </Link>
          </Text>
        </Column>
        <Column align="center">
          {supportUrl && (
            <Text>
              🌐 <Link href={supportUrl} target="_blank">Centre d'aide</Link>
            </Text>
          )}
        </Column>
      </Row>

      <Paragraph style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
        Merci de faire confiance à <strong>{companyName}</strong> ! 🙏
      </Paragraph>
    </Layout>
  );
};

export default QuoteConfirmation;