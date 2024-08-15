import {
  effect,
  reactive,
  shallowReactive,
  shallowReadonly,
} from '@vue/reactivity'
import { queueJob } from './scheduler'
import { Comment, Fragment, isSameVNodeType, Text, VNode } from './vnode'
import { createAppAPI } from './apiCreateApp'
import { setCurrentInstance } from './component'

export function createRenderer(options) {
  const {
    insert,
    remove,
    patchProp,
    createElement,
    createText,
    createComment,
    setText,
    setElementText,
  } = options

  /**
   * 打补丁（挂载是一种特殊的打补丁操作）
   * @param n1 旧vnode
   * @param n2 新vnode
   * @param container 挂载点/容器
   */
  function patch(n1: VNode | null, n2: VNode | null, container, anchor = null) {
    if (n1 === n2) {
      return
    }

    // 如果 n1 存在，则比较 n1 和 n2 的类型
    if (n1 && !isSameVNodeType(n1, n2)) {
      // 如果新旧 vnode 的类型不同，则直接将旧 vnode 卸载
      // TODO: anchor,应该插入到后面兄弟节点的前面
      unmount(n1)
      n1 = null
    }

    // 代码运行到这里，证明 n1 和 n2 所描述的内容相同
    const { type } = n2
    // 通过 type 属性来区分虚拟节点的类型，采用不同的处理方式来完成挂载和更新（n1不存在，就是mount，n1存在就是patch）
    if (type === Text) {
      processText(n1, n2, container, anchor)
    } else if (type === Comment) {
      processCommentNode(n1, n2, container, anchor)
    } else if (type === Fragment) {
      processFragment(n1, n2, container, anchor)
    } else if (typeof type === 'string') {
      processElement(n1, n2, container, anchor)
    } else if (typeof type === 'object') {
      // vnode.type 的值是选项对象，作为组件来处理
      processComponent(n1, n2, container, anchor)
    } else if (typeof type === 'object' && type.__isTeleport) {
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
    } else {
      // 处理其他类型的 vnode
    }
  }

  const processText = (n1, n2, container, anchor) => {
    // 作为文本节点处理
    if (!n1) {
      n2.el = createText(n2.children)
      insert(n2.el, container)
    } else {
      const el = (n2.el = n1.el)
      if (n2.children !== n1.children) {
        setText(el, n2.children)
      }
    }
  }

  const processCommentNode = (n1, n2, container, anchor) => {
    // 作为注释节点处理
    if (!n1) {
      n2.el = createComment(n2.children)
      insert(n2.el, container)
    } else {
      n2.el = n1.el
      if (n2.children !== n1.children) {
        setText(n2.el, n2.children)
      }
    }
  }

  const processFragment = (n1, n2, container, anchor) => {
    // 作为片段处理
    if (!n1) {
      // @ts-ignore
      n2.children.forEach((c) => patch(null, c, container))
    } else {
      patchChildren(n1, n2, container)
    }
  }

  const processElement = (n1, n2, container, anchor) => {
    // 作为普通元素处理
    if (!n1) {
      // 如果 n1 不存在，意味着挂载，则调用 mountElement 函数完成挂载
      mountElement(n2, container)
    } else {
      // n1 存在，意味着打补丁
      patchElement(n1, n2)
    }
  }

  const processComponent = (n1, n2, container, anchor) => {
    if (!n1) {
      mountComponent(n2, container, anchor)
    } else {
      console.log('[组件 patch]')
      patchComponent(n1, n2, anchor)
    }
  }

  function mountElement(vnode: VNode, container) {
    // 创建 DOM 元素
    // @ts-ignore
    const el = (vnode.el = createElement(vnode.type))

    // 如果 vnode.props 存在才处理它
    if (vnode.props) {
      // 遍历 vnode.props
      for (const key in vnode.props) {
        patchProp(el, key, null, vnode.props[key])
      }
    }

    if (typeof vnode.children === 'string') {
      setElementText(el, vnode.children)
    } else if (Array.isArray(vnode.children)) {
      // 如果 children 是数组，则遍历每一个子节点，并调用 patch 函数挂载它们
      vnode.children.forEach((child) => {
        patch(null, child, el)
      })
    }

    insert(el, container)
  }

  function patchElement(n1, n2) {
    const el = (n2.el = n1.el)

    const oldProps = n1.props
    const newProps = n2.props

    for (const key in newProps) {
      patchProp(el, key, oldProps[key], newProps[key])
    }

    for (const key in oldProps) {
      if (!(key in newProps)) {
        patchProp(el, key, oldProps[key], null)
      }
    }

    patchChildren(n1, n2, el)
  }

  function mountComponent(vnode, container, anchor) {
    let componentOptions = vnode.type
    let {
      render,
      data,
      props: propsOption,
      setup,
      beforeCreate,
      created,
      beforeMount,
      mounted,
      beforeUpdate,
      updated,
    } = componentOptions

    // 在这里调用 beforeCreate 钩子
    beforeCreate && beforeCreate()

    const state = reactive(data?.())
    const [props, attrs] = resolveProps(propsOption, vnode.props)

    // 直接使用编译好的 vnode.children 对象作为 slots 对象即可
    const slots = vnode.children || {}

    // 定义组件实例，一个组件实例本质上就是一个对象，它包含与组件相关的状态信息
    const instance = {
      // 组件自身的数据，即 data
      state,
      props: shallowReactive(props),
      isMounted: false,
      // 组件所渲染的内容，即子树（subTree）
      subTree: null,
      slots,
      mounted: [],
    }

    function emit(event: string, ...payload) {
      const eventName = `on${event[0].toUpperCase() + event.slice(1)}`
      const handler = instance.props[eventName]
      if (handler) {
        handler(...payload)
      } else {
        console.error('事件不存在')
      }
    }

    let setupState = null
    if (setup) {
      const setupContext = { attrs, emit, slots }
      // 在调用 setup 函数之前，设置当前组件实例
      setCurrentInstance(instance)
      const setupResult = setup(shallowReadonly(instance.props), setupContext)
      // 在 setup 函数执行完毕之后，重置当前组件实例
      setCurrentInstance(null)
      if (typeof setupResult === 'function') {
        // 1. setup 返回一个函数，该函数将作为组件的渲染函数
        if (render) console.error('setup 函数返回渲染函数，render 选项将被忽略')
        render = setupResult
      } else {
        // 2. setup 返回一个对象，该对象中包含的数据将暴露给模版使用
        setupState = setupResult
      }
    }

    // 将组件实例设置到 vnode 上，用于后续更新
    vnode.component = instance

    // 由于 props 数据与组件自身的状态数据都需要暴露到渲染函数中，并使得渲染函数能够通过 this 访问它们，因此我们需要封装一个渲染上下文对象
    // 创建渲染上下文对象，本质上是组件实例的代理
    const renderContext = new Proxy(instance, {
      get(target, key, receiver) {
        const { state, props } = target
        if (key === '$slots') {
          return slots
        } else if (state && key in state) {
          return state[key]
        } else if (key in props) {
          //如果组件自身没有该数据，则尝试从 props 中读取
          return props[key]
        } else if (setupState && setupState[key]) {
          return setupState[key]
        } else {
          console.error('不存在')
        }
      },
      set(target, key, newValue, receiver) {
        const { state, props } = target
        if (state && key in state) {
          state[key] = newValue
        } else if (key in props) {
          console.warn(
            `Attempting to mutate prop "${String(key)}". Props are readonly.`
          )
        } else if (setupState) {
          setupState[key] = newValue
        } else {
          console.error('不存在')
        }
        return true
      },
    })

    // 在这里调用 created 钩子
    created && created.call(renderContext)

    effect(
      () => {
        // 调用组件的渲染函数，获得子树
        const subTree = render.call(renderContext, renderContext)
        // # 注：未处理 subTree 为 [] 的情况
        if (!instance.isMounted) {
          beforeMount && beforeMount.call(renderContext)
          patch(null, subTree, container, anchor)
          // 重点：将组件实例的 isMounted 设置为 true，这样当更新发生时就不会再次进行挂载操作，
          // 而是会执行更新
          instance.isMounted = true
          mounted && mounted.call(renderContext)
        } else {
          beforeUpdate && beforeUpdate.call(renderContext)
          // 使用新的子树与上一次渲染的子树进行打补丁操作
          patch(instance.subTree, subTree, container, anchor)
          updated && updated.call(renderContext)
        }
        // 更新组件实例的子树
        instance.subTree = subTree
      },
      {
        scheduler: queueJob,
      }
    )
  }

  /**
   *
   * @param options 组件选项对象中定义的 props 选项，即 MyComponent.props 对象
   * @param propsData 为组件传递的 props 数据，即组件的 vnode.props 对象
   */
  function resolveProps(options, propsData) {
    let props = {}
    const attrs = {}
    for (const key in propsData) {
      if (key in options || key.startsWith('on')) {
        // 如果为组件传递的 props 数据在组件自身的 props 选项中有定义，则将其视为合法的 props
        props[key] = propsData[key]
      } else {
        // 否则将其作为 attrs
        attrs[key] = propsData[key]
      }
    }

    props = { ...options, ...props }
    return [props, attrs]
  }

  function patchComponent(n1, n2, anchor) {
    const instance = (n2.component = n1.component)
    const { props } = instance
    // 调用 hasPropsChanged 检测为子组件传递的 props 是否发生变化，如果没有变化，则不需要更新
    if (hasPropsChanged(n1.props, n2.props)) {
      const [nextProps] = resolveProps(n2.type.props, n2.props)
      // 更新 props
      for (const k in nextProps) {
        props[k] = nextProps[k]
      }
      for (const k in props) {
        if (!(k in nextProps)) delete props[k]
      }
      console.log(props)
    }
  }
  function hasPropsChanged(prevProps, nextProps) {
    const nextKeys = Object.keys(nextProps)
    if (nextKeys.length !== Object.keys(prevProps).length) {
      return true
    }
    for (let i = 0; i < nextKeys.length; i++) {
      const key = nextKeys[i]
      if (nextProps[key] !== prevProps[key]) return true
    }
    return false
  }

  function unmount(vnode: VNode) {
    if (vnode.type === Fragment) {
      // @ts-ignore
      vnode.children.forEach((c) => unmount(c))
      return
    }

    remove(vnode.el)
  }

  function patchChildren(n1: VNode, n2: VNode, container) {
    if (typeof n2.children === 'string') {
      if (Array.isArray(n1.children)) {
        n1.children.forEach((c) => unmount(c))
      }
      setElementText(container, n2.children)
    } else if (Array.isArray(n2.children)) {
      if (Array.isArray(n1.children)) {
        n1.children.forEach((c) => unmount(c))
        n2.children.forEach((c) => patch(null, c, container))
      } else {
        setElementText(container, '')
        n2.children.forEach((c) => patch(null, c, container))
      }
    } else {
      // n2 为空，则卸载 n1
      if (Array.isArray(n1.children)) {
        n1.children.forEach((child) => {
          unmount(child)
        })
      } else {
        setElementText(container, '')
      }
    }
  }

  /**
   *
   * @param vnode
   * @param container 挂载点
   */
  function render(vnode, container: HTMLElement & { _vnode: any }) {
    if (!vnode) {
      if (container._vnode) {
        // 旧 vnode 存在，且新 vnode 不存在，说是卸载（unmount）操作
        unmount(container._vnode)
      }
    } else {
      // 新 vnode 存在，将其与旧 vnode 一起传递给 patch 函数，进行打补丁
      patch(container._vnode, vnode, container)
    }
    // 把 vnode 存储到 container.vnode 下，即后续渲染中的旧 vnode
    container._vnode = vnode
  }

  return { render, createApp: createAppAPI(render) }
}
