import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(),
  (() => {
    let vite;
    return {
      name: 'ssr',
      resolveId(id,importter,{isEntry}){
        // if(isEntry)
          console.log(id)
      },
      transform(id,ctx){
        console.log(ctx)
      },
      load(id,{ssr}){
        console.log(id)
        if(id.endsWith(".html")) console.log(id)
      },
      configureServer(server) {
        vite = server
        // server.middlewares.use(async (req, res, next) => {
        //   const url = req.originalUrl
        //   console.log(req.url, url)
        //   const { render } = await server.ssrLoadModule('/src/entry-server.js')
        //   res.writeHead(200, undefined, { 'Content-Type': 'text/html' }).end(render())
        // })
      }
    }
  })()
  ],
  build: {
    minify: false,
  },
})
