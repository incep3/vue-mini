export const Fragment = Symbol.for('v-fgt')
export const Text = Symbol.for('v-txt')
export const Comment = Symbol.for('v-cmt')

export type VNodeTypes =
  | string
  | object
  | typeof Fragment
  | typeof Comment
  | typeof Text

export type VNode = {
  type: VNodeTypes
  props: { [k: string]: any } | null
  children: VNode[] | string | null

  // DOM
  el: HTMLElement | null

  key: string
}

export function isSameVNodeType(n1: VNode, n2: VNode): boolean {
  return n1.type === n2.type
}

export function createVNode(type, props, children = []) {
  return {
    type,
    props,
    children,
  }
}
