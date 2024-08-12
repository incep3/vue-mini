// ------用来创建 JavaScript AST 节点的辅助函数
// 用来创建 StringLiteral 节点
export function createStringLiteral(value) {
  return {
    type: 'StringLiteral',
    value,
  }
}

// 用来创建 Identifier 节点
export function createIdentifier(name) {
  return {
    type: 'Identifier',
    name,
  }
}

// 用来创建 ArrayExpression 节点
export function createArrayExpression(elements) {
  return {
    type: 'ArrayExpression',
    elements,
  }
}

// 用来创建 CallExpression 节点
export function createCallExpression(callee, args) {
  return {
    type: 'CallExpression',
    callee: createIdentifier(callee),
    arguments: args,
  }
}
