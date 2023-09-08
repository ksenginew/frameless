import { transform as sucrase } from "sucrase"

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

/**
* @returns {import("vite").PluginOption}
 */
export function frameless_plugin() {
    /**
       * @type {import("vite").ViteDevServer}
       */
    let vite;

    return {
        name: 'frameless',
        transformIndexHtml: {
            order: 'pre',
            async transform(html, ctx) {
                let render = await vite.ssrLoadModule(ctx.filename)
                return (await render.default({
                    props: {},
                    slots: {},
                    results: { html: "", css: new Set() },
                    context: {},
                })).html
            }
        },
        async transform(code, id) {
            if (id.endsWith('.html')) {
                const { server, template, style, client, setup } = compiler(code)

                let tt = `import {create_ssr_component as $$csc, html} from 'frameless';` +
                    setup + `export default $$csc(` +
                    `async function($){` +
                    `$.results.css.add(${JSON.stringify(style,)});` +
                    `$.style=${JSON.stringify({},)};` +
                    server + `return <>${template}</>});`
                let _code = sucrase(tt, {
                    filePath: id,
                    transforms: ["jsx", "typescript"],
                    preserveDynamicImport: true,
                    jsxRuntime: "automatic",
                    jsxImportSource: "frameless",
                });
                console.log((await vite.ssrTransform(_code.code, null, "./sss"))?.code)

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
}