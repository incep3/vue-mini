import {
  createArrayExpression,
  createCallExpression,
  createStringLiteral,
} from '../ast.js'

// 转换元素节点
export const transformElement = (node) => {
  // 将转换代码编写在退出阶段的回调函数中
  // 这样可以保证该标签节点的子节点全部被处理完毕
  return () => {
    if (node.type !== 'Element') {
      return
    }

    const callExp = createCallExpression('h', [createStringLiteral(node.tag)])

    node.children.length === 1
      ? callExp.arguments.push(node.children[0].jsNode)
      : callExp.arguments.push(
          createArrayExpression(node.children.map((c) => c.jsNode))
        )

    node.jsNode = callExp
  }
}
