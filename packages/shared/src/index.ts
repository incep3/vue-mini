export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'

const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (target: object, key: string | symbol): boolean =>
  hasOwnProperty.call(target, key)
