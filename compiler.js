let SERVERRE = /<\s*script(\s+[^]*?)?\sserver(\s+[^]*?)?>([^]*?)<\/\s*script\s*>/g

export function compiler(source) {
  let server = ''
  let static = source.replace(SERVERRE, (_, $1, $2, $3) => {
    server += $2 + '\n'
    return ''
  })
  return { server, static }
}

export function ssr(server, static) {
  return new Function(${server}return${static};)
}
