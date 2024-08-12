import { tokenize } from './tokenizer.js'

export function parse(str) {
  const tokens = tokenize(str)
  console.log('[tokens]', tokens)
  // 创建 Root 根节点
  const root = {
    type: 'Root',
    children: [],
  }

  // 创建 elementStack 栈，起初只有 Root 根节点
  const elementStack = [root]

  while (tokens.length) {
    const parent = elementStack[elementStack.length - 1]
    const t = tokens[0]
    switch (t.type) {
      case 'tag':
        const elementNode = {
          type: 'Element',
          tag: t.name,
          children: [],
        }
        parent.children.push(elementNode)
        elementStack.push(elementNode)
        break
      case 'text':
        const textNode = {
          type: 'Text',
          content: t.content,
        }
        parent.children.push(textNode)
        break
      case 'tagEnd':
        elementStack.pop()
        break
    }
    // 消费已经扫描过的 token
    tokens.shift()
  }
  return root
}
