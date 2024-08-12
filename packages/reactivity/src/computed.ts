import { isFunction, NOOP } from '@vue/shared'
import { ReactiveEffect } from './effect'
import { trackRefValue, triggerRefValue } from './ref'
export class ComputedRefImpl {
  public dep?

  private _value
  private _dirty = true

  public readonly effect
  public readonly __v_isRef = true
  constructor(getter, private readonly _setter) {
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true
        triggerRefValue(this)
      }
    })
  }
  get value() {
    if (this._dirty) {
      this._value = this.effect.run()
      this._dirty = false
    }
    trackRefValue(this)
    // 当读取 value 时，手动调用 track 函数进行追踪
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
