// WeakMap 用于存储那些只有当 key 所引用的对象存在时才有价值的信息
const targetMap = new WeakMap()

export function track(target, key) {
  // 没有 activeEffect，直接 return
  if (!activeEffect) return

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }

  deps.add(activeEffect)
  // deps 就是一个与当前副作用函数存在联系的依赖集合
  // 将其添加到 activeEffect.deps 数组中
  activeEffect.deps.push(deps)
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const effects = depsMap.get(key)

  // 重新构造一个 Set 集合，防止无限执行（语言规范： 在调用 forEach 遍历 Set 集合时，如果一个值已经被访问过，但该值被删除并重新添加到集合，如果此时 forEach 遍历没有结束，那么该值会重新被访问）
  const effectsToRun = new Set(effects)
  effectsToRun.forEach((fn: Function) => fn())
}

// 用一个全局变量存储被注册的副作用函数
export let activeEffect
// effect栈：处理嵌套的 effect
const effectStack = []
export function effect(fn) {
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
