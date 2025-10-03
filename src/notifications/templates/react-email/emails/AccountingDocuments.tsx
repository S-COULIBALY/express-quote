/**
 * Template React Email pour la comptabilité
 * Notifie de nouveaux documents comptables avec détails financiers
 * 
 * Utilité :
 * - Notifie de nouveaux documents comptables générés automatiquement
 * - Fournit un récapitulatif financier détaillé
 * - Inclut les documents en pièces jointes
 * - Guide vers les actions comptables recommandées
 * 
 * Technologies utilisées :
 * - React Email : Template responsive et accessible
 * - TypeScript : Validation des données comptables
 * - Formatage intelligent : Montants, dates, devises
 * - Rendu conditionnel : Documents et statuts dynamiques
 * 
 * Cas d'usage :
 * - Envoyé après génération de documents comptables
 * - Contient les informations légales de l'entreprise
 * - Guide les actions comptables recommandées
 * - Inclut les documents en pièces jointes
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
 * Interface des données pour le template de documents comptables
 */
export interface AccountingDocumentsData {
  // Informations comptable
  accountingName: string;
  accountingEmail?: string;
  accountingPhone?: string;
  
  // Informations financières
  bookingId: string;
  bookingReference: string;
  serviceType: 'MOVING' | 'CLEANING' | 'DELIVERY' | 'CUSTOM';
  serviceName?: string;
  totalAmount: number;
  currency: string;
  
  // Informations client
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Dates comptables
  bookingDate: string;
  paymentDate?: string;
  invoiceDate?: string;
  
  // Documents comptables
  documentsCount: number;
  documentTypes: string[];
  attachedDocuments: Array<{
    filename: string;
    type: 'QUOTE' | 'INVOICE' | 'PAYMENT_RECEIPT' | 'CONTRACT' | 'OTHER';
    size: number;
    url?: string;
  }>;
  
  // Contexte et déclencheur
  trigger: 'payment_completed' | 'invoice_generated' | 'quote_confirmed' | 'manual';
  reason: string;
  
  // Indicateurs comptables
  hasInvoice: boolean;
  hasPaymentReceipt: boolean;
  hasQuote: boolean;
  hasContract?: boolean;
  
  // URLs d'action
  viewBookingUrl: string;
  accountingDashboardUrl: string;
  downloadAllUrl: string;
  viewInvoiceUrl?: string;
  supportUrl?: string;
  
  // Informations entreprise
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail?: string;
  siretNumber: string;
  vatNumber: string;
  
  // Configuration
  urgencyLevel?: 'low' | 'medium' | 'high';
  requiresAction?: boolean;
  actionDeadline?: string;
  
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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
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
 * Obtient l'emoji pour le type de document
 */
const getDocumentEmoji = (type: string): string => {
  switch (type) {
    case 'QUOTE': return '📋';
    case 'INVOICE': return '🧾';
    case 'PAYMENT_RECEIPT': return '💰';
    case 'CONTRACT': return '📄';
    default: return '📎';
  }
};

/**
 * Obtient la couleur d'urgence
 */
const getUrgencyColor = (level: string): string => {
  switch (level) {
    case 'high': return '#dc2626';
    case 'medium': return '#f59e0b';
    default: return '#3b82f6';
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
 * Template React Email pour les documents comptables
 */
export const AccountingDocuments: React.FC<AccountingDocumentsData> = ({
  accountingName,
  accountingEmail,
  accountingPhone,
  bookingId,
  bookingReference,
  serviceType,
  serviceName,
  totalAmount,
  currency = 'EUR',
  customerName,
  customerEmail,
  customerPhone,
  bookingDate,
  paymentDate,
  invoiceDate,
  documentsCount,
  documentTypes,
  attachedDocuments = [],
  trigger,
  reason,
  hasInvoice,
  hasPaymentReceipt,
  hasQuote,
  hasContract = false,
  viewBookingUrl,
  accountingDashboardUrl,
  downloadAllUrl,
  viewInvoiceUrl,
  supportUrl,
  companyName = 'Express Quote',
  companyAddress,
  companyPhone,
  companyEmail,
  siretNumber,
  vatNumber,
  urgencyLevel = 'medium',
  requiresAction = true,
  actionDeadline,
  unsubscribeUrl,
  preferencesUrl,
}) => {
  const serviceEmoji = getServiceEmoji(serviceType);
  const urgencyColor = getUrgencyColor(urgencyLevel);
  const serviceDisplayName = serviceName || getServiceDisplayName(serviceType);
  
  return (
    <Layout
      preview={`Documents comptables ${bookingReference} - ${formatPrice(totalAmount, currency)} - ${documentsCount} document(s)`}
      title={`Documents comptables - ${bookingReference}`}
      brandName={companyName}
      unsubscribeUrl={unsubscribeUrl}
      preferencesUrl={preferencesUrl}
    >
      {/* En-tête avec niveau d'urgence */}
      <Title>
        {serviceEmoji} Nouveaux documents comptables
      </Title>
      
      <Paragraph>
        Bonjour <strong>{accountingName}</strong>,
      </Paragraph>
      
      <Paragraph>
        {getIntroMessage(trigger, reason, documentsCount, serviceDisplayName)}
      </Paragraph>

      {/* Alerte d'urgence si nécessaire */}
      {requiresAction && urgencyLevel === 'high' && (
        <Card>
          <Subtitle>
            🚨 Action requise
          </Subtitle>
          <Text>
            Ces documents nécessitent une action immédiate.
            {actionDeadline && ` Délai : ${formatDate(actionDeadline)}`}
          </Text>
        </Card>
      )}

      {/* Résumé financier */}
      <Card highlight>
        <Subtitle>💰 Résumé financier</Subtitle>
        
        <Text style={{ fontSize: '32px', fontWeight: '700', color: '#16a34a', margin: '16px 0' }}>
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
      </Card>

      {/* Détails comptables */}
      <Card>
        <Subtitle>📊 Détails comptables</Subtitle>
        
        <Row style={{ marginBottom: '12px' }}>
          <Column>
            <SmallText><strong>Client :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
              {customerName}
            </Text>
          </Column>
        </Row>
        
        <Row style={{ marginBottom: '12px' }}>
          <Column>
            <SmallText><strong>Contact :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0' }}>
              <Link href={`mailto:${customerEmail}`} style={{ color: '#007ee6' }}>
                {customerEmail}
              </Link>
              {customerPhone && (
                <>
                  {' • '}
                  <Link href={`tel:${customerPhone}`} style={{ color: '#007ee6' }}>
                    {customerPhone}
                  </Link>
                </>
              )}
            </Text>
          </Column>
        </Row>
        
        <Row style={{ marginBottom: '12px' }}>
          <Column>
            <SmallText><strong>Date réservation :</strong></SmallText>
            <Text style={{ margin: '0 0 8px 0' }}>
              {formatDate(bookingDate)}
            </Text>
          </Column>
        </Row>
        
        {paymentDate && (
          <Row style={{ marginBottom: '12px' }}>
            <Column>
              <SmallText><strong>Date paiement :</strong></SmallText>
              <Text style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#16a34a' }}>
                {formatDate(paymentDate)}
              </Text>
            </Column>
          </Row>
        )}
        
        {invoiceDate && (
          <Row style={{ marginBottom: '12px' }}>
            <Column>
              <SmallText><strong>Date facture :</strong></SmallText>
              <Text style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
                {formatDate(invoiceDate)}
              </Text>
            </Column>
          </Row>
        )}
      </Card>

      {/* Statut des documents comptables */}
      <Card>
        <Subtitle>📋 Documents générés ({documentsCount})</Subtitle>
        
        <Row style={{ marginBottom: '16px' }}>
          <Column style={{ width: '25%', padding: '0 4px' }}>
            <div style={{
              backgroundColor: hasQuote ? '#d4edda' : '#f8d7da',
              border: `1px solid ${hasQuote ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '6px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <Text style={{ fontSize: '16px', margin: '0 0 4px 0' }}>
                {hasQuote ? '✅' : '❌'}
              </Text>
              <Text style={{ 
                fontSize: '12px', 
                fontWeight: 'bold', 
                margin: '0',
                color: hasQuote ? '#155724' : '#721c24'
              }}>
                Devis
              </Text>
            </div>
          </Column>
          <Column style={{ width: '25%', padding: '0 4px' }}>
            <div style={{
              backgroundColor: hasInvoice ? '#d4edda' : '#f8d7da',
              border: `1px solid ${hasInvoice ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '6px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <Text style={{ fontSize: '16px', margin: '0 0 4px 0' }}>
                {hasInvoice ? '✅' : '❌'}
              </Text>
              <Text style={{ 
                fontSize: '12px', 
                fontWeight: 'bold', 
                margin: '0',
                color: hasInvoice ? '#155724' : '#721c24'
              }}>
                Facture
              </Text>
            </div>
          </Column>
          <Column style={{ width: '25%', padding: '0 4px' }}>
            <div style={{
              backgroundColor: hasPaymentReceipt ? '#d4edda' : '#f8d7da',
              border: `1px solid ${hasPaymentReceipt ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '6px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <Text style={{ fontSize: '16px', margin: '0 0 4px 0' }}>
                {hasPaymentReceipt ? '✅' : '❌'}
              </Text>
              <Text style={{ 
                fontSize: '12px', 
                fontWeight: 'bold', 
                margin: '0',
                color: hasPaymentReceipt ? '#155724' : '#721c24'
              }}>
                Reçu
              </Text>
            </div>
          </Column>
          <Column style={{ width: '25%', padding: '0 4px' }}>
            <div style={{
              backgroundColor: hasContract ? '#d4edda' : '#f8d7da',
              border: `1px solid ${hasContract ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '6px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <Text style={{ fontSize: '16px', margin: '0 0 4px 0' }}>
                {hasContract ? '✅' : '❌'}
              </Text>
              <Text style={{ 
                fontSize: '12px', 
                fontWeight: 'bold', 
                margin: '0',
                color: hasContract ? '#155724' : '#721c24'
              }}>
                Contrat
              </Text>
            </div>
          </Column>
        </Row>
      </Card>

      {/* Documents attachés */}
      {attachedDocuments.length > 0 && (
        <Card>
          <Subtitle>📎 Pièces jointes ({attachedDocuments.length})</Subtitle>
          
          {attachedDocuments.map((doc, index) => (
            <Row key={index} style={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #e9ecef',
              borderRadius: '4px',
              margin: '8px 0',
              padding: '12px'
            }}>
              <Column style={{ width: '40px' }}>
                <Text style={{ fontSize: '20px', margin: '0' }}>
                  {getDocumentEmoji(doc.type)}
                </Text>
              </Column>
              <Column>
                <Text style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  margin: '0 0 4px 0',
                  color: '#333333'
                }}>
                  {doc.filename}
                </Text>
                <Text style={{ 
                  fontSize: '12px', 
                  margin: '0',
                  color: '#666666'
                }}>
                  {doc.type} • {(doc.size / 1024).toFixed(1)} KB
                </Text>
              </Column>
              <Column style={{ width: '60px', textAlign: 'right' }}>
                <Text style={{ 
                  color: '#16a34a', 
                  fontSize: '12px', 
                  fontWeight: 'bold', 
                  margin: '0'
                }}>
                  Prêt
                </Text>
              </Column>
            </Row>
          ))}
          
          <Text style={{ 
            color: '#16a34a',
            fontSize: '13px',
            fontStyle: 'italic',
            margin: '16px 0 0 0',
            textAlign: 'center'
          }}>
            📁 Tous les documents sont en pièce jointe de cet email
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
            <SecondaryButton href={downloadAllUrl}>
              📥 Télécharger tout
            </SecondaryButton>
          </Column>
          <Column align="center" style={{ paddingLeft: '8px' }}>
            <SecondaryButton href={accountingDashboardUrl}>
              📊 Dashboard comptable
            </SecondaryButton>
          </Column>
        </Row>
        
        {viewInvoiceUrl && (
          <Row style={{ marginTop: '16px' }}>
            <Column align="center">
              <SecondaryButton href={viewInvoiceUrl}>
                🧾 Voir la facture
              </SecondaryButton>
            </Column>
          </Row>
        )}
      </Section>

      <Separator />

      {/* Instructions comptables */}
      <Card>
        <Subtitle>📋 Actions comptables recommandées</Subtitle>
        
        {getAccountingInstructions(hasInvoice, hasPaymentReceipt, hasQuote, hasContract).map((instruction, index) => (
          <Text key={index} style={{ 
            margin: '8px 0',
            paddingLeft: '8px',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            {instruction.icon} {instruction.text}
          </Text>
        ))}
      </Card>

      {/* Informations légales */}
      <Card>
        <Subtitle>🏢 Informations légales</Subtitle>
        
        <Text style={{ margin: '8px 0' }}>
          <strong>{companyName}</strong>
        </Text>
        <Text style={{ margin: '4px 0' }}>
          {companyAddress}
        </Text>
        <Text style={{ margin: '4px 0' }}>
          Tél : {companyPhone}
        </Text>
        {companyEmail && (
          <Text style={{ margin: '4px 0' }}>
            Email : <Link href={`mailto:${companyEmail}`} style={{ color: '#007ee6' }}>
              {companyEmail}
            </Link>
          </Text>
        )}
        <Text style={{ margin: '4px 0' }}>
          SIRET : {siretNumber}
        </Text>
        <Text style={{ margin: '4px 0' }}>
          TVA : {vatNumber}
        </Text>
      </Card>

      <Separator />

      {/* Footer */}
      <Section>
        <Text style={{ 
          margin: '8px 0',
          fontSize: '14px',
          color: '#666666',
          textAlign: 'center'
        }}>
          Document généré automatiquement suite à : {reason}
        </Text>
        
        <Text style={{ 
          margin: '8px 0',
          fontSize: '14px',
          color: '#666666',
          textAlign: 'center'
        }}>
          Ce message contient des informations financières confidentielles.
        </Text>
        
        <Text style={{ 
          margin: '8px 0',
          fontSize: '12px',
          color: '#999999',
          textAlign: 'center'
        }}>
          © {new Date().getFullYear()} {companyName} - Service Comptabilité
        </Text>
      </Section>
    </Layout>
  );
};

/**
 * Génère le message d'introduction selon le déclencheur
 */
const getIntroMessage = (trigger: string, reason: string, documentsCount: number, serviceName: string): string => {
  switch (trigger) {
    case 'payment_completed':
      return `Un paiement vient d'être confirmé pour ${serviceName} et ${documentsCount} document(s) comptable(s) ont été générés automatiquement.`;
    case 'invoice_generated':
      return `Une nouvelle facture a été générée pour ${serviceName} avec ${documentsCount} document(s) comptable(s).`;
    case 'quote_confirmed':
      return `Un devis a été confirmé pour ${serviceName} et ${documentsCount} document(s) comptable(s) sont maintenant disponibles.`;
    default:
      return `${documentsCount} document(s) comptable(s) ont été générés suite à : ${reason}.`;
  }
};

/**
 * Génère les instructions comptables selon les documents disponibles
 */
const getAccountingInstructions = (
  hasInvoice: boolean, 
  hasPaymentReceipt: boolean, 
  hasQuote: boolean, 
  hasContract: boolean = false
): Array<{ icon: string; text: string }> => {
  const instructions = [];
  
  if (hasPaymentReceipt) {
    instructions.push(
      { icon: '💰', text: 'Enregistrer le paiement dans la comptabilité' },
      { icon: '🏦', text: 'Vérifier que le montant correspond au virement bancaire' },
      { icon: '📊', text: 'Mettre à jour le suivi des encaissements' }
    );
  }
  
  if (hasInvoice) {
    instructions.push(
      { icon: '📝', text: 'Archiver la facture selon la numérotation chronologique' },
      { icon: '📊', text: 'Mettre à jour le chiffre d\'affaires du mois' },
      { icon: '📋', text: 'Vérifier la conformité TVA' }
    );
  }
  
  if (hasQuote) {
    instructions.push(
      { icon: '📋', text: 'Archiver le devis confirmé pour audit' },
      { icon: '📈', text: 'Suivre le taux de conversion devis → facture' }
    );
  }
  
  if (hasContract) {
    instructions.push(
      { icon: '📄', text: 'Archiver le contrat dans le dossier client' },
      { icon: '⏰', text: 'Programmer les relances si nécessaire' }
    );
  }
  
  instructions.push(
    { icon: '📁', text: 'Classer tous les documents dans le dossier client' },
    { icon: '⏰', text: 'Respecter les délais de déclaration TVA si applicable' },
    { icon: '🔍', text: 'Vérifier la cohérence des montants entre documents' }
  );
  
  return instructions;
};

export default AccountingDocuments;