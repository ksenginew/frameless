import glob from 'glob';
import {compiler, ssrJs} from './compiler';
import {readFileSync} from 'fs'

describe('test', () => {
  test('all', () => {
    glob.sync('examples/**/App.html').map(file => {
      let { server, html, style } = compiler(readFileSync(file).toString())
      expect(`
      // file: ${file}
      function App() {
        ${server}

        return \`${html}\`
      }
      `).toMatchSnapshot()
    })
  })
})
