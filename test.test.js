import {globby} from 'globby';
import {compiler, ssrJs} from './compiler';
import {readFileSync} from 'fs'

describe('test', () => {
  test('all', () => {
    globbySync('examples/**/App.html').map(file => {
      let { server, static, style } = compiler(readFileSync(file))
      expect(`
      // file: ${file}
      function App() {
        ${server}

        return \`${static}\`
      }
      `).matchSnapShot()
    })
  })
})
