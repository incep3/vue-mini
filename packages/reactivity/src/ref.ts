import { hasChanged, hasOwn, isObject } from '@vue/shared'
import { toReactive } from './reactive'
import { track, trigger } from './reactiveEffect'
import { TriggerOpTypes } from './constants'

class RefImpl<T> {
  private _value: T
  public readonly __v_isRef = true

  constructor(val, private readonly _shallow) {
    this._value = val
  }

  get value() {
    track(this, 'value')
    return this._shallow ? this._value : toReactive(this._value)
  }
  set value(newVal) {
    if (hasChanged(this._value, newVal)) {
      this._value = newVal
      trigger(this, TriggerOpTypes.SET, 'value')
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
  trigger(ref, TriggerOpTypes.SET, 'value')
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
  private readonly getter
  private readonly setter

  public __v_isRef = true

  constructor(factory) {
    const { get, set } = factory(
      () => track(this, 'value'),
      () => trigger(this, TriggerOpTypes.SET, 'value')
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
