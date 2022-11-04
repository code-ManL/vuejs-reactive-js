

/* <template>
    <!-- 使用 KeepAlive 组件包裹 -->
    <KeepAlive>
        <Tab v-if="currentTab === 1">...</Tab>
        <Tab v-if="currentTab === 2">...</Tab>
        <Tab v-if="currentTab === 3">...</Tab>
    </KeepAlive>
</template> */

// 创建一个容器
const renderer = createRenderer(options)

const KeepAlive = {
    // KeepAlive 组件独有的属性，用作标识 
    __isKeepAlive: true,
    // 定义 include 和 exclude
    props: {
        include: RegExp,
        exclude: RegExp
    },
    setup(props, { slots }) {
        // 创建一个缓存对象
        // key: vnode.type
        // value: vnode
        const cache = new Map()
        // 当前 KeepAlive 组件的实例
        const instance = currentInstance
        // 对于 KeepAlive 组件来说，它的实例上存在特殊的 keepAliveCtx 对象，该对象由渲染器注入
        // 该对象会暴露渲染器的一些内部方法，其中 move 函数用来将一段 DOM 移动到另一个容器中
        const { move, createElement } = instance.keepAliveCtx

        // 创建隐藏容器
        const storageContainer = createElement('div')

        // KeepAlive 组件的实例上会被添加两个内部函数，分别是 _deActivate和 _activate
        // 这两个函数会在渲染器中被调用
        instance._deActivate = (vnode) => {
            move(vnode, storageContainer)
        }
        instance._activate = (vnode, container, anchor) => {
            move(vnode, container, anchor)
        }

        return () => {
            // KeepAlive 的默认插槽就是要被 KeepAlive 的组件
            let rawVNode = slots.default()
            // 如果不是组件，直接渲染即可，因为非组件的虚拟节点无法被 KeepAlive
            if (typeof rawVNode.type !== 'object') {
                return rawVNode
            }

            // 获取“内部组件”的 name
            const name = rawVNode.type.name

            // 对 name 进行匹配
            if (
                name &&
                (
                    // 如果 name 无法被 include 匹配
                    (props.include && !props.include.test(name)) ||
                    // 或者被 exclude 匹配
                    (props.exclude && props.exclude.test(name))
                )
            ) {
                // 则直接渲染“内部组件”，不对其进行后续的缓存操作
                return rawVNode
            }



            // 在挂载时先获取缓存的组件 vnode
            const cachedVNode = cache.get(rawVNode.type)

            if (cachedVNode) {
                // 如果有缓存的内容，则说明不应该执行挂载，而应该执行激活
                // 继承组件实例
                rawVNode.component = cachedVNode.component
                // 在 vnode 上添加 keptAlive 属性，标记为 true，避免渲染器重新挂载它
                rawVNode.keptAlive = true
            } else {
                // 如果没有缓存，则将其添加到缓存中，这样下次激活组件时就不会执行新的挂载动作了
                cache.set(rawVNode.type, rawVNode)
            }

            // 在组件 vnode 上添加 shouldKeepAlive 属性，并标记为 true，避免渲染器真的将组件卸载
            rawVNode.shouldKeepAlive = true
            // 将 KeepAlive 组件的实例也添加到 vnode 上，以便在渲染器中访问
            rawVNode.keepAliveInstance = instance

            // 渲染组件 vnode ，keepAlive包裹的组件
            return rawVNode
        }
    }
}

const Son = {
    name: 'Son',

    // 用 data 函数来定义组件自身的状态
    data() {
        return {
            foo: 'hello world'
        }
    },
    render() {
        return {
            type: 'div',
            children: `foo 的值是: ${this.foo} `, // 在渲染函数内使用组件状态
        }
    }
}

const Father = {
    name: 'Father',
    render() {
        return {
            type: KeepAlive,
            children: {
                default() {
                    return {
                        type: Son,
                        // 动态增加以下属性
                        shouldKeepAlive: true,
                        keptAlive: true,
                        keepAliveInstance: instance1,
                        // instance 身上含有3个新添加的 _deActivate   _activate   keepAliveCtx 属性方法
                        component: instance2
                    }
                },
            },
            component: instance1
        }
    }
}

const vnode = {
    type: Father,
}

renderer.render(vnode, document.querySelector('#app'))

/*
    当 v-if 改变的时候，会重新执行 type:KeepAlive的副作用函数
    然后那个render是 setup 返回的箭头函数，这一次会走缓存
    两次的 subtree 的区别多了一个 keptAlive，不用重新挂载
*/

