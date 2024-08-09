import { track, trigger } from './reactiveEffect'

// @ts-ignore
class BaseReactiveHandler implements ProxyHandler<T> {
  constructor() {}

  get(target: object, key: string, receiver: object): any {
    track(target, key)
    return Reflect.get(target, key, receiver)
  }

  set(target, key, newValue, reciever): any {
    trigger(target, key)
    return Reflect.set(target, key, newValue, reciever)
  }
}

export const baseHandlers = new BaseReactiveHandler()
