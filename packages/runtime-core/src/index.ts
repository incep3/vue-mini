// Core API ------------------------------------------------------------------

export {
  // core
  reactive,
  ref,
  readonly,
  // utilities
  proxyRefs,
  toRef,
  toRefs,
  // advanced
  shallowReactive,
  shallowReadonly,

  // effect
  effect,
  // effect scope
  effectScope,
  EffectScope,
  getCurrentScope,
  onScopeDispose,
} from '@vue/reactivity'
export { watch } from './apiWatch'

// Advanced API ----------------------------------------------------------------

// For getting a hold of the internal instance in setup() - useful for advanced
// plugins
export { getCurrentInstance } from './component'

// For raw render function users
export { h } from './h'
// Advanced render function utilities
export { createVNode } from './vnode'
// VNode types
export { Fragment, Text, Comment } from './vnode'

// Custom Renderer API ---------------------------------------------------------

export { createRenderer } from './renderer'

/** @internal */
export { registerRuntimeCompiler } from './component'
