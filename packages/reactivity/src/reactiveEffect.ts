import { TriggerOpTypes } from './constants'
import { activeEffect } from './effect'

// WeakMap 用于存储那些只有当 key 所引用的对象存在时才有价值的信息
const targetMap = new WeakMap()

export const ITERATE_KEY = Symbol('')

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

export function trigger(target, type: TriggerOpTypes, key, newValue?) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const effects = depsMap.get(key)

  const addToRun = (effects) => {
    effects &&
      effects.forEach((effectFn) => {
        // 如果 trigger 触发执行的副作用函数与当前正在执行的副作用函数相同，则不触发执行
        if (effectFn !== activeEffect) {
          effectsToRun.add(effectFn)
        }
      })
  }

  // 重新构造一个 Set 集合，防止无限执行（语言规范： 在调用 forEach 遍历 Set 集合时，如果一个值已经被访问过，但该值被删除并重新添加到集合，如果此时 forEach 遍历没有结束，那么该值会重新被访问）
  const effectsToRun = new Set()

  addToRun(effects)
  // 只有当操作类型为 ADD | DELETE 时，才触发与 ITERATE_KEY 相关联的副作用函数
  if (type === TriggerOpTypes.ADD || type == TriggerOpTypes.DELETE) {
    const iterateEffects = depsMap.get(ITERATE_KEY)
    addToRun(iterateEffects)
  }
  if (type === TriggerOpTypes.ADD && Array.isArray(target)) {
    // 当操作类型为 ADD 并且目标对象是数组时， 会修改数组 length，需要执行与 length 关联的副作用函数
    const lengthEffects = depsMap.get('length')
    addToRun(lengthEffects)
  }
  if (Array.isArray(target) && key === 'length') {
    // 对于索引大于或等于新的 length 值的元素，需要触发副作用，因为没有了
    depsMap.forEach((effects, key) => {
      if (key >= newValue) {
        addToRun(effects)
      }
    })
  }

  effectsToRun.forEach((effectFn) => {
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn)
    } else {
      // 否则直接执行副作用函数（之前的默认行为）
      effectFn()
    }
  })
}
