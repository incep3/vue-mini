export function registerRuntimeCompiler(template) {}

export let currentInstance = null

export const getCurrentInstance = () => currentInstance

export function setCurrentInstance(instance) {
  currentInstance = instance
}
