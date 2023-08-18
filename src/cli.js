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
      if (event.eventType == 'change')
        clients.forEach((ws) => ws.send(JSON.stringify({ t: 0 })));
  } catch (err) {
    throw err;
  }
}


let argv = minimist(process.argv.slice(2));
let root = process.cwd();
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
      const fn = runtime(index)
      let result;
      try {
        result = fn.default({ props: {}, slots: {} })
      } catch (e) {
        result = e.stack || (e + '')
        const time = Date.now() - start;
        res.writeHead(500, {
          "Content-Type": "text/html;charset=utf-8",
          "Content-Length": Buffer.byteLength(result, "utf-8"),
          "Server-Timing": `index.html;dur=${time}`,
        });
        res.end("<script>" + client_code + "</script>" + result);
        return
      }
      result = result.replace(/(?=<head>)/, "<script>" + client_code + "</script>")
      dev(index)
      const time = Date.now() - start;
      res.writeHead(200, {
        "Content-Type": "text/html;charset=utf-8",
        "Content-Length": Buffer.byteLength(result, "utf-8"),
        "Server-Timing": `index.html;dur=${time}`,
      });
      res.end(result);
    } catch (e) {
      console.log(e)
      next();
    }
  })
  .use(sirv())
  .listen(3000, () => {
    console.info(`> Running on localhost:3000`);
  });

const RE = /<!--[^]*?-->|<[!?][^]*?>|<script(\s[^]*?)?>([^]*?)<\/script>|<style(\s[^]*?)?>([^]*?)<\/style>/g
/**
 * @param {string} src
 * @param {string} id
 */
function compiler(src, id) {
  let js = ''
  src = src.replace(RE, (_, attr, code, sattr, css) => {
    if (css || (attr && attr.indexOf("client") !== -1)) return ""
    if (code)
      js += code;
    return ''
  }).replace(/<slot\s*\/>/g, "{$.slot}")
  return `import {create_ssr_component as $$csc} from 'frameless';const App = $$csc($=>{${js};return <>${src}</>});export default App;`
}
let runtime = createRuntime(compiler);

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
