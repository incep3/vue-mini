// 用一个全局变量存储被注册的副作用函数
export let activeEffect
// effect栈：处理嵌套的 effect
const effectStack = []

export function effect(fn, options = {}) {
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
class ReactiveEffect {
  deps = []
  constructor(public fn, public scheduler?) {}

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
}

// 清理函数，解决分支切换问题
function cleanup(effect) {
  for (let i = 0; i < effect.deps.length; i++) {
    const deps = effect.deps[i]
    // 将 effectFn 从依赖集合中移除
    deps.delete(effect)
  }
  // 最后需要重置 effectFn.deps 数组
  effect.deps.length = 0
}
