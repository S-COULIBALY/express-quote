import { WhatsAppTemplate } from '../../../domain/interfaces/whatsapp/types';

interface TemplateConfig {
    name: string;
    language: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    components: {
        type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
        format?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
        text?: string;
        example?: {
            header_text?: string[];
            body_text?: string[];
            header_handle?: string[];
        };
    }[];
}

export const WHATSAPP_TEMPLATES: Record<string, TemplateConfig> = {
    quote_request_confirmation: {
        name: 'quote_request_confirmation',
        language: 'fr',
        category: 'UTILITY',
        components: [
            {
                type: 'HEADER',
                format: 'TEXT',
                text: 'Confirmation de demande de devis',
                example: {
                    header_text: ['Confirmation de demande de devis']
                }
            },
            {
                type: 'BODY',
                text: 'Bonjour {{1}},\n\nNous avons bien reçu votre demande de devis pour {{2}}.\n\nNotre équipe va l\'étudier dans les plus brefs délais et vous enverra une proposition personnalisée sous 24h.\n\nRéférence de votre demande : {{3}}',
                example: {
                    body_text: [
                        'Jean',
                        'Rénovation complète salle de bain',
                        'DEV-2024-001'
                    ]
                }
            },
            {
                type: 'FOOTER',
                text: 'Pour toute question, n\'hésitez pas à nous contacter.'
            }
        ]
    },

    quote_ready: {
        name: 'quote_ready',
        language: 'fr',
        category: 'UTILITY',
        components: [
            {
                type: 'HEADER',
                format: 'TEXT',
                text: 'Votre devis est prêt !',
                example: {
                    header_text: ['Votre devis est prêt !']
                }
            },
            {
                type: 'BODY',
                text: 'Bonjour {{1}},\n\nVotre devis pour {{2}} est maintenant disponible !\n\nMontant total : {{3}}€\n\nVous pouvez consulter et accepter votre devis en cliquant sur le bouton ci-dessous.',
                example: {
                    body_text: [
                        'Marie',
                        'Installation climatisation',
                        '2500'
                    ]
                }
            },
            {
                type: 'BUTTONS',
                text: 'Voir le devis'
            }
        ]
    },

    booking_confirmation: {
        name: 'booking_confirmation',
        language: 'fr',
        category: 'UTILITY',
        components: [
            {
                type: 'HEADER',
                format: 'TEXT',
                text: 'Confirmation de réservation',
                example: {
                    header_text: ['Confirmation de réservation']
                }
            },
            {
                type: 'BODY',
                text: 'Bonjour {{1}},\n\nVotre réservation est confirmée !\n\nService : {{2}}\nDate : {{3}}\nHeure : {{4}}\nAdresse : {{5}}\n\nVotre professionnel vous contactera la veille de l\'intervention.',
                example: {
                    body_text: [
                        'Pierre',
                        'Dépannage plomberie',
                        '15/03/2024',
                        '14:00',
                        '123 rue de Paris, 75001 Paris'
                    ]
                }
            },
            {
                type: 'FOOTER',
                text: 'Vous pouvez modifier ou annuler votre réservation jusqu\'à 24h avant.'
            }
        ]
    },

    appointment_reminder: {
        name: 'appointment_reminder',
        language: 'fr',
        category: 'UTILITY',
        components: [
            {
                type: 'HEADER',
                format: 'TEXT',
                text: 'Rappel de rendez-vous',
                example: {
                    header_text: ['Rappel de rendez-vous']
                }
            },
            {
                type: 'BODY',
                text: 'Bonjour {{1}},\n\nRappel : vous avez rendez-vous demain à {{2}} pour {{3}}.\n\nAdresse : {{4}}\n\nPour toute modification, merci de nous contacter au plus tôt.',
                example: {
                    body_text: [
                        'Sophie',
                        '10:00',
                        'Entretien chaudière',
                        '45 avenue des Fleurs, 69000 Lyon'
                    ]
                }
            }
        ]
    },

    payment_confirmation: {
        name: 'payment_confirmation',
        language: 'fr',
        category: 'UTILITY',
        components: [
            {
                type: 'HEADER',
                format: 'TEXT',
                text: 'Confirmation de paiement',
                example: {
                    header_text: ['Confirmation de paiement']
                }
            },
            {
                type: 'BODY',
                text: 'Bonjour {{1}},\n\nNous confirmons la réception de votre paiement de {{2}}€ pour {{3}}.\n\nNuméro de transaction : {{4}}\n\nVotre facture est disponible dans votre espace client.',
                example: {
                    body_text: [
                        'Thomas',
                        '150',
                        'Diagnostic électrique',
                        'TRX-2024-001'
                    ]
                }
            }
        ]
    },

    service_feedback: {
        name: 'service_feedback',
        language: 'fr',
        category: 'UTILITY',
        components: [
            {
                type: 'HEADER',
                format: 'TEXT',
                text: 'Votre avis nous intéresse',
                example: {
                    header_text: ['Votre avis nous intéresse']
                }
            },
            {
                type: 'BODY',
                text: 'Bonjour {{1}},\n\nNous espérons que vous êtes satisfait(e) de l\'intervention réalisée par notre professionnel pour {{2}}.\n\nPouvez-vous prendre quelques minutes pour noter votre expérience ? Cela nous aide à améliorer nos services.',
                example: {
                    body_text: [
                        'Julie',
                        'Installation VMC'
                    ]
                }
            },
            {
                type: 'BUTTONS',
                text: 'Donner mon avis'
            }
        ]
    },

    cancellation_confirmation: {
        name: 'cancellation_confirmation',
        language: 'fr',
        category: 'UTILITY',
        components: [
            {
                type: 'HEADER',
                format: 'TEXT',
                text: 'Confirmation d\'annulation',
                example: {
                    header_text: ['Confirmation d\'annulation']
                }
            },
            {
                type: 'BODY',
                text: 'Bonjour {{1}},\n\nNous confirmons l\'annulation de votre rendez-vous du {{2}} pour {{3}}.\n\n{{4}}\n\nVous pouvez reprogrammer un nouveau rendez-vous à tout moment via notre plateforme.',
                example: {
                    body_text: [
                        'Michel',
                        '20/03/2024',
                        'Réparation fuite',
                        'Remboursement effectué sous 5 jours ouvrés'
                    ]
                }
            }
        ]
    }
};

export function getTemplate(templateName: keyof typeof WHATSAPP_TEMPLATES, params: string[]): WhatsAppTemplate {
    const template = WHATSAPP_TEMPLATES[templateName];
    if (!template) {
        throw new Error(`Template "${templateName}" not found`);
    }

    return {
        name: template.name,
        language: {
            code: template.language
        },
        components: template.components.map(component => ({
            type: component.type.toLowerCase(),
            parameters: component.text ? [{
                type: 'text',
                text: component.text
            }] : []
        }))
    };
} 