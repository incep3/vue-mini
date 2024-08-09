import { hasChanged, hasOwn } from '@vue/shared'
import { track, trigger, ITERATE_KEY } from './reactiveEffect'
import { TriggerOpTypes } from './constants'

// @ts-ignore
class BaseReactiveHandler implements ProxyHandler<T> {
  constructor() {}

  get(target: object, key: string, receiver: object): any {
    track(target, key)
    return Reflect.get(target, key, receiver)
  }

  set(target, key, newValue, reciever): any {
    const oldValue = target[key]

    // 如果属性不存在，则说明是在添加新属性，否则是设置已有属性
    const type = hasOwn(target, key) ? TriggerOpTypes.SET : TriggerOpTypes.ADD

    const result = Reflect.set(target, key, newValue, reciever)

    // 比较新值和旧值，只有当不全等的时候才触发响应；NaN 与 NaN 进行全等比较总会得到false，因此 hasChanged 内用 Object.is 方法判断；
    if (hasChanged(oldValue, newValue)) {
      trigger(target, key, type)
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
