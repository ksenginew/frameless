import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import {transform as sucrase} from "sucrase"

const RE =
  /<!--[^]*?-->|<[!?][^]*?>|<script(\s[^]*?)?>([^]*?)<\/script>|<style(\s[^]*?)?>([^]*?)<\/style>/g;
/**
 * @param {string} template
 */
function compiler(template) {
  let server = "";
  let style = "";
  let setup = ""
  let client = ""
  template = template.replace(RE, (_, attr, code, sattr, css) => {
    if (css) style += css;
    if (code) {
      if (attr) {
        if (attr.indexOf("client") !== -1)
          client += code + ';'
        if (attr.indexOf("setup") !== -1)
          setup += code + ';'
      }
      else server += code + ';'
    }
    return ''
  });
  return { server, template, style, client, setup }
}

export default defineConfig({
  plugins: [  react(),

    (() => {
      /**
       * @type {import("vite").ViteDevServer}
       */
      let vite;
      return {
        name: 'ssr',
        resolveId(id, importter, { isEntry }) {
          // if(isEntry)
        },
        transformIndexHtml: {
          order: 'pre',
          async transform(html, ctx) {
            let { render } = await vite.ssrLoadModule(ctx.filename)
            return JSON.stringify(await render())
          }
        },
        async transform(code, id) {
          if (id.endsWith('.html')) {
            const { server, template, style, client, setup } = compiler(code)
            
            let tt = `const React = {createElement:(...args)=>args,Fragment:null};`
            +setup + `export async function render(){` +
              `return <>` + template + `</>}`;
              let _code = sucrase(tt, {
                filePath:id,
                transforms:["jsx", "typescript"],
                preserveDynamicImport: true
              });
              // console.log((await vite.ssrTransform(tt, null, "./sss"))?.code)
              
              return _code.code
          }
        },
        load(id, { ssr } = {}) {
          if (id.endsWith(".html")) console.log(id)
        },
        configureServer(server) {
          vite = server
          // server.middlewares.use(async (req, res, next) => {
          //   const url = req.originalUrl
          //   console.log(req.url, url)
          //   console.log((await server.ssrTransform(`import React from 'react'`, null, '/src/entry-server.js'))?.code)
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
  esbuild:{
    jsx:'transform',
    jsxDev:true,
    jsxFactory:'h',
    jsxFragment:'null'
  }
})
