import { hasOwn, isObject } from '@vue/shared'
import { track, trigger } from './reactiveEffect'

export const convert = (val) => (isObject(val) ? reactive(val) : val)

const reactiveMap = new WeakMap()

export function reactive(target) {
  return createReactiveObject(target)
}

function createReactiveObject(target) {
  // reactive 只能将对象转变为响应式对象
  if (!isObject(target)) {
    throw new Error('target should be Object.')
  }

  // 如果已经有对应的响应式对象，直接返回
  let existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  existingProxy = new Proxy(target, {
    get: function (target, key, receiver) {
      track(target, key)
      return Reflect.get(target, key, receiver)
    },
    set: function (target, key, newValue, reciever) {
      const oldValue = Reflect.get(target, key, reciever)
      let result
      if (oldValue !== newValue) {
        result = Reflect.set(target, key, newValue)
        trigger(target, key)
      } else {
        result = true
      }
      return result
    },
    deleteProperty(target, key) {
      const hadKey = hasOwn(target, key)
      let result
      if (hadKey) {
        result = Reflect.deleteProperty(target, key)
        trigger(target, key)
      }
      return result
    },
  })

  reactiveMap.set(target, existingProxy)
  return target
}
