import { activeEffectScope } from './effectScope'
// 用一个全局变量存储被注册的副作用函数
export let activeEffect
// effect栈：处理嵌套的 effect
const effectStack = []

export function effect(fn, options = {}) {
  if (fn.effect instanceof ReactiveEffect) {
    fn = fn.effect.fn
  }
  const _effect = new ReactiveEffect(fn)

  if (options) {
    Object.assign(_effect, options)
  }
  // lazy:懒执行的 effect
  if (!options.lazy) {
    _effect.run()
  }
  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  // 懒执行：需要将副作用函数作为返回值返回，用于手动执行
  return runner
}
export class ReactiveEffect {
  active = true
  deps = []
  onStop?

  constructor(public fn, public scheduler?) {
    if (activeEffectScope && activeEffectScope.active) {
      activeEffectScope.effects.push(this)
    }
  }

  run() {
    // 调用 cleanup 函数完成清除工作 重新收集依赖
    cleanup(this)
    try {
      activeEffect = this
      // 在调用副作用函数之前将当前副作用函数压入栈中
      effectStack.push(this)
      return this.fn()
    } finally {
      effectStack.pop()
      // activeEffect 始终是栈顶元素
      activeEffect = effectStack[effectStack.length - 1]
    }
  }

  stop() {
    if (this.active) {
      cleanup(this)
      this.onStop && this.onStop()
      this.active = false
    }
  }
}

// 清理函数，解决分支切换问题
function cleanup(effect) {
  const { deps } = effect
  for (let i = 0, l = deps.length; i < l; i++) {
    deps[i].delete(effect)
  }
  deps.length = 0
}
