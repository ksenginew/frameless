let RE =
  /<script([^]*?)>([^]*?)<\/script\s*>|<style([^]*?)>([^]*?)<\/style\s*>/g;

export function compiler(source: string, id = Math.random().toString(36).slice(2)) {
  let server = "";
  let style = "";
  let html = source.replace(RE, (_, $1, $2, $3, $4) => {
    if ($2)
      server += $2 + "\n";
    if ($4)
      style += $4;
    return "";
  });
  style.replace(/(?:\\,|[^,])+/g, selector => selector.replace(/(?<!\\)(?=\.)|$/, '.' + id));
  return { server, html, style };
}

export function ssrJs(server: string, _static: string) {
  return new Function("__", server + "return `" + _static + "`;");
}
