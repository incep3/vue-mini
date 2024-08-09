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
    // 将 fn 的执行结果存储到 res 中
    let res
    try {
      res = fn()
    } finally {
      effectStack.pop()
      // activeEffect 始终是栈顶元素
      activeEffect = effectStack[effectStack.length - 1]
    }
    // 手动执行可以拿到 fn 结果
    return res
  }
  effectFn.options = options
  effectFn.deps = []
  // lazy:懒执行的 effect
  if (!options.lazy) {
    effectFn()
  }
  // 懒执行：需要将副作用函数作为返回值返回，用于手动执行
  return effectFn
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
