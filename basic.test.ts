import glob from 'glob';
import { compiler, ssrJs } from './compiler';
import { readFileSync } from 'fs'

describe('test', () => {
  test('all', () => {
    glob.sync('examples/**/App.html').map(file => {
      let { server, html, style } = compiler(readFileSync(file).toString())
      expect(`
// file: ${file}
------------------------------
js   = <script>${server}</script>
------------------------------
css  = <style>${style}</style>
------------------------------
html = ${html}
`).toMatchSnapshot()
    })
  })
})
