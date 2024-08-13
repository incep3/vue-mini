let handleError = null
export function callWithErrorHandling(fn) {
  try {
    fn && fn()
  } catch (e) {
    if (handleError) {
      // 将捕获到的错误传递给用户的错误处理程序
      handleError(e)
    }
  }
}

export function registerErrorHandler(fn) {
  handleError = fn
}
