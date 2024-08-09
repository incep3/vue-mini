export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'
export const isString = (val: unknown): val is string => typeof val === 'string'
export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'

const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (
  val: object,
  key: string | symbol
): key is keyof typeof val => hasOwnProperty.call(val, key)

// compare whether a value has changed, accounting for NaN.
// 封装 hasChanged 方法，更加语义化
export function hasChanged(value: any, oldValue: any): boolean {
  return !Object.is(value, oldValue)
}

export function def(
  obj: object,
  key: string | symbol,
  value: any,
  writable: boolean = false
) {
  return Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    writable,
    value,
  })
}