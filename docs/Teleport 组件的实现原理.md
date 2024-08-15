# 一、Teleport 组件要解决的问题
实际场景中，我们通常会需要<Overlay>蒙层组件，要求“蒙层”能够遮挡页面上的任何元素：
```html
<template>
  <div id="box" style="z-index: -1;">
    <Overlay/>>
  </div>
</template>
```
# 二、实现 Teleport 组件
### 从渲染器中分离
Teleport 组件的实现需要渲染器的底层支持。

但我们要将 Teleport 组件的渲染逻辑从渲染器中分离出来：

- 可以避免渲染器逻辑代码“膨胀”
- 当用户没有使用 Teleport 组件时，可以利用 Tree-Shaking 机制在最终的 bundle 中删除 Teleport 相关的代码。

### 实现 Teleport 要点：
1. 通过 Teleport 组件的process方法处理组件的挂载和更新；
2. 需要渲染器传递给 Teleport 底层的渲染方法 internals，包括 patch、patchChildren、move（用于挂载到指定的容器）
3. 挂载，只需要传入指定的挂载点即可；
4. 更新，如果 to 参数发生变更，则需要对内容进行移动
```ts
export const Teleport = {
  __isTeleport: true,
  process(n1, n2, container, anchor, internals) {
    const { patch, patchChildren, move } = internals
    if (!n1) {
      const target =
        typeof n2.props.to === 'string'
          ? document.querySelector(n2.props.to)
          : n2.props.to
      // 将 n2 渲染指定挂载点即可
      n2.children.forEach((c) => patch(null, c, target, anchor))
    } else {
      patchChildren(n1, n2, container)
      // 如果新旧 to 参数的值不同，则需要对内容进行移动
      if (n2.props.to !== n1.props.to) {
        // 获取新的容器
        const newTarget =
          typeof n2.props.to === 'string'
            ? document.querySelector(n2.props.to)
            : n2.props.to
        // 移动到新的容器
        n2.children.forEach((c) => move(c, newTarget))
      }
    }
  },
}

// # renderer.ts
function patch(){
  ...
  else if (typeof type === 'object' && type.__isTeleport) {
      type.process(n1, n2, container, anchor, {
        patch,
        patchChildren,
        // 用来移动被 Teleport 的内容
        move(vnode, container, anchor) {
          insert(
            // 只考虑了移动组件和普通元素
            vnode.component ? vnode.component.subTree.el : vnode.el,
            container,
            anchor
          )
        },
      })
    }
  ...
}
```