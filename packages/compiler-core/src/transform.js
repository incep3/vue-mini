function createTransformContext(
  root,
  { nodeTransforms = [], directiveTransforms = {} }
) {
  const context = {
    // 用来存储当前正在转换的节点
    currentNode: null,
    // 用来存储当前节点在父节点的 children 中的位置索引
    childIndex: 0,
    // 用来存储当前转换节点的父节点
    parent: null,
    replaceNode(node) {
      context.parent.children[context.childIndex] = node
      context.currentNode = node
    },
    removeNode() {
      if (context.parent) {
        context.parent.children.splice(context.childIndex, 1)
        context.currentNode = null
      }
    },
    nodeTransforms,
    directiveTransforms,
  }

  return context
}

export function transform(root, options) {
  // 上下文其实就是在某个范围内的“全局变量”，在这个范围内的任意地方都可以拿到这个“全局变量”
  const context = createTransformContext(root, options)

  traverseNode(root, context)

  return root
}

function traverseNode(node, context) {
  context.currentNode = node

  // apply transform plugins
  const { nodeTransforms } = context
  const exitFns = []
  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context)
    if (onExit) {
      exitFns.push(onExit)
    }
    if (!context.currentNode) {
      // node was removed
      return
    } else {
      // node may have been replaced
      node = context.currentNode
    }
  }

  let children = context.currentNode.children
  if (children) {
    children = Array.from(children) // 可能会被删除，复制一份
    for (let i = 0; i < children.length; i++) {
      context.parent = context.currentNode
      context.childIndex = i
      traverseNode(children[i], context)
    }
  }

  // exit transforms
  // 注意，这里我们要反序执行
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}
