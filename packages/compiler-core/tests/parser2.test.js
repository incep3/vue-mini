import { parse2 } from '../src/parser2.js'
import { printObject } from '../src/utils/utils.js'
//
const a =
  '<div id="foo" v-show="display"><!-- 我是注释 -->foo&ltcc; {{ bar }} hi</div>'

const ast = parse2(a)

printObject(ast)
