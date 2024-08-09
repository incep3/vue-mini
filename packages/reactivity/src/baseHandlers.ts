import { hasChanged, hasOwn, isArray, isObject, isSymbol } from '@vue/shared'
import { track, trigger, ITERATE_KEY } from './reactiveEffect'
import { ReactiveFlags, TriggerOpTypes } from './constants'
import { reactive, readonly, toRaw } from './reactive'
import { warn } from './warning'

const arrayInstrumentations = {}
;['includes', 'indexOf', 'lastIndexOf'].forEach((method) => {
  const originMethod = Array.prototype[method]
  arrayInstrumentations[method] = function (...args) {
    // this 是代理对象，现在代理对象中查找，将结果存储到 res 中
    let res = originMethod.apply(this, args)

    if (res === false || res === -1) {
      // res 为 false 说明没找到，通过 this[ReactiveFlags.RAW] 拿到原始数组，再去其中查找并更新 res 值
      res = originMethod.apply(this[ReactiveFlags.RAW], args)
    }

    return res
  }
})

// @ts-ignore
class BaseReactiveHandler implements ProxyHandler<T> {
  constructor(
    protected readonly _isReadonly = false,
    protected readonly _isShallow = false
  ) {}

  get(target: object, key: string, receiver: object): any {
    const isReadonly = this._isReadonly,
      isShallow = this._isShallow
    if (key === ReactiveFlags.RAW) {
      // 代理对象可以通过 raw 属性访问原始数据
      return target
    }

    // 返回定义在 arrayInstrumentations 上的值，实现了重写
    if (Array.isArray(target) && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver)
    }

    const res = Reflect.get(target, key, receiver)

    // 添加判断，如果 key 的类型是 symbol，则不进行追踪
    // TODO：这里添加 !isSymbol(key) 会让通过的测试用例少一个
    if (!isReadonly && !isSymbol(key)) {
      track(target, key)
    }

    if (isShallow) {
      return res
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res
  }
}

class MutableReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow = false) {
    super(isShallow)
  }

  set(target, key, value, reciever): any {
    const oldValue = target[key]

    // 判断是否现存的 key
    const hadKey = Array.isArray(target)
      ? Number(key) < target.length
      : hasOwn(target, key)
    const result = Reflect.set(target, key, value, reciever)
    // target === toRaw(reciever)，说明 receiver 就是 target 的代理对象
    if (target === toRaw(reciever)) {
      if (!hadKey) {
        // 新 key，则 trigger 的 type 为 add
        trigger(target, TriggerOpTypes.ADD, key)
      } else if (hasChanged(value, oldValue)) {
        // 比较新值和旧值，只有当不全等的时候才触发响应；NaN 与 NaN 进行全等比较总会得到false，因此 hasChanged 内用 Object.is 方法判断；
        // 新的属性值需要传递过去，数组修改了 length，索引值 >= length 的元素会触发响应
        trigger(target, TriggerOpTypes.SET, key, value)
      }
    }
    return result
  }

  deleteProperty(target, key): boolean {
    const hadKey = hasOwn(target, key)
    const result = Reflect.deleteProperty(target, key)
    if (result && hadKey) {
      // 需要 result 和 hadKey 同时为true，才出发trigger：只有当被删除的属性是自己的属性并且成功删除时，才出发更新
      // 1. result：it will fail if target[key] is non-configurable.
      // 2. delete 只能删除属于对象自身的属性，不能删除原型链上属性；
      // 3. 如果删除的属性不存在对象自身上，delete 操作会返回true，这时就需要 hadKey 为true
      trigger(target, TriggerOpTypes.DELETE, key)
    }
    return result
  }

  has(target, key) {
    track(target, key)
    return Reflect.has(target, key)
  }
  ownKeys(target) {
    track(target, isArray(target) ? 'length' : ITERATE_KEY)
    return Reflect.ownKeys(target)
  }
}

class ReadonlyReactiveHandler extends BaseReactiveHandler {
  constructor(isShallow = false) {
    super(true, isShallow)
  }

  set(target: object, key: string | symbol) {
    warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`,
      target
    )
    return true
  }

  deleteProperty(target: object, key: string | symbol) {
    warn(
      `Delete operation on key "${String(key)}" failed: target is readonly.`,
      target
    )
    return true
  }
}

export const mutableHandlers = new MutableReactiveHandler()
export const readonlyHandlers = new ReadonlyReactiveHandler()
export const shallowReactiveHandlers = new MutableReactiveHandler(true)
export const shallowReadonlyHandlers = new ReadonlyReactiveHandler(true)
