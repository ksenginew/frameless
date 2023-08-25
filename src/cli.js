import minimist from "minimist";
// import glob from "glob";
import fs from "fs/promises";
import polka from "polka";
import sirv from "sirv";
import path from "path";
import { createRuntime } from "./run.js";
import { WebSocket, WebSocketServer } from "ws";
import posix from "path/posix";

const client_code = `
const socket = new WebSocket("ws://localhost:3001");
socket.addEventListener("open", (event) => {
});

socket.addEventListener("message", (event) => {
  try{
    let json = JSON.parse(event.data)
    if(json.t == 0) location.reload();
  } catch {}
});
`;

/** @param {string} file */
async function dev(file) {
  try {
    const watcher = fs.watch(file);
    for await (const event of watcher)
      if (event.eventType == "change")
        clients.forEach((ws) => ws.send(JSON.stringify({ t: 0 })));
  } catch (err) {
    throw err;
  }
}

const RE =
  /<!--[^]*?-->|<[!?][^]*?>|<script(\s[^]*?)?>([^]*?)<\/script>|<style(\s[^]*?)?>([^]*?)<\/style>/g;
/**
 * @param {string} src
 * @param {string} id
 */
function compiler(src, id) {
  let js = "";
  let style = "";
  let setup = ""
  src = src.replace(RE, (_, attr, code, sattr, css) => {
    if (css) style += css;
    if (attr && attr.indexOf("setup") !== -1) {
      setup += code+';'
      return "";
    }
    if (css || (attr && attr.indexOf("client") !== -1)) return "";
    if (code) js += code+';';
    return "";
  });
  /** @type Record<string,string> */
  let stylemap = {};
  style = style
    .replace(/\/\*[^]*?\*\/|  +/g, "")
    .replace(/([^;}{]*?) *{/g, (selectors) => {
      return selectors
        .trim()
        .replace(/\n+/g, " ")
        .replace(/\.([\u0080-\uFFFF\w-%@]+)/g, (_, k) => {
          if (stylemap[k]) return "." + stylemap[k];
          let id = "_" + Math.random().toString(36).slice(2);
          stylemap[k] = id;
          return "." + id;
        });
    });
  return `import {create_ssr_component as $$csc, html} from 'frameless';` +
    `const {atob,btoa,Blob,File,Headers,Request,Response,fetch,FormData,ReadableStream,WritableStream,AbortController}=require("module").createRequire(__filename)("@remix-run/node");` +
    `${setup}const App = $$csc(async function($){$.results.css.add(${JSON.stringify(
      style,
    )});$.style=${JSON.stringify(
      stylemap,
    )};${js}return <>${src}</>});export default App;`;
}

const runtime = createRuntime(compiler);

const doc = ``;
const argv = minimist(process.argv.slice(2));
let root = argv._[0] || ".";
root = path.resolve(process.cwd(), root);

polka()
  .use(async (req, res, next) => {
    const filePath = posix.normalize(req.path);
    try {
      const start = Date.now();
      let index = path.resolve(root, "." + filePath);
      if ((await fs.stat(index)).isDirectory())
        index = path.resolve(index, "index.html");
      if (!/\.html?$/.test(index) || !(await fs.stat(index)).isFile())
        return next();
      const fn = runtime(index);
      let result, css;
      try {
        result = await fn.default({
          props: {},
          slots: {},
          results: { html: "", css: new Set() },
          context: {},
        });
        css = result.css;
        result = result.html;
      } catch (e) {
        // @ts-ignore
        result = e.stack || e + "";
        const time = Date.now() - start;
        res.writeHead(500, {
          "Content-Type": "text/html;charset=utf-8",
          "Content-Length": Buffer.byteLength(result, "utf-8"),
          "Server-Timing": `index.html;dur=${time}`,
        });
        res.end("<script>" + client_code + "</script>" + result);
        return;
      }
      result = result.replace(
        /(?<=<head[^]*?>)/,
        "<script>" +
        client_code +
        "</script>" +
        "<style>" +
        [...css].join("") +
        "</style>",
      );
      dev(index);
      const time = Date.now() - start;
      res.writeHead(200, {
        "Content-Type": "text/html;charset=utf-8",
        "Content-Length": Buffer.byteLength(result, "utf-8"),
        "Server-Timing": `index.html;dur=${time}`,
      });
      res.end(result);
    } catch (e) {
      console.log(e);
      next();
    }
  })
  .use(sirv(root, { dev: true }))
  .listen(3000, () => {
    console.info(`> Running on localhost:3000`);
  });
const wss = new WebSocketServer({ port: 3001 });
/** @type {WebSocket[]} */
let clients = [];
wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", function message(data) {
    console.log("received: %s", data);
  });

  clients.push(ws);
});
