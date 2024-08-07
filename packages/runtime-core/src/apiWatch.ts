import { effect } from '@vue/reactivity'

export function watch(source, callback, options = {}) {
  let getter
  if (typeof source === 'function') {
    getter = source
  } else {
    // 调用 traverse 递归地读取，触发依赖收集
    getter = () => traverse(source)
  }

  let oldValue, newValue

  // 提取 scheduler 调度函数为一个独立的 job 函数
  const job = () => {
    newValue = effectFn()
    callback(newValue, oldValue)
    oldValue = newValue
  }

  // 使用 effect 注册副作用函数时，开启 lazy 选项，并把返回值存储到 effectFn 中以便后续手动调用
  const effectFn = effect(getter, {
    lazy: true,
    // 使用 job 函数作为调度器函数
    scheduler: job,
  })

  if (options.immediate) {
    // 当 immediate 为 true 时立即执行 job，从而触发回调执行
    job()
  } else {
    // 手动调用副作用函数，拿到的值就是旧值
    oldValue = effectFn()
  }
}

function traverse(value, seen = new Set()) {
  // 如果要读取的数据事原始值，或者已经被读取过了
  if (typeof value !== 'object' || value === null || seen.has(value)) return
  // 避免循环引用引起的死循环
  seen.add(value)
  //暂时不考虑数组等其他结构
  // 假设 value 就是一个对象
  for (const k in value) {
    traverse(value[k], seen)
  }
  return value
}
