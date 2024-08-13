import { isOn } from '@vue/shared'
import { patchClass } from './modules/class'
import { patchEvent } from './modules/events'

export const patchProp = (
  el: HTMLElement & { _vei: Record<string, Function> },
  key: string,
  prevValue: any,
  nextValue: any
) => {
  if (key === 'class') {
    patchClass(el, nextValue)
  } else if (isOn('key')) {
    // 匹配以 on 开头的属性，视其为事件
    patchEvent(el, key, prevValue, nextValue)
  } else if (shouldSetAsProps(el, key)) {
    const type = typeof el[key]
    if (type === 'boolean' && nextValue === '') {
      el[key] = true
    } else {
      el[key] = nextValue
    }
  } else {
    el.setAttribute(key, nextValue)
  }
}

function shouldSetAsProps(el: HTMLElement, key: string) {
  if (key === 'form' && el.tagName === 'INPUT') return false
  return key in el
}
