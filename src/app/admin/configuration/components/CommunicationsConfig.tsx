"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
  EnvelopeIcon,
  ChatBubbleLeftEllipsisIcon,
  UserGroupIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline"
import { EmailConfig } from "./EmailConfig"
import { WhatsAppConfig } from "./WhatsAppConfig"
import { RecipientsConfig, RecipientsConfigData } from "./RecipientsConfig"
import { motion, AnimatePresence } from "framer-motion"
import { SectionHeader } from "./SectionHeader"

const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2 }
}

const tabConfig = {
  email: {
    icon: EnvelopeIcon,
    color: "blue" as const,
    label: "Email",
    title: "Configuration des emails",
    description: "Gérez les paramètres d'envoi des emails automatiques"
  },
  whatsapp: {
    icon: ChatBubbleLeftEllipsisIcon,
    color: "green" as const,
    label: "WhatsApp",
    title: "Configuration WhatsApp",
    description: "Gérez vos communications instantanées via WhatsApp"
  },
  recipients: {
    icon: UserGroupIcon,
    color: "purple" as const,
    label: "Destinataires",
    title: "Gestion des destinataires",
    description: "Configurez les destinataires et leurs canaux de communication"
  }
}

export function CommunicationsConfig() {
  const [activeTab, setActiveTab] = useState('email')
  const [recipientsConfig, setRecipientsConfig] = useState<RecipientsConfigData>({
    internalTeams: {
      salesTeam: {
        emails: [],
        phones: [],
        config: {
          enabled: true,
          messageTypes: ['quote_request', 'booking', 'payment', 'cancellation'],
          channels: ['email']
        }
      },
      accounting: {
        emails: [],
        phones: [],
        config: {
          enabled: true,
          messageTypes: ['payment', 'cancellation'],
          channels: ['email']
        }
      },
      professionals: {
        emails: [],
        phones: [],
        config: {
          enabled: true,
          messageTypes: ['booking', 'cancellation'],
          channels: ['email']
        }
      },
      notifications: {
        emails: [],
        phones: [],
        config: {
          enabled: true,
          messageTypes: ['quote_request', 'booking', 'payment', 'cancellation', 'reminder'],
          channels: ['email']
        }
      },
      operations: {
        emails: [],
        phones: [],
        config: {
          enabled: true,
          messageTypes: ['quote_request', 'booking', 'cancellation', 'reminder'],
          channels: ['email', 'whatsapp']
        }
      }
    },
    externalProviders: [],
    professionals: [],
    clientConfig: {
      enabled: true,
      messageTypes: ['quote_request', 'booking', 'payment', 'reminder'],
      channels: ['email']
    }
  });

  const handleRecipientsChange = (newConfig: RecipientsConfigData) => {
    setRecipientsConfig(newConfig);
  };

  const getMainTabStyles = (value: string) => {
    const baseStyles = "relative flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-300 justify-center rounded-xl hover:bg-white/80 group"
    const activeStyles = {
      'email': 'data-[state=active]:bg-white data-[state=active]:text-blue-600',
      'whatsapp': 'data-[state=active]:bg-white data-[state=active]:text-green-600',
      'recipients': 'data-[state=active]:bg-white data-[state=active]:text-purple-600'
    }
    return `${baseStyles} ${activeStyles[value as keyof typeof activeStyles]}`
  }

  const getMainIconStyles = (value: string) => {
    const styles = {
      'email': 'text-blue-600/80 group-hover:text-blue-600 group-data-[state=active]:text-blue-600',
      'whatsapp': 'text-green-600/80 group-hover:text-green-600 group-data-[state=active]:text-green-600',
      'recipients': 'text-purple-600/80 group-hover:text-purple-600 group-data-[state=active]:text-purple-600'
    }
    return `h-5 w-5 transition-colors duration-300 ${styles[value as keyof typeof styles]}`
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <Card className="relative w-full border-0 bg-gradient-to-br from-gray-50 via-white to-gray-50/50 backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,transparent,black)] pointer-events-none" />
        
        <CardContent className="relative p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="bg-blue-50/50 p-2.5 rounded-xl shadow-sm">
                  <Cog6ToothIcon className="h-6 w-6 text-blue-600/90" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Paramètres de communication</h2>
                  <p className="text-sm text-gray-500 mt-1">Configuration des notifications et documents automatiques</p>
                </div>
              </div>

              <TabsList className="flex gap-1.5 bg-gray-100/80 p-1 rounded-lg shadow-sm">
                {Object.entries(tabConfig).map(([key, config]) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <config.icon className={`h-4 w-4 ${key === 'email' ? 'text-blue-500' : key === 'whatsapp' ? 'text-green-500' : 'text-purple-500'}`} />
                    <span>{config.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                className="relative bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden"
                {...fadeInUp}
              >
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,transparent,black)] opacity-30 pointer-events-none" />
                
                <TabsContent value="email" className="m-0">
                  <div className="relative p-8">
                    <EmailConfig recipientsConfig={recipientsConfig} />
                  </div>
                </TabsContent>

                <TabsContent value="whatsapp" className="m-0">
                  <div className="relative p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-green-50 p-2 rounded-lg">
                        <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{tabConfig.whatsapp.title}</h3>
                        <p className="text-sm text-gray-500">{tabConfig.whatsapp.description}</p>
                      </div>
                    </div>
                    <WhatsAppConfig recipientsConfig={recipientsConfig} />
                  </div>
                </TabsContent>

                <TabsContent value="recipients" className="m-0">
                  <div className="relative p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-purple-50 p-2 rounded-lg">
                        <UserGroupIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{tabConfig.recipients.title}</h3>
                        <p className="text-sm text-gray-500">{tabConfig.recipients.description}</p>
                      </div>
                    </div>
                    <RecipientsConfig
                      config={recipientsConfig}
                      onConfigChange={handleRecipientsChange}
                    />
                  </div>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 