import { dump } from './dump.js'
import { generate } from './codegen.js'
import { parse } from './parser.js'
import { transform } from './transform.js'
import { transformElement } from './transforms/transformElement.js'
import { transformRoot } from './transforms/transformRoot.js'
import { transformText } from './transforms/transformText.js'
const isString = (val) => typeof val === 'string'

export function baseCompile(source, options = {}) {
  const ast = isString(source) ? parse(source) : source
  dump(ast)

  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset()

  transform(
    ast,
    // directiveTransforms对象中的指令全部都是会给node节点生成props属性的，那些不生成props属性的就在nodeTransforms数组中。
    Object.assign({}, options, {
      nodeTransforms: [...nodeTransforms, ...(options.nodeTransforms || [])],
      // 相同的key，options.directiveTransforms 会覆盖
      directiveTransforms: Object.assign(
        {},
        directiveTransforms,
        options.directiveTransforms || {}
      ),
    })
  )
  console.log('转换后:', ast.jsNode)

  return generate(ast.jsNode)
}

function getBaseTransformPreset() {
  return [[transformElement, transformText, transformRoot], {}]
}
