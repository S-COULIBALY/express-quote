/**
 * 📊 BULL DASHBOARD - Interface graphique pour visualiser les queues
 * 
 * Endpoint qui expose une interface web pour monitorer et gérer
 * les queues BullMQ en temps réel
 */

import { NextRequest, NextResponse } from 'next/server';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { ProductionQueueManager } from '../../../../notifications/infrastructure/queue/queue.manager.production';

let queueManager: ProductionQueueManager | null = null;
let serverAdapter: ExpressAdapter | null = null;

/**
 * Initialiser le dashboard BullMQ
 */
async function initializeDashboard(): Promise<ExpressAdapter> {
  if (serverAdapter) {
    return serverAdapter;
  }

  try {
    // Créer le gestionnaire de queues
    queueManager = new ProductionQueueManager();
    await queueManager.initialize();

    // Créer l'adaptateur Express pour Bull Board
    serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/api/admin/queue-dashboard');

    // Obtenir les queues et créer les adaptateurs BullMQ
    const queueAdapters = [];
    
    for (const queueName of ['email', 'sms', 'whatsapp', 'reminders']) {
      try {
        const queue = queueManager.getQueue(queueName);
        const adapter = new BullMQAdapter(queue);
        queueAdapters.push(adapter);
      } catch (error) {
        console.warn(`Failed to create adapter for queue '${queueName}':`, error);
      }
    }

    // Créer le dashboard
    createBullBoard({
      queues: queueAdapters,
      serverAdapter: serverAdapter,
    });

    console.log('✅ Bull Dashboard initialized at /api/admin/queue-dashboard');
    return serverAdapter;

  } catch (error) {
    console.error('❌ Failed to initialize Bull Dashboard:', error);
    throw error;
  }
}

/**
 * GET - Servir le dashboard BullMQ
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const adapter = await initializeDashboard();
    const { pathname } = new URL(request.url);
    
    // Extraire le chemin après /api/admin/queue-dashboard
    const dashboardPath = pathname.replace('/api/admin/queue-dashboard', '') || '/';
    
    // Créer une requête simulée pour Express
    const mockReq = {
      method: 'GET',
      url: dashboardPath,
      headers: Object.fromEntries(request.headers.entries()),
      query: Object.fromEntries(new URL(request.url).searchParams.entries())
    } as any;

    const mockRes = {
      status: (code: number) => mockRes,
      send: (content: string) => content,
      setHeader: (name: string, value: string) => mockRes,
      redirect: (url: string) => NextResponse.redirect(url),
      locals: {}
    } as any;

    // Si c'est la page principale du dashboard
    if (dashboardPath === '/' || dashboardPath === '') {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Express Quote - Queue Dashboard</title>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      background: #f5f5f5;
    }
    .header {
      background: #3B82F6;
      color: white;
      padding: 1rem;
      text-align: center;
    }
    .container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .queue-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1rem 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .status {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 500;
    }
    .healthy { background: #dcfce7; color: #166534; }
    .failed { background: #fef2f2; color: #dc2626; }
    .waiting { background: #fef3c7; color: #d97706; }
    .btn {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: #3B82F6;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 0.5rem 0.5rem 0.5rem 0;
    }
    .btn:hover { background: #2563EB; }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }
    .metric {
      text-align: center;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 4px;
    }
    .metric-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1e40af;
    }
    .metric-label {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Express Quote - Queue Dashboard</h1>
    <p>Monitoring des queues BullMQ en temps réel</p>
  </div>
  
  <div class="container">
    <div id="dashboard">
      <p>📊 Chargement du dashboard...</p>
    </div>
  </div>

  <script>
    async function loadDashboard() {
      try {
        const response = await fetch('/api/notifications?health');
        const data = await response.json();
        
        if (data.success && data.health.details.queue) {
          const queues = data.health.details.queue.queues;
          const container = document.getElementById('dashboard');
          
          container.innerHTML = Object.entries(queues).map(([name, queue]) => \`
            <div class="queue-card">
              <h2>📧 Queue: \${name.toUpperCase()}</h2>
              
              <div class="metrics">
                <div class="metric">
                  <div class="metric-value">\${queue.counts.completed}</div>
                  <div class="metric-label">Completed</div>
                </div>
                <div class="metric">
                  <div class="metric-value">\${queue.counts.waiting}</div>
                  <div class="metric-label">Waiting</div>
                </div>
                <div class="metric">
                  <div class="metric-value">\${queue.counts.active}</div>
                  <div class="metric-label">Active</div>
                </div>
                <div class="metric">
                  <div class="metric-value">\${queue.counts.failed}</div>
                  <div class="metric-label">Failed</div>
                </div>
                <div class="metric">
                  <div class="metric-value">\${queue.counts.delayed}</div>
                  <div class="metric-label">Delayed</div>
                </div>
              </div>
              
              <div style="margin-top: 1rem;">
                \${queue.counts.failed > 0 ? 
                  \`<a href="/api/notifications?clean=\${name}" class="btn" onclick="return confirm('Nettoyer \${queue.counts.failed} jobs échoués ?')">🧹 Clean Failed Jobs</a>\` : 
                  ''
                }
                <a href="/api/notifications?health" class="btn">🔄 Refresh</a>
              </div>
              
              \${queue.jobs.failed.length > 0 ? \`
                <details style="margin-top: 1rem;">
                  <summary>❌ Failed Jobs (\${queue.jobs.failed.length})</summary>
                  <pre style="background: #fef2f2; padding: 1rem; border-radius: 4px; overflow: auto; max-height: 300px;">\${JSON.stringify(queue.jobs.failed, null, 2)}</pre>
                </details>
              \` : ''}
            </div>
          \`).join('');
        } else {
          container.innerHTML = '<div class="queue-card">❌ Erreur de connexion au système de queues</div>';
        }
      } catch (error) {
        console.error('Dashboard error:', error);
        document.getElementById('dashboard').innerHTML = \`
          <div class="queue-card">
            <h2>❌ Erreur</h2>
            <p>Impossible de charger le dashboard: \${error.message}</p>
            <a href="/api/notifications?health" class="btn">🔄 Retry</a>
          </div>
        \`;
      }
    }
    
    // Charger le dashboard
    loadDashboard();
    
    // Auto-refresh toutes les 10 secondes
    setInterval(loadDashboard, 10000);
  </script>
</body>
</html>`;
      
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Autres assets du dashboard (CSS, JS, etc.)
    return NextResponse.json({
      success: false,
      error: 'Bull Dashboard route not fully implemented',
      hint: 'Use the simple dashboard above or install bull-board properly'
    }, { status: 404 });

  } catch (error) {
    console.error('Queue dashboard error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Dashboard initialization failed',
      message: (error as Error).message,
      fallback: {
        api: 'GET /api/notifications?health',
        clean: 'GET /api/notifications?clean=sms'
      }
    }, { status: 500 });
  }
}