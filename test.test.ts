import {globby} from 'globby';
import {compiler, ssrJs} from './compiler';
import {readFileSync} from 'fs'

describe('test', () => {
  test('all', () => {
    globbySync('examples/**/App.html').map(file => {
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
