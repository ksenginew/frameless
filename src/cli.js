import minimist from "minimist";
// import glob from "glob";
import { existsSync, mkdirSync, watch, writeFileSync } from "fs";
import fs from "fs/promises";
import polka from "polka";
import sirv from "sirv";
import { dirname, normalize, resolve, sep, relative } from "path";
import { createRuntime } from "./run.js";
import { WebSocket, WebSocketServer } from "ws";
import { parse } from "./parser.js";
import { stringify } from "./ssr.js";
import posix from "path/posix";
import { transform as sucrase } from "sucrase";

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
/**
 * @param {string} filePath
 */
function ensureDir(filePath) {
  var dir = dirname(filePath);
  if (existsSync(dir)) {
    return true;
  }
  ensureDir(dir);
  mkdirSync(dir);
}

/**
 * @param {string} file
 */
function build(file) {
  try {
    let output = resolve(argv.o || argv.output, file);
    ensureDir(output);
    writeFileSync(output, runtime(file).default(), {});
    console.info(`Successfully built "${file}"`);
  } catch (error) {
    console.info(`Faild to build "${file}"\n`, error);
  }
}

/**
 * @param {string} file
 */
function dev(file) {
  let fsWait = false;
  watch(file, (event, filename) => {
    if (filename) {
      if (fsWait) return;
      fsWait = true;
      setTimeout(() => {
        build("." + sep + normalize(file));
        clients.forEach((ws) => ws.send(JSON.stringify({ t: 0 })));
        fsWait = false;
      }, 100);
    }
  });
}


let argv = minimist(process.argv.slice(2), {
  default: {
    output: ".build",
  },
});
ensureDir(".build/index.html");
let root = process.cwd();
polka()
  .use(sirv('./.build'))
  .use(async (req, res, next) => {
    const path = posix.normalize(req.path);
    try {
      const start = Date.now();
      let index = resolve(root, "." + path);
      if ((await fs.stat(index)).isDirectory())
        index = resolve(index, "index.html");
      if (!/\.html?$/.test(index) || !(await fs.stat(index)).isFile())
        return next();
      const html = await fs.readFile(index, "utf-8");
      const result = runtime(path, html)
      const time = Date.now() - start;
      res.writeHead(200, {
        "Content-Type": "text/html;charset=utf-8",
        "Content-Length": Buffer.byteLength(result, "utf-8"),
        "Server-Timing": `index.html;dur=${time}`,
      });
      res.end(result);
    } catch (e) {
      next();
    }
  })
  .listen(3000, () => {
    console.info(`> Running on localhost:3000`);
  });

const RE = /<script(\s[^]*?)?>([^]*?)<\/script>/g
/**
 * @param {string} src
 * @param {string} id
 */
function compiler(src, id) {
  let js = ''
  src = src.replace(RE, (_, attr, code) => {
    js += code;
    return ''
  })
  let transformed = sucrase(js, {
    filePath: id,
    transforms: ["imports"]
  });
  let code = transformed.code;
  return `import _h from 'vhtml';let h=(n,a,...c)=>{if(a){delete a.__self;delete a.__source;}return _h(n,a,...c)};export default function App(props){${js};return (${src})}`
}
let runtime = createRuntime(compiler);
build("./index.html");

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
dev("./index.html");
