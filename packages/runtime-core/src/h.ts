import { createVNode } from './vnode'

export function h(type, propsOrChildren, children) {
  return createVNode(type, propsOrChildren, children)
}
