export function generate(node) {
  const context = {
    code: '',
    push(code) {
      context.code += code
    },
    // 当前缩进的级别，初始值为 0，即没有缩进
    currentIndent: 0,
    // 该函数用于换行，即在代码字符串的后面追加 \n 字符，
    // 另外，换行时应该保留缩进，所以我们还要追加 currentIndent * 2 个空格字符
    newLine() {
      context.code += '\n' + '  '.repeat(context.currentIndent)
    },
    indent() {
      context.currentIndent++
      context.newLine()
    },
    deIndent() {
      context.currentIndent--
      context.newLine()
    },
  }

  genNode(node, context)

  return context.code
}

function genNode(node, context) {
  switch (node.type) {
    case 'FunctionDecl':
      genFunctionDecl(node, context)
      break
    case 'ReturnStatement':
      genReturnStatement(node, context)
      break
    case 'CallExpression':
      genCallExpression(node, context)
      break
    case 'StringLiteral':
      genStringLiteral(node, context)
      break
    case 'ArrayExpression':
      genArrayExpression(node, context)
      break
  }
}

function genFunctionDecl(node, context) {
  const { push, indent, deIndent } = context
  push(`function ${node.id.name} `)
  push(`(`)
  genNodeList(node.params, context)
  push(') ')
  push('{')
  indent()
  node.body.forEach((n) => genNode(n, context))
  deIndent()
  push('}')
}

function genNodeList(nodes, context) {
  const { push } = context
  for (let i = 0, l = nodes.length; i < l; i++) {
    const node = nodes[i]
    genNode(node, context)
    if (i < l - 1) {
      push(', ')
    }
  }
}

function genArrayExpression(node, context) {
  const { push } = context
  push('[')
  genNodeList(node.elements, context)
  push(']')
}

function genReturnStatement(node, context) {
  const { push } = context
  push(`return `)
  genNode(node.return, context)
}

function genStringLiteral(node, context) {
  const { push } = context
  push(`'${node.value}'`)
}

function genCallExpression(node, context) {
  const { push } = context
  const { callee, arguments: args } = node
  push(`${callee.name}(`)
  genNodeList(args, context)
  push(')')
}
