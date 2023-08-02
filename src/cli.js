import minimist from "minimist";
// import glob from "glob";
import { existsSync, mkdirSync, watch, writeFileSync } from 'fs';
import polka from 'polka';
import sirv from 'sirv';
import { dirname, normalize, resolve, sep } from "path";
import { createRuntime } from "./run.js";

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
                fsWait = false;
            }, 100);
        }
    });
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
let runtime = createRuntime()
build('./index.html')
dev('./index.html')