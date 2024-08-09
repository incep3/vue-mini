import { hasOwn } from '@vue/shared'
import { ITERATE_KEY } from './reactive'
import { track, trigger } from './reactiveEffect'
import { TriggerOpTypes } from './constants'

// @ts-ignore
class BaseReactiveHandler implements ProxyHandler<T> {
  constructor() {}

  get(target: object, key: string, receiver: object): any {
    track(target, key)
    return Reflect.get(target, key, receiver)
  }

  set(target, key, newValue, reciever): any {
    // 如果属性不存在，则说明是在添加新属性，否则是设置已有属性
    const type = hasOwn(target, key) ? TriggerOpTypes.SET : TriggerOpTypes.ADD

    const result = Reflect.set(target, key, newValue, reciever)

    // 将 type 作为第三个参数传递给 trigger 函数
    trigger(target, key, type)
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
