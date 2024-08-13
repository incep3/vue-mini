import { createRenderer } from '@vue/runtime-core'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'
import { isString } from '@vue/shared'

const renderOptions = { patchProp, ...nodeOps }

let renderer

export function ensureRenderer() {
  return renderer || (renderer = createRenderer(renderOptions))
}

export const createApp = (...args) => {
  const app = ensureRenderer().createApp(...args)

  const { mount } = app
  app.mount = (containerOrSelector: Element | string) => {
    const container = normalizeContainer(containerOrSelector)
    if (!container) return

    const proxy = mount(container)
    return proxy
  }

  return app
}

function normalizeContainer(containerOrSelector: Element | string) {
  if (isString(containerOrSelector)) {
    return document.querySelector(containerOrSelector)
  }
  return containerOrSelector
}

// re-export everything from core
// h, Component, reactivity API, nextTick, flags & types
export * from '@vue/runtime-core'
