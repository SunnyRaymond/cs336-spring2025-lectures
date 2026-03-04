import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function serveRepoStatic(prefix, dirName) {
  const baseDir = path.resolve(__dirname, '..', dirName);
  const normalizedPrefix = `${prefix}/`;

  return {
    name: `serve-${dirName}-from-repo-root`,
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const reqUrl = req.url || '';
        if (!reqUrl.startsWith(normalizedPrefix)) {
          next();
          return;
        }

        const pathname = reqUrl.split('?')[0];
        const rel = pathname.slice(normalizedPrefix.length);
        const resolved = path.resolve(baseDir, rel);

        // Prevent path traversal outside of the intended base directory.
        if (!resolved.startsWith(baseDir)) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }

        try {
          if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
            next();
            return;
          }
          fs.createReadStream(resolved).pipe(res);
        } catch {
          next();
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/spring2025-lectures/' : '/',
  plugins: [
    react(),
    serveRepoStatic('/var', 'var'),
    serveRepoStatic('/images', 'images'),
  ],
})
