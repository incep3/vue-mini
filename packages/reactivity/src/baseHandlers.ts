import { track, trigger } from './reactiveEffect'

// @ts-ignore
class BaseReactiveHandler implements ProxyHandler<T> {
  constructor() {}

  get(target: object, key: string, receiver: object): any {
    track(target, key)
    return Reflect.get(target, key, receiver)
  }

  set(target, key, newValue, reciever): any {
    let result = Reflect.set(target, key, newValue, reciever)
    trigger(target, key)
    return result
  }
}

export const baseHandlers = new BaseReactiveHandler()
