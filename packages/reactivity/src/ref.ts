import { hasChanged, hasOwn, isObject } from '@vue/shared'
import { toReactive } from './reactive'
import { track, trackEffects, trigger, triggerEffects } from './reactiveEffect'
import { TriggerOpTypes } from './constants'
import { shouldTrack } from './baseHandlers'
import { activeEffect } from './effect'

export type Ref = {
  value
  __v_isRef: true
}

export const isRef = (r: any): r is Ref => {
  return !!(r && r.__v_isRef) === true
}

export function trackRefValue(ref) {
  if (!shouldTrack || !activeEffect) {
    return
  }

  trackEffects(ref.dep || (ref.dep = new Set()))
}

export function triggerRefValue(ref) {
  const dep = ref.dep
  if (dep) {
    triggerEffects([...dep])
  }
}

class RefImpl<T> {
  private _value: T

  public dep = undefined
  public readonly __v_isRef = true

  constructor(val, private readonly _shallow) {
    this._value = val
  }

  get value() {
    trackRefValue(this)
    return this._shallow ? this._value : toReactive(this._value)
  }
  set value(newVal) {
    if (hasChanged(this._value, newVal)) {
      this._value = newVal
      triggerRefValue(this)
    }
  }
}

export function ref(value) {
  return createRef(value)
}
export function shallowRef(value) {
  return createRef(value, true)
}
export function unref(ref) {
  return isRef(ref) ? ref.value : ref
}
export function triggerRef(ref) {
  triggerRefValue(ref)
}
function createRef(value, shallow = false) {
  if (isRef(value)) {
    return value
  }
  return new RefImpl(value, shallow)
}
export function customRef(factory) {
  return new CustomRefImpl(factory)
}

class CustomRefImpl {
  public dep?

  private readonly getter
  private readonly setter

  public __v_isRef = true

  constructor(factory) {
    const { get, set } = factory(
      () => trackRefValue(this),
      () => triggerRefValue(this)
    )
    this.getter = get
    this.setter = set
  }
  get value() {
    return this.getter()
  }
  set value(newVal) {
    this.setter(newVal)
  }
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
