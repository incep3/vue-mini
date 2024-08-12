import { baseCompile } from '../src/compile.js'

const a = '<div><p>Vue</p><p>Template</p></div>'

const code = baseCompile(a)

console.log('[code]', code)
