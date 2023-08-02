import minimist from "minimist";
// import glob from "glob";
import { existsSync, mkdirSync, watch, writeFileSync } from 'fs';
import polka from 'polka';
import sirv from 'sirv';
import { dirname, normalize, resolve, sep } from "path";
import { createRuntime } from "./run.js";
import { WebSocket, WebSocketServer } from 'ws';
import { parse } from "./parser.js";
import { stringify } from "./ssr.js";

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
        ensureDir(output)
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
                WS.send(JSON.stringify({t:0}))
                fsWait = false;
            }, 100);
        }
    });
}

/**
 * @param {string} src
 * @param {string} id
 */
function compiler(src, id) {
    let [root, ...nodes] = parse(src);
    let body = nodes.findIndex(node=>node.type=='element'&&node.name == 'body')
    if(body!==-1){
        nodes[body].data.unshift(nodes.push({type:'text',data:`<script></script>`}))
    }
    // @ts-ignore
    let html = stringify(root.data, nodes);
    let script = nodes.filter(node=>node.type=='element' && node.name=='script').map(node=>node.data).join('')
    return `export default function(){${script};return\`${html}\`}`
}

let argv = minimist(process.argv.slice(2), {
    default: {
        output: '.build'
    }
});
ensureDir('.build/index.html')
polka()
    .use(sirv('./.build'))
    .listen(3000, () => {
        console.log(`> Running on localhost:3000`);
    });

let runtime = createRuntime(compiler)
build('./index.html')


const wss = new WebSocketServer({ port: 3001 });
/** @type {WebSocket} */
let WS;
wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  dev('./index.html')

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });
  WS=ws
});


