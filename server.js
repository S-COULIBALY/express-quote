/**
 * 🔒 Serveur HTTPS pour Next.js en développement
 * Active HTTPS pour éliminer le warning de production
 */

const { createServer: createHttpsServer } = require('https');
const { createServer: createHttpServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Configuration HTTPS
const httpsOptions = {
  key: fs.existsSync('./certificates/localhost.key') ? fs.readFileSync('./certificates/localhost.key') : null,
  cert: fs.existsSync('./certificates/localhost.crt') ? fs.readFileSync('./certificates/localhost.crt') : null,
};

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = httpsOptions.key && httpsOptions.cert
    ? createHttpsServer(httpsOptions, async (req, res) => {
        try {
          const parsedUrl = parse(req.url, true);
          await handle(req, res, parsedUrl);
        } catch (err) {
          console.error('Error occurred handling', req.url, err);
          res.statusCode = 500;
          res.end('internal server error');
        }
      })
    : createHttpServer(async (req, res) => {
        try {
          const parsedUrl = parse(req.url, true);
          await handle(req, res, parsedUrl);
        } catch (err) {
          console.error('Error occurred handling', req.url, err);
          res.statusCode = 500;
          res.end('internal server error');
        }
      });

  server.listen(port, (err) => {
    if (err) throw err;
    const protocol = httpsOptions.key && httpsOptions.cert ? 'https' : 'http';
    console.log(`🚀 Ready on ${protocol}://${hostname}:${port}`);

    if (protocol === 'https') {
      console.log('✅ HTTPS activé - Certificats SSL chargés');
    } else {
      console.log('⚠️  HTTP utilisé - Certificats SSL non trouvés');
    }
  });
});