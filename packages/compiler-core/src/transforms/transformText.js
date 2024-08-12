import { createStringLiteral } from '../ast.js'

// 转换文本节点
export const transformText = (node, context) => {
  if (node.type !== 'Text') {
    return
  }

  node.jsNode = createStringLiteral(node.content)
}
