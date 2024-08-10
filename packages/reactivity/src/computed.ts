import { isFunction, NOOP } from '@vue/shared'
import { TriggerOpTypes } from './constants'
import { effect } from './effect'
import { track, trigger } from './reactiveEffect'
export class ComputedRefImpl {
  private _value
  private _dirty = true

  public readonly effect
  public readonly __v_isRef = true
  constructor(getter, private readonly _setter) {
    this.effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        if (!this._dirty) {
          this._dirty = true
          trigger(this, TriggerOpTypes.SET, 'value')
        }
      },
    })
  }
  get value() {
    if (this._dirty) {
      this._value = this.effect()
      this._dirty = false
    }
    // 当读取 value 时，手动调用 track 函数进行追踪
    track(this, 'value')
    return this._value
  }
  set value(newValue) {
    this._setter(newValue)
  }
}
export function computed(getterOrOptions) {
  let getter
  let setter
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
    setter = NOOP
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}
