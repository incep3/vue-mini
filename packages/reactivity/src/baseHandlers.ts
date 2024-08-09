import { hasChanged, hasOwn, isObject } from '@vue/shared'
import { track, trigger, ITERATE_KEY } from './reactiveEffect'
import { ReactiveFlags, TriggerOpTypes } from './constants'
import { reactive, toRaw } from './reactive'

// @ts-ignore
class BaseReactiveHandler implements ProxyHandler<T> {
  constructor() {}

  get(target: object, key: string, receiver: object): any {
    // 代理对象可以通过 raw 属性访问原始数据
    if (key === ReactiveFlags.RAW) {
      return target
    }

    const res = Reflect.get(target, key, receiver)

    track(target, key)

    if (isObject(res)) {
      return reactive(res)
    }

    return res
  }

  set(target, key, newValue, reciever): any {
    const oldValue = target[key]

    // 如果属性不存在，则说明是在添加新属性，否则是设置已有属性
    const type = hasOwn(target, key) ? TriggerOpTypes.SET : TriggerOpTypes.ADD

    const result = Reflect.set(target, key, newValue, reciever)

    // target === toRaw(reciever)，说明 receiver 就是 target 的代理对象
    if (target === toRaw(reciever)) {
      if (hasChanged(oldValue, newValue)) {
        // 比较新值和旧值，只有当不全等的时候才触发响应；NaN 与 NaN 进行全等比较总会得到false，因此 hasChanged 内用 Object.is 方法判断；
        trigger(target, key, type)
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
      trigger(target, key, TriggerOpTypes.DELETE)
    }
    return result
  }

  has(target, key) {
    track(target, key)
    return Reflect.has(target, key)
  }
  ownKeys(target) {
    track(target, ITERATE_KEY)
    return Reflect.ownKeys(target)
  }
}

export const baseHandlers = new BaseReactiveHandler()
