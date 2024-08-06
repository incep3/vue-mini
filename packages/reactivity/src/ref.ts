import { hasOwn, isObject } from '@vue/shared'
import { reactive } from './reactive'

export function ref(val) {
  const wrapper = {
    value: val,
  }

  // 使用 Object.defineProperty 在 wrapper 对象上定义一个不可枚举的属性 __v_isRef,并且值为 true
  Object.defineProperty(wrapper, '__v_isRef', { value: true })

  return reactive(wrapper)
}

export function toRef(obj, key) {
  const wrapper = {
    get value() {
      return obj[key]
    },
    set value(val) {
      obj[key] = val
    },
  }

  // 为了概念上的统一，将通过 toRef 或 toRefs 转换后得到的结果视为真正的 ref 数据
  Object.defineProperty(wrapper, '__v_isRef', {
    value: true,
  })

  return wrapper
}

export function toRefs(obj) {
  let out = {}
  for (const key in obj) {
    out = toRef(obj, key)
  }
  return out
}

export type Ref = {
  __v_isRef: true
  value
}

export const isRef = (val: unknown): val is Ref =>
  isObject(val) && hasOwn(val, '__v_isRef')

export function proxyRefs(target) {
  return new Proxy(target, {
    get: function (target, key, receiver) {
      const value = Reflect.get(target, key, receiver)
      return isRef(value) ? value.value : value
    },
    set: function (target, key, newValue, receiver) {
      // 通过 target 读取真实值
      const value = target[key]
      // 如果值是 Ref，则设置其对应的 value 属性值
      if (isRef(value)) {
        value.value = newValue
        return true
      }
      return Reflect.set(target, key, newValue, receiver)
    },
  })
}
