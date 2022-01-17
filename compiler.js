let RE =
  /<script([^]*?)>([^]*?)<\/script\s*>|<script([^]*?)>([^]*?)<\/script\s*>/g;

export function compiler(source) {
  let server = "";
  let style = "";
  let static = source.replace(SCRIPT, (_, $1, $2, $3, $4) => {
    if($2)
      server += $2 + "\n";
    if($4)
      style += $4;
    return "";
  });
  return { server, static, style };
}

export function ssrJs(server, static) {
  return new Function("__", server + "return `" + static + "`;");
}
