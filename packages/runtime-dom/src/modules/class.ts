export function patchClass(el: Element, value: string | null): void {
  if (value === null) {
    el.removeAttribute(value)
  } else {
    el.className = value
  }
}
