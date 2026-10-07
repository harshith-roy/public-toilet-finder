import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

function devAiPlugin(): Plugin {
  return {
    name: 'dev-ai-plugin',
    configureServer(server) {
      server.middlewares.use('/api/ai', async (req, res) => {
        try {
          const mod = await server.ssrLoadModule('/api/ai.ts')
          await mod.default(req, res)
        } catch (err: any) {
          console.error('Error handling dev /api/ai:', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message || 'Internal dev server error' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devAiPlugin()],
})


