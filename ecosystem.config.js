/**
 * PM2 Ecosystem — express-quote workers BullMQ
 *
 * Les workers BullMQ (email, SMS, WhatsApp, reminders) ne peuvent pas tourner
 * sur Vercel (fonctions serverless stateless). Ce fichier les maintient actifs
 * sur le VPS via PM2.
 *
 * Démarrage : pm2 start ecosystem.config.js
 * Reload sans downtime : pm2 reload express-quote-workers
 * Logs : pm2 logs express-quote-workers
 */

module.exports = {
  apps: [
    {
      name: 'express-quote-workers',

      // ts-node + tsconfig-paths pour résoudre les alias @/*
      script: './scripts/démarrer-workers.ts',
      interpreter: 'node',
      interpreter_args: [
        '--require', 'ts-node/register',
        '--require', 'tsconfig-paths/register',
      ].join(' '),

      cwd: '/root/projects/express-quote',

      env: {
        NODE_ENV: 'production',
        // tsconfig sans les plugins Next.js
        TS_NODE_PROJECT: './tsconfig.worker.json',
        // Ne pas vérifier les types à l'exécution (gain de démarrage)
        TS_NODE_TRANSPILE_ONLY: 'true',
      },

      // Un seul processus worker suffit — BullMQ gère la concurrence en interne
      instances: 1,
      exec_mode: 'fork',

      // Redémarrage automatique en cas de crash
      autorestart: true,
      watch: false,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',

      // Mémoire max avant redémarrage forcé
      max_memory_restart: '512M',

      // Logs
      error_file: '/root/.openclaw/logs/workers-error.log',
      out_file: '/root/.openclaw/logs/workers-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
