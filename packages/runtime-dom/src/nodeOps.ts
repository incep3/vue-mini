export const nodeOps = {
  insert(child: HTMLElement, parent: HTMLElement, anchor: Node | null = null) {
    parent.insertBefore(child, anchor || null)
  },

  remove(el: HTMLElement) {
    const parent = el.parentNode
    if (parent) {
      parent.removeChild(el)
    }
  },

  createElement(tag: string) {
    return document.createElement(tag)
  },

  createText(text: string) {
    return document.createTextNode(text)
  },

  createComment(text: string) {
    return document.createComment(text)
  },

  setText(node: Text | Comment, text: string) {
    node.nodeValue = text
  },

  setElementText(el: HTMLElement, text: string) {
    el.textContent = text
  },
}
