'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { 
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArchiveBoxIcon,
  DocumentDuplicateIcon,
  CalendarIcon,
  ArrowPathIcon,
  CloudArrowDownIcon,
  DocumentChartBarIcon,
  CogIcon,
  PlusIcon,
  PencilIcon,
  BeakerIcon,
  StarIcon,
  UserGroupIcon,
  FolderPlusIcon
} from "@heroicons/react/24/outline"

// Types mis à jour avec toutes les nouvelles fonctionnalités
interface Document {
  id: string
  type: string // Maintenant supporte 13 types différents
  title: string
  bookingId: string
  customerName: string
  status: 'generated' | 'sent' | 'viewed' | 'downloaded' | 'archived'
  createdAt: string
  updatedAt: string
  fileSize: number
  downloadCount: number
  lastDownloaded?: string
  templateId?: string
  version?: string
  hasAttachments?: boolean
  metadata?: any
}

interface DocumentVersion {
  id: string
  documentId: string
  versionNumber: string
  status: 'draft' | 'pending_review' | 'under_review' | 'approved' | 'rejected' | 'published' | 'archived'
  createdAt: string
  createdBy: string
  approvalProgress: { completed: number; total: number; percentage: number }
  currentApprover?: string
}

interface Template {
  id: string
  name: string
  documentType: string
  isDefault: boolean
  isActive: boolean
  version: string
  sectionsCount: number
  fieldsCount: number
  createdAt: string
}

interface ApprovalWorkflow {
  id: string
  name: string
  type: 'simple' | 'standard' | 'advanced' | 'custom'
  isActive: boolean
  isDefault: boolean
  priority: number
  stepsCount: number
}

interface DocumentStats {
  total: number
  byType: Record<string, number>
  byStatus: Record<string, number>
  totalSize: number
  errors: number
  generatedToday: number
  // Nouvelles stats
  templatesCount: number
  versionsCount: number
  workflowsCount: number
  pendingApprovals: number
  averageApprovalTime: number
  rejectionRate: number
}

// Types de documents étendus (13 types)
const documentTypeLabels = {
  'QUOTE': 'Devis',
  'INVOICE': 'Facture',
  'CONTRACT': 'Contrat',
  'RECEIPT': 'Reçu',
  'CONFIRMATION': 'Confirmation',
  'DELIVERY_NOTE': 'Bon de livraison',
  'PAYMENT_RECEIPT': 'Reçu de paiement',
  'SERVICE_REPORT': 'Rapport de service',
  'TRANSPORT_MANIFEST': 'Manifeste de transport',
  'INVENTORY_LIST': 'Liste d\'inventaire',
  'INSURANCE_CLAIM': 'Déclaration d\'assurance',
  'CUSTOMS_DECLARATION': 'Déclaration douanière',
  'CERTIFICATE_COMPLETION': 'Certificat d\'achèvement'
}

const statusLabels = {
  generated: 'Généré',
  sent: 'Envoyé', 
  viewed: 'Consulté',
  downloaded: 'Téléchargé',
  archived: 'Archivé'
}

const statusColors = {
  generated: 'bg-blue-100 text-blue-800',
  sent: 'bg-green-100 text-green-800',
  viewed: 'bg-yellow-100 text-yellow-800',
  downloaded: 'bg-purple-100 text-purple-800',
  archived: 'bg-gray-100 text-gray-800'
}

const versionStatusLabels = {
  draft: 'Brouillon',
  pending_review: 'En attente',
  under_review: 'En révision', 
  approved: 'Approuvé',
  rejected: 'Rejeté',
  published: 'Publié',
  archived: 'Archivé'
}

const versionStatusColors = {
  draft: 'bg-gray-100 text-gray-800',
  pending_review: 'bg-orange-100 text-orange-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  published: 'bg-purple-100 text-purple-800',
  archived: 'bg-slate-100 text-slate-800'
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([])
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<string>('')
  const { toast } = useToast()

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      
      // Charger les documents
      await Promise.all([
        loadDocuments(),
        loadVersions(),
        loadTemplates(),
        loadWorkflows(),
        loadStats()
      ])
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/admin/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.success ? data.data.documents : [])
      } else {
        // Fallback avec données mockées plus réalistes
        setDocuments([
          {
            id: '1',
            type: 'QUOTE',
            title: 'Devis déménagement - Martin',
            bookingId: 'BK-2024-001',
            customerName: 'Jean Martin',
            status: 'downloaded',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T11:45:00Z',
            fileSize: 245760,
            downloadCount: 3,
            lastDownloaded: '2024-01-15T11:45:00Z',
            templateId: 'tpl_quote_default',
            version: '1.0.0',
            hasAttachments: true
          },
          {
            id: '2',
            type: 'INVOICE', 
            title: 'Facture ménage - Dupont',
            bookingId: 'BK-2024-002',
            customerName: 'Marie Dupont',
            status: 'sent',
            createdAt: '2024-01-15T09:15:00Z',
            updatedAt: '2024-01-15T09:16:00Z',
            fileSize: 189432,
            downloadCount: 0,
            templateId: 'tpl_invoice_premium',
            version: '2.1.0',
            hasAttachments: false
          }
        ])
      }
    } catch (error) {
      console.error('Erreur documents:', error)
    }
  }

  const loadVersions = async () => {
    try {
      const response = await fetch('/api/admin/documents/versions')
      if (response.ok) {
        const data = await response.json()
        setVersions(data.success ? data.data.versions : [])
      } else {
        // Données mockées pour les versions
        setVersions([
          {
            id: 'v1',
            documentId: '1',
            versionNumber: '1.0.0',
            status: 'published',
            createdAt: '2024-01-15T10:30:00Z',
            createdBy: 'admin',
            approvalProgress: { completed: 2, total: 2, percentage: 100 }
          },
          {
            id: 'v2',
            documentId: '2', 
            versionNumber: '2.1.0',
            status: 'under_review',
            createdAt: '2024-01-15T14:20:00Z',
            createdBy: 'manager',
            approvalProgress: { completed: 1, total: 3, percentage: 33 },
            currentApprover: 'director'
          }
        ])
      }
    } catch (error) {
      console.error('Erreur versions:', error)
    }
  }

  const loadTemplates = async () => {
    // API admin/templates supprimée (2026-02) - données de démo pour affichage
    setTemplates([
      {
        id: 'tpl_quote_default',
        name: 'Template Devis Standard',
        documentType: 'QUOTE',
        isDefault: true,
        isActive: true,
        version: '1.0.0',
        sectionsCount: 4,
        fieldsCount: 12,
        createdAt: '2024-01-10T09:00:00Z'
      },
      {
        id: 'tpl_invoice_premium',
        name: 'Template Facture Premium',
        documentType: 'INVOICE',
        isDefault: false,
        isActive: true,
        version: '2.1.0',
        sectionsCount: 6,
        fieldsCount: 18,
        createdAt: '2024-01-12T14:30:00Z'
      }
    ])
  }

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/admin/documents/workflows')
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.success ? data.data.workflows : [])
      } else {
        setWorkflows([
          {
            id: 'wf_simple',
            name: 'Approbation Simple',
            type: 'simple',
            isActive: true,
            isDefault: true,
            priority: 1,
            stepsCount: 1
          },
          {
            id: 'wf_advanced',
            name: 'Approbation Avancée',
            type: 'advanced',
            isActive: true,
            isDefault: false,
            priority: 3,
            stepsCount: 3
          }
        ])
      }
    } catch (error) {
      console.error('Erreur workflows:', error)
    }
  }

  const loadStats = async () => {
    try {
      // Calculer les stats depuis les données chargées
      const stats = {
        total: documents.length,
        byType: documents.reduce((acc, doc) => {
          acc[doc.type] = (acc[doc.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byStatus: documents.reduce((acc, doc) => {
          acc[doc.status] = (acc[doc.status] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
        errors: 2,
        generatedToday: 8,
        templatesCount: templates.length,
        versionsCount: versions.length,
        workflowsCount: workflows.length,
        pendingApprovals: versions.filter(v => v.status === 'pending_review' || v.status === 'under_review').length,
        averageApprovalTime: 24,
        rejectionRate: 5
      }
      
      setStats(stats)
    } catch (error) {
      console.error('Erreur stats:', error)
    }
  }

  const handleGenerateDocument = async (type: string) => {
    try {
      toast({
        title: "Génération",
        description: "Génération du document en cours...",
        variant: "default"
      })

      const response = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          documentType: type,
          data: {
            // Données d'exemple
            customerName: 'Client Test',
            bookingId: `BK-${Date.now()}`
          }
        })
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Document généré avec succès",
          variant: "default"
        })
        loadAllData()
      } else {
        throw new Error('Erreur lors de la génération')
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le document",
        variant: "destructive"
      })
    }
  }

  const handleCreateTemplate = () => {
    toast({
      title: "Templates admin obsolète",
      description: "L'éditeur de templates a été supprimé. Utilisez la configuration des modules pour le devis.",
      variant: "default"
    })
  }

  const handleCreateWorkflow = () => {
    toast({
      title: "Création de workflow",
      description: "Redirection vers l'éditeur de workflows...",
      variant: "default"
    })
    window.open('/admin/workflows/create', '_blank')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement du système de documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header amélioré */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-8 w-8 text-white" />
              <h1 className="text-3xl font-bold tracking-tight text-white">Système de Gestion Documentaire</h1>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCreateTemplate}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                size="sm"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Template
              </Button>
              <Button 
                onClick={handleCreateWorkflow}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                size="sm"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Workflow
              </Button>
            </div>
          </div>
          <p className="text-green-100">Système complet : 13 types de documents • Templates personnalisables • Workflows d'approbation • Versioning</p>
          
          {/* Statistiques améliorées */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mt-6">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs">Documents</p>
                    <p className="text-xl font-bold text-white">{stats.total}</p>
                  </div>
                  <DocumentDuplicateIcon className="h-6 w-6 text-white/60" />
                </div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs">Templates</p>
                    <p className="text-xl font-bold text-white">{stats.templatesCount}</p>
                  </div>
                  <DocumentChartBarIcon className="h-6 w-6 text-white/60" />
                </div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs">Versions</p>
                    <p className="text-xl font-bold text-white">{stats.versionsCount}</p>
                  </div>
                  <ClockIcon className="h-6 w-6 text-white/60" />
                </div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs">En attente</p>
                    <p className="text-xl font-bold text-white">{stats.pendingApprovals}</p>
                  </div>
                  <ExclamationTriangleIcon className="h-6 w-6 text-white/60" />
                </div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs">Workflows</p>
                    <p className="text-xl font-bold text-white">{stats.workflowsCount}</p>
                  </div>
                  <UserGroupIcon className="h-6 w-6 text-white/60" />
                </div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs">Espace</p>
                    <p className="text-xl font-bold text-white">{formatFileSize(stats.totalSize)}</p>
                  </div>
                  <ArchiveBoxIcon className="h-6 w-6 text-white/60" />
                </div>
              </div>
            </div>
          )}
        </div>

        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <DocumentTextIcon className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="versions" className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              Versions
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <DocumentChartBarIcon className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-2">
              <UserGroupIcon className="h-4 w-4" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Documents - Interface existante améliorée */}
          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5" />
                    Documents générés ({documents.length})
                  </CardTitle>
                  
                  <div className="flex items-center gap-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Type de document" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        {Object.entries(documentTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button onClick={() => handleGenerateDocument('QUOTE')} size="sm">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Générer
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{doc.title}</h3>
                          <Badge className={statusColors[doc.status]}>
                            {statusLabels[doc.status]}
                          </Badge>
                          <Badge variant="outline">
                            {documentTypeLabels[doc.type as keyof typeof documentTypeLabels] || doc.type}
                          </Badge>
                          {doc.version && (
                            <Badge variant="secondary">v{doc.version}</Badge>
                          )}
                          {doc.hasAttachments && (
                            <Badge variant="outline" className="text-blue-600">
                              📎 Pièces jointes
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Client: {doc.customerName}</span>
                          <span>Réservation: {doc.bookingId}</span>
                          <span>Créé: {formatDate(doc.createdAt)}</span>
                          <span>Taille: {formatFileSize(doc.fileSize)}</span>
                          {doc.downloadCount > 0 && (
                            <span>Téléchargé: {doc.downloadCount}x</span>
                          )}
                          {doc.templateId && (
                            <span>Template: {doc.templateId}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nouvelles sections pour les versions */}
          <TabsContent value="versions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  Gestion des versions ({versions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {versions.map((version) => (
                    <div key={version.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">Version {version.versionNumber}</h3>
                          <Badge className={versionStatusColors[version.status]}>
                            {versionStatusLabels[version.status]}
                          </Badge>
                          <Badge variant="outline">
                            Progression: {version.approvalProgress.percentage}%
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Créé par: {version.createdBy}</span>
                          <span>Date: {formatDate(version.createdAt)}</span>
                          {version.currentApprover && (
                            <span>En attente: {version.currentApprover}</span>
                          )}
                          <span>Étapes: {version.approvalProgress.completed}/{version.approvalProgress.total}</span>
                        </div>
                        
                        {/* Barre de progression */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${version.approvalProgress.percentage}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        {version.status === 'pending_review' && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircleIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates */}
          <TabsContent value="templates" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <DocumentChartBarIcon className="h-5 w-5" />
                    Templates personnalisables ({templates.length})
                  </CardTitle>
                  <Button onClick={handleCreateTemplate} size="sm">
                    <FolderPlusIcon className="h-4 w-4 mr-2" />
                    Créer un template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{template.name}</h3>
                          <p className="text-sm text-gray-600">{documentTypeLabels[template.documentType as keyof typeof documentTypeLabels]}</p>
                        </div>
                        <div className="flex gap-1">
                          {template.isDefault && (
                            <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                              <StarIcon className="h-3 w-3 mr-1" />
                              Défaut
                            </Badge>
                          )}
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Version: {template.version}</div>
                        <div>{template.sectionsCount} sections • {template.fieldsCount} champs</div>
                        <div>Créé: {formatDate(template.createdAt)}</div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="flex-1">
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button size="sm" variant="outline">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflows */}
          <TabsContent value="workflows" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <UserGroupIcon className="h-5 w-5" />
                    Workflows d'approbation ({workflows.length})
                  </CardTitle>
                  <Button onClick={handleCreateWorkflow} size="sm">
                    <CogIcon className="h-4 w-4 mr-2" />
                    Créer un workflow
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{workflow.name}</h3>
                          <Badge variant="outline" className="capitalize">{workflow.type}</Badge>
                          {workflow.isDefault && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <StarIcon className="h-3 w-3 mr-1" />
                              Défaut
                            </Badge>
                          )}
                          <Badge variant={workflow.isActive ? "default" : "secondary"}>
                            {workflow.isActive ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{workflow.stepsCount} étapes d'approbation</span>
                          <span>Priorité: {workflow.priority}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <BeakerIcon className="h-4 w-4" />
                          Tester
                        </Button>
                        <Button size="sm" variant="outline">
                          <PencilIcon className="h-4 w-4" />
                          Modifier
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics - Statistiques améliorées */}
          <TabsContent value="statistics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Statistiques existantes + nouvelles */}
              <Card>
                <CardHeader>
                  <CardTitle>Types de documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats && Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {documentTypeLabels[type as keyof typeof documentTypeLabels] || type}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(count / stats.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-8">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance d'approbation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Temps moyen</span>
                      <span className="font-bold">{stats?.averageApprovalTime}h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Taux de rejet</span>
                      <span className="font-bold text-red-600">{stats?.rejectionRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>En attente</span>
                      <span className="font-bold text-orange-600">{stats?.pendingApprovals}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Système</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Templates actifs</span>
                      <span className="font-bold">{templates.filter(t => t.isActive).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Workflows actifs</span>
                      <span className="font-bold">{workflows.filter(w => w.isActive).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Espace total</span>
                      <span className="font-bold">{formatFileSize(stats?.totalSize || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}