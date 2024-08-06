// 用一个全局变量存储被注册的副作用函数
export let activeEffect
// effect栈：处理嵌套的 effect
const effectStack = []
export function effect(fn, options = {}) {
  const effectFn = () => {
    // 调用 cleanup 函数完成清除工作 重新收集依赖
    cleanup(effectFn)
    activeEffect = effectFn
    // 在调用副作用函数之前将当前副作用函数压入栈中
    effectStack.push(effectFn)
    try {
      fn()
    } finally {
      effectStack.pop()
      // activeEffect 始终是栈顶元素
      activeEffect = effectStack[effectStack.length - 1]
    }
  }
  effectFn.options = options
  effectFn.deps = []
  // 调用时，副作用立即执行一次
  effectFn()
}

// 清理函数，解决分支切换问题
function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    // 将 effectFn 从依赖集合中移除
    deps.delete(effectFn)
  }
  // 最后需要重置 effectFn.deps 数组
  effectFn.deps.length = 0
}
