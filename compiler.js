let SERVERRE = /<\s*script(\s+[^]*?)?\sserver(\s+[^]*?)?>([^]*?)<\/\s*script\s*>/g

export function compiler(source) {
  let server = ''
  let static = source.replace(SERVERRE, (_, $1, $2, $3) => {
    server += $2 + '\n'
    return ''
  })
  return { server, static }
}

export let html = (strings, ...args) =>
  strings.reduce(
    (previous, current, index) => {
      let value = (args[index] || "")
      if (typeof value == 'object')
        value = Object.entries(value).map(([k, v]) => k + '=' + JSON.stringify(v)).join(' ')
      return previous + current + (args[index] || "")
    },
    ""
  )

export let ctx = { html }

export function ssrJs(server, static) {
  return new Function('__', server+'return __.html`' + static + '`;')
}
