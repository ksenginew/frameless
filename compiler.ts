let RE =
  /<script([^]*?)>([^]*?)<\/script\s*>|<script([^]*?)>([^]*?)<\/script\s*>/g;

export function compiler(source: string) {
  let server = "";
  let style = "";
  let html = source.replace(RE, (_, $1, $2, $3, $4) => {
    if ($2)
      server += $2 + "\n";
    if ($4)
      style += $4;
    return "";
  });
  return { server, html, style };
}

export function ssrJs(server: string, _static: string) {
  return new Function("__", server + "return `" + _static + "`;");
}
