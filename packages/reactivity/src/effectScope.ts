import { readonlyHandlers } from './baseHandlers'
import { activeEffect, ReactiveEffect } from './effect'
import { warn } from './warning'
export let activeEffectScope: EffectScope | null

export class EffectScope {
  _active: boolean = true
  effects: ReactiveEffect[] = []
  cleanups: Function[] = []
  parent: EffectScope | undefined
  index: number | undefined
  scopes: EffectScope[] | undefined
  constructor(public detached = false) {
    this.parent = activeEffectScope
    if (!detached && activeEffectScope) {
      this.index =
        (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(
          this
        ) - 1
    }
  }
  run(fn) {
    if (this._active) {
      let currentEffectScope = activeEffectScope
      try {
        activeEffectScope = this
        return fn()
      } finally {
        activeEffectScope = currentEffectScope
      }
    } else {
      warn(`cannot run an inactive effect scope.`)
    }
  }
  get active() {
    return this._active
  }
  on() {
    activeEffectScope = this
  }
  off() {
    activeEffectScope = this.parent
  }
  stop(fromParent) {
    if (this._active) {
      let i, l
      for (i = 0, l = this.effects!.length; i < l; i++) {
        this.effects![i].stop()
      }
      for (i = 0, l = this.cleanups!.length; i < l; i++) {
        this.cleanups![i]()
      }
      if (this.scopes) {
        for (i = 0, l = this.scopes.length; i < l; i++) {
          this.scopes[i].stop(true)
        }
      }
      if (!this.detached && this.parent && !fromParent) {
        const last = this.parent.scopes?.pop()
        if (last && last !== this) {
          this.parent.scopes![this.index] = last!
          last.index = this.index
        }
      }
      this.parent = undefined
      this._active = false
    }
  }
}

export function effectScope(detached?) {
  return new EffectScope(detached)
}

export function onScopeDispose(cleanup) {
  if (activeEffectScope) {
    activeEffectScope.cleanups.push(cleanup)
  }
}

export function getCurrentScope() {
  return activeEffectScope
}
