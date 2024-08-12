/**
 * 递归下降算法构造模版 AST
 */

import { endianness } from 'os'

// 定义文本模式，作为一个状态集
const TextModes = {
  DATA: 'DATA', // 初始模式，解析标签、支持 HTML 实体
  RCDATA: 'RCDATA', //<title><textarea>, 支持 HTML 实体
  RAWTEXT: 'RAWTEXT', // <style><xmp><iframe><noembed><noframes><noscript>
  CDATA: 'CDATA', // <![CDATA[
}

export function parse2(str) {
  // 定义上下文对象
  const context = {
    source: str,
    mode: TextModes.DATA,
    advanceBy(num) {
      context.source = context.source.slice(num)
    },
    advanceSpaces() {
      const match = /^[\t\r\n\f ]+/.exec(context.source)
      if (match) {
        context.advanceBy(match[0].length)
      }
    },
  }

  const nodes = parseChildren(context, [])

  return {
    type: 'Root',
    children: nodes,
  }
}

/**
 *
 * @param {*} context 上下文对象 context
 * @param {*} param1 由父代节点构成的栈,用于维护节点间的父子关系
 */
function parseChildren(context, ancestors) {
  const nodes = []

  const { mode } = context
  while (!isEnd(context, ancestors)) {
    let node
    // 只有 DATA 模式和 RCDATA 模式才支持插值节点的解析
    if (mode === TextModes.DATA || mode === TextModes.RCDATA) {
      // 只有 DATA 模式才支持标签节点的解析
      if (mode === TextModes.DATA && context.source[0] === '<') {
        if (context.source[1] === '!') {
          if (context.source.startsWith('<!--')) {
            // 注释
            node = parseComment(context)
          } else if (context.source.startsWith('<![CDATA[')) {
            // CDATA
            node = parseCDATA(context, ancestors)
          }
        } else if (context.source[1] === '/') {
          console.error('无效的结束标签')
          continue
        } else if (/[a-z]/i.test(context.source[1])) {
          // 标签
          node = parseElement(context, ancestors)
        }
      } else if (context.source.startsWith('{{')) {
        node = parseInterpolation(context)
      }
    }
    // node 不存在，说明处于其他模式，即非 DATA 模式且非 RCDATA 模式
    // 这时一切内容都作为文本处理
    if (!node) {
      // 解析文本节点
      node = parseText(context)
    }

    nodes.push(node)
  }
  // 当 while 循环停止后，说明子节点解析完毕，返回子节点
  return nodes
}

function parseElement(context, ancestors) {
  const element = parseTag(context)
  if (element.isSelfClosing) return element

  // 切换到正确的文本模式
  if (element.tag === 'textarea' || element.tag === 'title') {
    context.mode = TextModes.RCDATA
  } else if (/style|xmp|iframe|noembed|noframes|noscript/.test(element.tag)) {
    context.mode = TextModes.RAWTEXT
  } else {
    context.mode = TextModes.DATA
  }

  ancestors.push(element)
  element.children = parseChildren(context, ancestors)
  ancestors.pop()

  if (context.source.startsWith(`</${element.tag}`)) {
    parseTag(context, 'end')
  } else {
    console.error(`${element.tag} 标签缺少闭合标签`)
  }

  return element
}

function parseTag(context, type = 'start') {
  const { advanceBy, advanceSpaces } = context

  const match =
    type === 'start'
      ? /^<([a-z][^\t\r\n\f />]*)/i.exec(context.source)
      : /^<\/([a-z][^\t\r\n\f />]*)/i.exec(context.source)
  const tag = match[1]

  advanceBy(match[0].length)
  advanceSpaces()
  // props 数组是由指定节点与属性节点共同组成的数组
  const props = parseAttributes(context)

  const isSelfClosing = context.source.startsWith('/>')
  advanceBy(isSelfClosing ? 2 : 1)

  return {
    type: 'Element',
    tag,
    props,
    children: [],
    isSelfClosing,
  }
}

function parseText(context) {
  let endIndex = context.source.length
  const ltIndex = context.source.indexOf('<')
  const delimiterIndex = context.source.indexOf('{{')

  if (ltIndex > -1) {
    endIndex = Math.min(endIndex, ltIndex)
  }

  if (delimiterIndex > -1) {
    endIndex = Math.min(endIndex, delimiterIndex)
  }

  const content = context.source.slice(0, endIndex)
  context.advanceBy(content.length)

  return {
    type: 'Text',
    content: decodeHtml(content),
  }
}

function parseComment(context) {
  context.advanceBy('<!--'.length)
  const closeIndex = context.source.indexOf('-->')
  const content = context.source.slice(0, closeIndex)
  context.advanceBy(content.length)
  context.advanceBy('-->'.length)
  return {
    type: 'Comment',
    content,
  }
}
function parseCDATA(context, ancestors) {}
function parseInterpolation(context) {
  context.advanceBy('{{'.length)
  const closeIndex = context.source.indexOf('}}')
  if (closeIndex < 0) {
    console.error('插值缺少结束定界符')
  }
  const content = context.source.slice(0, closeIndex)
  context.advanceBy(content.length)
  context.advanceBy('}}'.length)

  return {
    type: 'Interpolation',
    content: {
      type: 'Expression',
      content: decodeHtml(content),
    },
  }
}
const namedCharacterReferences = {
  gt: '>',
  'gt;': '>',
  lt: '<',
  'lt;': '<',
  'ltcc;': '▶️',
}
const CCR_REPLACEMENT = {
  0x80: 0x20ac,
  0x82: 0x201a,
}
function decodeHtml(rawText, asAttr = false) {
  let offset = 0
  const end = rawText.length
  let decodedText = ''
  let maxCRNameLength = 0

  function advance(length) {
    offset += length
    rawText = rawText.slice(length)
  }

  while (offset < end) {
    const head = /&(?:#x?)?/i.exec(rawText)
    if (!head) {
      const remaining = end - offset
      decodedText += rawText.slice(0, remaining)
      advance(remaining)
      break
    }

    decodedText += rawText.slice(0, head.index)
    advance(head.index)

    // 如果满足条件，则说明是命名字符引用，否则为数字字符引用
    if (head[0] === '&') {
      let name = ''
      let value
      if (/[0-9a-z]/i.test(rawText[1])) {
        if (!maxCRNameLength) {
          maxCRNameLength = Object.keys(namedCharacterReferences).reduce(
            (max, name) => Math.max(max, name.length),
            0
          )
        }
        for (let length = maxCRNameLength; !value && length > 0; --length) {
          name = rawText.substr(1, length)
          value = namedCharacterReferences[name]
        }
        if (value) {
          const semi = name.endsWith(';')
          if (
            asAttr &&
            !semi &&
            /[=a-z0-9]/i.test(rawText[name.length + 1] || '')
          ) {
            decodedText += '&' + name
            advance(1 + name.length)
          } else {
            decodedText += value
            advance(1 + name.length)
          }
        } else {
          decodedText += '&' + name
          advance(1 + name.length)
        }
      } else {
        decodedText += '&'
        advance(1)
      }
    } else {
      const hex = head[0] === '&#x'
      const pattern = hex ? /^&#x([0-9a-f]+);?/i : /^&#([0-9]+);?/
      const body = pattern.exec(rawText)

      if (body) {
        const cp = Number.parseInt(body[1], hex ? 16 : 10)
        if (cp === 0) {
          cp = 0xfffd
        } else if (cp > 0x10ffff) {
          cp = 0xfffd
        } else if (cp >= 0xd800 && cp <= 0xdfff) {
          cp = 0xfffd
        } else if ((cp >= 0xfdd0 && cp <= 0xfdef) || (cp & 0xfffe) === 0xfffe) {
          // noop
        } else if (
          (cp >= 0x01 && cp <= 0x08) ||
          cp === 0x0b ||
          (cp >= 0x0d && cp <= 0x1f) ||
          (cp >= 0x7f && cp <= 0x9f)
        ) {
          cp = CCR_REPLACEMENT[cp] || cp
        }
        decodedText += String.fromCodePoint(cp)
        advance(body[0].length)
      } else {
        decodedText += head[0]
        advance(head[0].length)
      }
    }
  }
  return decodedText
}
function parseAttributes(context) {
  const { advanceBy, advanceSpaces } = context
  const props = []

  while (!context.source.startsWith('>') && !context.source.startsWith('/>')) {
    const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)
    const name = match[0]
    // 消费属性名称
    advanceBy(name.length)
    advanceSpaces()
    // 消费等于号
    advanceBy(1)
    // 消费等于号与属性值之间的空白字符
    advanceSpaces()

    // 属性值
    let value = ''

    const quote = context.source[0]
    const isQuoted = quote === '"' || "'"

    if (isQuoted) {
      advanceBy(1)
      const endQuoteIndex = context.source.indexOf(quote)
      if (endQuoteIndex > -1) {
        value = context.source.slice(0, endQuoteIndex)
        advanceBy(value.length)
        advanceBy(1)
      } else {
        console.error('缺少引号')
      }
    } else {
      // 下一个空白字符之前的内容全部作为属性值
      const match = /^[^\t\r\n\f >]+/.exec(context.source)
      value = match[0]
      advanceBy(value.length)
    }

    advanceSpaces()

    props.push({
      type: 'Attribute',
      name,
      value,
    })
  }

  return props
}
function isEnd(context, ancestors) {
  if (!context.source) {
    return true
  }

  for (let i = ancestors.length - 1; i >= 0; --i) {
    if (context.source.startsWith(`</${ancestors[i].tag}`)) {
      return true
    }
  }

  return false
}
