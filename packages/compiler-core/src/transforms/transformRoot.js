// 转换 Root 根节点
export const transformRoot = (node) => {
  return () => {
    if (node.type !== 'Root') {
      return
    }

    const vnodeJSAST = node.children[0].jsNode
    node.jsNode = {
      type: 'FunctionDecl',
      id: {
        type: 'Identifier',
        name: 'render',
      },
      params: [],
      body: [
        {
          type: 'ReturnStatement',
          return: vnodeJSAST,
        },
      ],
    }
  }
}
