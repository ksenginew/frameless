let SERVERRE = /<\s*script(\s+[^]*?)?\sserver(\s+[^]*?)?>([^]*?)<\/\s*script\s*>/g

export function compiler(source) {
  let server = ''
  let static = source.replace(SERVERRE, (_, $1, $2, $3) => {
    server += $2 + '\n'
    return ''
  })
  return { server, static }
}

let HTMLRE =
  /<(\/?)([^\s/>]*)|\s+([^\s/>]+)(?:\s*=\s*("(?:\\"|[^"])*"|[^\s/>]+))?|(\/?)>|([^<]+)/g

let html = (strings, ...args) => {
  let src = strings.reduce(
    (previous, current, index) => previous + current + '{%' + index + '%}',
    ''
  )

  let isTag = 0
  let tagname
  let attrMap = {}
  let tree = [[]]
  while ((m = HTMLRE.exec(src))) {
    tokens.push(m[0])
    if(!isTag && m[6])
        tree[0].push()
    else if (isTag && m[5])
        tree.unshift([tagname, attrMap])
    else if (isTag && m[3])
        attrMap[m[3]] = m[4]
    else if (!isTag && m[1])
        tree.
    else
      tree[0]
  }

  return tokens
}

export let ctx = { html }

export function ssrJs(server, static) {
  return new Function('__', server+'return __.html`' + static + '`;')
}
