/**
 * API pour les notifications business utilisant React Email templates
 * Gère l'envoi d'emails aux professionnels (attribution, confirmation, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/components';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { 
  ProfessionalAttribution, 
  MissionAcceptedConfirmation,
  type QuoteConfirmationData,
  type BookingConfirmationData,
  type PaymentConfirmationData,
  type ServiceReminderData,
  type Reminder24hData,
  type Reminder7dData,
  type Reminder1hData
} from '@/notifications/templates/react-email';

const prisma = new PrismaClient();

// Configuration SMTP
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface ProfessionalAttributionRequest {
  type: 'professional-attribution';
  professionalEmail: string;
  attributionId: string;
  serviceType: string;
  totalAmount: number;
  scheduledDate: string;
  scheduledTime: string;
  locationCity: string;
  locationDistrict: string;
  distanceKm: number;
  duration: string;
  description: string;
  requirements: string;
  acceptUrl: string;
  refuseUrl: string;
  dashboardUrl: string;
  attributionDetailsUrl: string;
  priority: 'normal' | 'high' | 'urgent';
  expiresAt: string;
  supportEmail: string;
  supportPhone: string;
}

interface MissionAcceptedRequest {
  type: 'mission-accepted-confirmation';
  professionalEmail: string;
  professionalName: string;
  attributionId: string;
  serviceType: string;
  totalAmount: number;
  scheduledDate: string;
  scheduledTime: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceAddress: string;
  instructions: string;
  dashboardUrl: string;
  supportEmail: string;
  supportPhone: string;
}

type BusinessNotificationRequest = ProfessionalAttributionRequest | MissionAcceptedRequest;

export async function POST(request: NextRequest) {
  try {
    const data: BusinessNotificationRequest = await request.json();

    console.log(`📧 Envoi notification business: ${data.type} vers ${data.professionalEmail}`);

    let emailHtml: string;
    let subject: string;

    switch (data.type) {
      case 'professional-attribution':
        emailHtml = render(ProfessionalAttribution(data));
        subject = `🚀 Nouvelle mission ${data.serviceType} - ${data.totalAmount}€ à ${data.locationCity}`;
        break;

      case 'mission-accepted-confirmation':
        emailHtml = render(MissionAcceptedConfirmation(data));
        subject = `✅ Mission confirmée - ${data.serviceType} le ${data.scheduledDate}`;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Type de notification non supporté' },
          { status: 400 }
        );
    }

    // Envoi de l'email
    const mailOptions = {
      from: `"Express Quote" <${process.env.SMTP_USER}>`,
      to: data.professionalEmail,
      subject,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);

    console.log(`✅ Email envoyé avec succès à ${data.professionalEmail}`);

    return NextResponse.json({
      success: true,
      message: 'Notification envoyée avec succès',
      emailSent: true
    });

  } catch (error) {
    console.error('❌ Erreur envoi notification business:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de l\'envoi de la notification',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({
        success: true,
        availableTypes: [
          'professional-attribution',
          'mission-accepted-confirmation'
        ],
        description: 'API pour l\'envoi de notifications business aux professionnels'
      });
    }

    // Renvoie un exemple de payload pour le type demandé
    switch (type) {
      case 'professional-attribution':
        return NextResponse.json({
          success: true,
          type: 'professional-attribution',
          examplePayload: {
            type: 'professional-attribution',
            professionalEmail: 'professionnel@example.com',
            attributionId: 'attr_123',
            serviceType: 'Déménagement',
            totalAmount: 450,
            scheduledDate: '15 mars 2024',
            scheduledTime: '09:00',
            locationCity: 'Paris',
            locationDistrict: '15ème arrondissement',
            distanceKm: 12.5,
            duration: '4-6h',
            description: 'Mission de déménagement T3 vers T4',
            requirements: 'Véhicule grand volume, matériel d\'emballage',
            acceptUrl: 'https://express-quote.com/api/attribution/attr_123/accept?professionalId=prof_456&token=abc123',
            refuseUrl: 'https://express-quote.com/api/attribution/attr_123/refuse?professionalId=prof_456&token=abc123',
            dashboardUrl: 'https://express-quote.com/professional/dashboard',
            attributionDetailsUrl: 'https://express-quote.com/professional/attributions/attr_123',
            priority: 'normal',
            expiresAt: '16 mars 2024 09:00',
            supportEmail: 'support@express-quote.com',
            supportPhone: '+33 1 23 45 67 89'
          }
        });

      case 'mission-accepted-confirmation':
        return NextResponse.json({
          success: true,
          type: 'mission-accepted-confirmation',
          examplePayload: {
            type: 'mission-accepted-confirmation',
            professionalEmail: 'professionnel@example.com',
            professionalName: 'Déménagements Express',
            attributionId: 'attr_123',
            serviceType: 'Déménagement',
            totalAmount: 450,
            scheduledDate: '15 mars 2024',
            scheduledTime: '09:00',
            clientName: 'Marie Martin',
            clientPhone: '+33 1 23 45 67 89',
            clientEmail: 'marie.martin@example.com',
            serviceAddress: '123 Rue de la Paix, 75001 Paris',
            instructions: 'Sonnez au 2ème étage, code d\'accès 1234',
            dashboardUrl: 'https://express-quote.com/professional/dashboard',
            supportEmail: 'support@express-quote.com',
            supportPhone: '+33 1 23 45 67 89'
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Type de notification non reconnu' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Erreur API business notifications:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}