export function patchEvent(el, key, prevValue, nextValue) {
  const invokers = el._vei || (el._vei = {})
  let invoker = invokers[key]
  // 根据属性名称得到对应的事件名称，例如 onClick ---> click
  const name = key.slice(2).toLowerCase()
  if (nextValue) {
    if (!invoker) {
      invoker = el._vei[key] = (e: Event) => {
        // e.timeStamp 是事件发生的事件
        // 如果事件发生的事件早于事件处理函数绑定的时间，则不执行时间处理函数
        // @ts-ignore
        if (e.timeStamp < invoker.attached) {
          return
        }
        // @ts-ignore
        if (Array.isArray(invoker.value)) {
          // @ts-ignore
          invoker.value.forEach((fn) => fn(e))
        } else {
          // @ts-ignore
          invoker.value(e)
        }
      }
      // @ts-ignore
      invoker.value = nextValue
      // @ts-ignore
      invoker.attached = performance.now()
      // @ts-ignore
      el.addEventListener(name, invoker)
    } else {
      // @ts-ignore
      invoker.value = nextValue
    }
  } else {
    // @ts-ignore
    el.removeEventListener(name, invoker)
  }
}
