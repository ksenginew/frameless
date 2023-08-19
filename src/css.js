let newRule = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g;
let ruleClean = /\/\*[^]*?\*\/|  +/g;
let ruleNewline = /\n+/g;
let empty = ' ';

