import { createVNode } from './vnode'

export function createAppAPI(render) {
  return function createApp(rootCompoment, rootProps) {
    const app = {
      mount(rootContainer) {
        const vnode = createVNode(rootCompoment, rootProps)

        render(vnode, rootContainer)
      },
    }

    return app
  }
}
