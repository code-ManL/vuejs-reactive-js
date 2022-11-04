import { effect } from '../source/effect.js'

const Text = Symbol()
const Comment = Symbol()
const Fragment = Symbol()

// 任务缓存队列，用一个 Set 数据结构来表示，这样就可以自动对任务进行去重
const queue = new Set()

// 一个标志，代表是否正在刷新任务队列
let isFlushing = false

// 创建一个立即 resolve 的 Promise 实例
const p = Promise.resolve()

// 调度器的主要函数，用来将一个任务添加到缓冲队列中，并开始刷新队列 job是要重新执行的某个属性所追踪的副作用函数，queue用来存放所有依赖属性需要去重新执行的副作用函数
function queueJob(job) {
    // 将 job 添加到任务队列 queue 中
    queue.add(job)
    // 如果还没有开始刷新队列，则刷新之
    if (!isFlushing) {
        // 将该标志设置为 true 以避免重复刷新
        isFlushing = true
        // 在微任务中刷新缓冲队列
        p.then(() => {
            try {
                // 执行任务队列中的任务
                queue.forEach(job => job())
            } finally {
                // 重置状态
                isFlushing = false
                queue.clear = 0
            }
        })
    }
}

function shouldSetAttribute(el, key, value) {
    // 特殊处理
    if (key === 'form' && el.tagName === 'INPUT')
        return false
    return key in el
}

function patchClass(el, value) {

    const transitionClasses = el._vtc
    if (transitionClasses) {
        value = (
            value ? [value, ...transitionClasses] : [...transitionClasses]
        ).join(' ')
    }
    if (value == null) {
        el.removeAttribute('class')
    } else {
        el.className = value
    }
}

export const options = {
    createElemnt(tag) {
        return document.createElement(tag)
    },
    setElementText(el, text) {
        el.textContent = text
    },
    insert(el, parent, anchor = null) {
        parent.insertBefore(el, anchor)
    },
    creatText(text) {
        return document.createTextNode(text)
    },
    setText(el, text) {
        el.nodeValue = text
    },
    creatComment(text) {
        return document.creatComment(text)
    },
    setComment(el, text) {
        el.nodeValue = text
    },
    // 将属性相关操作封装到 patchProps 函数中，并作为渲染器选项传递  同时具备 初始化 和 更新 的功能
    patchProps(el, key, preValue, nextValue) {

        // 匹配以 on 开头的属性，视其为事件
        if (/^on/.test(key)) {
            // 获取该元素伪造的事件处理函数 invoker
            const invokers = el._vei || (el._vei = {})
            let invoker = invokers[key]
            // 根据属性名称得到对应的事件名称，例如 onClick ---> click
            const name = key.slice(2).toLowerCase()
            // 如果传来来了真实绑定事件
            if (nextValue) {
                // 如果没有 invoker,则将一个伪造的 invoker 缓存到 el.vei中
                if (!invoker) {
                    // vei 是 vue event invoker 缩写
                    invoker = el._vei[key] = (e) => {

                        // e.timeStamp 是事件发生的时间  事件 冒泡的e不变
                        // 如果事件发生的时间早于事件处理函数绑定的时间，则不执行事件处理函数
                        if (e.timeStamp < invoker.attached)
                            return

                        // 如果invoker.value 是数组，则遍历它并逐个调用事件处理函数
                        if (Array.isArray(invoker.value)) {
                            // 当伪造的事件处理函数执行时，会执行真正的事件处理函数
                            invoker.value.forEach(fn => fn(e))
                        } else {
                            // 否则直接调用
                            invoker.value(e)
                        }
                    }
                    // 将正真的事件处理函数赋值给 invoker.value
                    invoker.value = nextValue

                    // 添加 invoker.attached 属性，存储事件处理函数绑定的时间
                    invoker.attached = performance.now()

                    // 绑定事件，nextValue 为事件处理函数
                    el.addEventListener(name, invoker)
                } else {
                    // 如果 invoker 存在，意味着更新，并且只更新 invoker.value 的值即可
                    invoker.value = nextValue
                }
            } else if (invoker) {
                // 新的事件绑定函数不存在，且之前绑定的invoker存在，则移除绑定
                el.removeEventListener(name, invoker)
            }
        }
        // 对 class 进行特殊处理
        else if (key === 'class') {
            // patchClass(el, nextValue)
            el.className = nextValue || ''
        } else if (shouldSetAttribute(el, key, nextValue)) {
            // 获取该 DOM Properties 的类型
            const type = typeof el[key]

            // 如果是布尔类型，并且 value 是空字符串，则将值矫正为 true
            if (type === 'boolean' && nextValue === '') {
                el[key] = true
            }
            else {
                el[key] = nextValue
            }
        } else {
            // 如果要设置的属性没有对应的 DMO Properties，则使用 setAttribute 函数来设置
            el.setAttribute(key, nextValue)
        }
    }
}

// 全局变量，存储当前正在被初始化的组件实例
let currentInstance = null

// 该方法接收组件实例作为参数，并将该实例设置为 currentInstance
function setCurrentInstance(instance) {
    currentInstance = instance
}

export function onBeforeMounted(fn) {
    if (currentInstance) {
        // 将生命周期函数添加到 instance.mounted 数组中
        currentInstance.beforeMount.push(fn)
    } else {
        console.error('onMounted 函数只能在 setup 中调用')
    }
}

export function onMounted(fn) {
    if (currentInstance) {
        // 将生命周期函数添加到 instance.mounted 数组中
        currentInstance.mounted.push(fn)
    } else {
        console.error('onMounted 函数只能在 setup 中调用')
    }
}

export function onBeforeUpdate(fn) {
    if (currentInstance) {
        // 将生命周期函数添加到 instance.mounted 数组中
        currentInstance.beforeUpdate.push(fn)
    } else {
        console.error('onMounted 函数只能在 setup 中调用')
    }
}

export function onUpdated(fn) {
    if (currentInstance) {
        // 将生命周期函数添加到 instance.mounted 数组中
        currentInstance.updated.push(fn)
    } else {
        console.error('onMounted 函数只能在 setup 中调用')
    }
}

export function onBeforeUnmount(fn) {
    if (currentInstance) {
        // 将生命周期函数添加到 instance.mounted 数组中
        currentInstance.beforeUnmount.push(fn)
    } else {
        console.error('onMounted 函数只能在 setup 中调用')
    }
}

export function onUnmounted(fn) {
    if (currentInstance) {
        // 将生命周期函数添加到 instance.mounted 数组中
        currentInstance.unmounted.push(fn)
    } else {
        console.error('onMounted 函数只能在 setup 中调用')
    }
}

export function defineAsyncComponent(options) {
    if (typeof options === 'function') {
        options = {
            loader: options
        }
    }

    const { loader } = options


    // 存放异步加载的组件
    let InnerComp = null

    // 记录重试次数
    let retries = 0
    // 封装 load 函数用来加载异步组件
    function load() {
        return loader()
            // 捕获加载器的错误
            .catch((err) => {
                // 如果用户指定了 onError 回调，则将控制权交给用户
                if (options.onError) {
                    // 返回一个新的 Promise 实例
                    return new Promise((resolve, reject) => {
                        // 重试
                        const retry = () => {
                            resolve(load())
                            retries++
                        }
                        // 失败
                        const fail = () => reject(err)
                        // 作为 onError 回调函数的参数，让用户来决定下一步怎么做
                        options.onError(retry, fail, retries)
                    })
                } else {
                    throw error
                }
            })
    }

    return {
        name: 'AsyncComponentWrapper',
        setup() {
            // 判断异步足迹是否加载完成
            const loaded = ref(false)

            // 判断是否超时 或 报错
            const error = shallowRef(null)

            // 一个标志，代表是否正在加载，默认为 false
            const loading = ref(false)

            let loadingTimer = null

            // 如果配置项中存在 delay，则开启一个定时器计时，当延迟到时后将loading.value 设置为 true
            if (options.delay) {
                loadingTimer = setTimeout(() => {
                    loading.value = true
                }, options.delay);
            } else {
                // 如果配置项中没有 delay，则直接标记为加载中
                loading.value = true
            }

            // 调用 load 函数加载组件
            load().then(c => {
                InnerComp = c
                // 加载完成
                loaded.value = true
            })
                .catch((err) => error.value = err)
                .finally(() => {
                    // 无论加载成功还是失败最后都是加载完毕了
                    loading.value = false
                    // 加载完毕后，无论成功与否都要清除延迟定时器
                    clearTimeout(loadingTimer)
                })

            let timer = null
            if (options.timeout) {
                // 如果制定了超时时长，则开一个定时器
                timer = setTimeout(() => {
                    const err = new Error(`Async component timed out after${options.timeout}ms.`)
                    // 超时后将 timeout 设置为true
                    error.value = err
                }, options.timeout)
            }

            // 占位内容,也就是加载中内容
            const placeholder = { type: Text, children: '' }

            return () => {
                if (loaded.value) {
                    // 如果异步组件加载成功 返回他的vnode等待渲染
                    return { type: InnerComp }
                } else if (error.value && options.errorComponent) {
                    // 如果超时 或 报错了,如果用户传递了 Error 组件就使用它
                    return { type: options.errorComponent, props: { error: error.value } }
                } else if (loading.value && options.loadingComponent) {
                    // 如果异步组件正在加载，并且用户指定了 Loading 组件，则渲染Loading 组件
                    return { type: options.loadingComponent }
                } else {
                    // 默认占位组件
                    return placeholder
                }
            }
        }
    }
}

export function createRenderer(options) {
    // 抽离出通用 API
    const { createElemnt, insert, setElementText, patchProps, setComment } = options

    function patch(n1, n2, container, anchor) {

        // 如果存在 n1 ,对比 n1 和 n2 的类型
        if (n1 && n1.type !== n2.type) {
            // 如果新旧 n2 的类型不同，则直接将旧 n2 卸载
            unmount(n1)
            n1 = null
        }

        // 运行到这里，证明 n1 和 n2 所描述的内容相同
        const { type } = n2

        // 如果 n2.type 的值是字符串类型，则它描述的是普通标签元素
        if (typeof type === 'string') {
            // 如果 n1 不存在，意味着挂载，则调用 mountElment 函数完成挂载
            if (!n1) {
                // 挂载时将锚点元素作为第三个参数传递给 mountElement 函数
                mountElement(n2, container, anchor)
            } else {
                // 更新
                patchElement(n1, n2)
            }
        } else if (type === Text) {
            // 如果 n1 不存在，意味着挂载，则进行挂载
            if (!n1) {
                // 调用 creatText 函数创建文本节点
                const el = n2.el = creatText(n2.children)
                insert(el, container)
            } else {
                // 如果旧n2 存在，只需要使用新文本节点的文本内容更新旧文本节点即可
                const el = n2.el = n1.el
                if (n2.children !== n1.children) {
                    // 调用setText 函数更新文本节点的内容
                    setText(el, n2.children)
                }
            }
        } else if (type === Comment) {
            // 如果 n1 不存在，意味着挂载，则进行挂载
            if (!n1) {
                // 调用 creatText 函数创建注释节点
                const el = n2.el = creatComment(n2.children)
                insert(el, container)

            } else {
                // 如果旧n2 存在，只需要使用新注释节点的文本内容更新旧注释节点即可
                const el = n2.el = n1.el
                if (n2.children !== n1.children) {
                    // 调用setText 函数更新文本节点的内容
                    setComment(el, n2.children)
                }
            }
        } else if (type === Fragment) {
            if (n1) {
                // 如果旧n2 不存在，则只需要将Fragment 的 children 逐个挂载即可
                n2.children.forEach(c => {
                    patch(null, c, container)
                })
            } else {
                // 如果旧n2 存在，则只需要更新 Fragment 的 children 即可
                patchChildren(n1, n2, container)
            }

        } else if (typeof type === 'object' && type.__isTeleport) {
            // 组件选项中如果存在 __isTeleport 标识，则它是 Teleport 组件，
            // 调用 Teleport 组件选项中的 process 函数将控制权交接出去
            // 传递给 process 函数的第五个参数是渲染器的一些内部方法
            type.process(n1, n2, container, anchor, {
                patch,
                patchChildren,
                // 用来移动被 Teleport 的内容
                move(vnode, container, anchor) {
                    insert(
                        vnode.component
                            ? vnode.component.subTree.el // 移动一个组件
                            : vnode.el, // 移动普通元素
                        container,
                        anchor
                    )
                }
            })
        }
        else if (typeof type === 'object' || typeof type === 'function') {
            // 如果n2.type 的值的类型是对象，则它描述的是组件
            if (!n1) {
                // 如果该组件已经被 KeepAlive，则不会重新挂载它，而是会调用_activate 来激活它
                if (n2.keptAlive) {
                    n2.keepAliveInstance._activate(n2, container, anchor)
                } else {
                    mountComponent(n2, container, anchor)
                }
            } else {
                // 更新组件 完成子组件的更新，由父组件自更新引起的子组件的被动更新
                patchComponent(n1, n2, anchor)
            }
        } else if (typeof type === 'xxx') {
            // others
        }
    }

    // resolveProps 函数用于解析组件 props 和 attrs 数据
    function resolveProps(options, propsData) {
        const props = {}
        const attrs = {}
        // 遍历为组件传递的 props 数据
        for (const key in propsData) {
            // 以字符串 on 开头的 props，无论是否显示声明，都将其添加到 props 数据中，而不是添加到 attrs 中
            /**
             *  因此这里有个注意的地方就是，如果是自定义事件，因为没有显示声明我们会主动的放在 props 当中，以这样的方式声明 change -> onChange
             *  但是如果我们如果是通过 props 传递的函数过来，这个时候就需要手动的声明来确定是否存放到 props 当中
             */
            if (key in options || key.startsWith('on')) {
                // 如果为组件传递的 props 数据在组件自身的 props 选项中有定义，则将其视为合法的 props
                props[key] = propsData[key]
            } else {
                // 否则将其作为 attrs
                attrs[key] = propsData[key]
            }
        }

        // 最后返回 props 与 attrs 数据
        return [props, attrs]
    }

    // 更新组件
    function patchComponent(n1, n2, anchor) {
        // 获取组件实例，即 n1.component，同时让新的组件虚拟节点 n2.component也指向组件实例
        const instance = (n2.component = n1.component)
        // 获取当前的 props 数据
        const { props } = instance
        // 调用 hasPropsChanged 检测为子组件传递的 props 是否发生变化，如果没有变化，则不需要更新
        if (hasPropsChanged(n1.props, n2.props)) {
            // 调用 resolveProps 函数重新获取 props 数据
            const [nextProps] = resolveProps(n2.type.props, n2.props)
            // 更新 props
            for (const k in nextProps) {
                props[k] = nextProps[k]
            }
            // 删除不存在的 props
            for (const k in props) {
                if (!(k in nextProps))
                    delete props[k]
            }
        }
    }

    // 判断 props 是否发生变化
    function hasPropsChanged(prevProps, nextProps) {
        const nextKeys = Object.keys(nextProps)
        // 如果新旧 props 的数量变了，则说明有变化
        if (nextKeys.length !== Object.keys(prevProps).length) {
            return true
        }
        // 只有
        for (let i = 0; i < nextKeys.length; i++) {
            const key = nextKeys[i]
            // 有不相等的 props，则说明有变化
            if (nextProps[key] !== prevProps[key]) return true
        }
        return false
    }

    // 挂载组件
    function mountComponent(vnode, container, anchor) {

        // 检查是否是函数是组件
        const isFunctional = typeof vnode.type === 'function'

        const componentOptions = vnode.type

        // 如果是函数式组件
        if (isFunctional) {
            componentOptions = {
                render: vnode.type,
                props: vnode.type.props
            }
        }


        // 从组件选项对象中取得组件的生命周期函数
        const { render, data, setup, beforeCreate, created,
            props: propsOption } = componentOptions

        // 在这里调用 beforeCreate 钩子
        beforeCreate && beforeCreate()

        // 用于产生依赖关系，访问 data 当中属性实现响应式重新渲染界面
        const state = data ? reactive(data()) : null

        // 调用 resolveProps 函数解析出最终的 props 数据与 attrs 数据
        const [props, attrs] = resolveProps(propsOption, vnode.props)


        // 直接使用编译好的 vnode.children 对象作为 slots 对象即可
        const slots = vnode.children || {}


        // 定义组件实例，一个组件实例本质上就是一个对象，它包含与组件有关的状态信息
        const instance = {
            // 组件自身的状态数据，即 data
            state,
            // 将解析出的 props 数据包装为 shallowReactive 并定义到组件实例上
            props: shallowReactive(props),
            // 一个布尔值，用来表示组件是否已经被挂载，初始值为 false
            isMounted: false,
            // 组件所渲染的内容，即子树（subTree）
            subTree: null,
            // 将插槽添加到组件实例上
            slots,
            // 在组件实例中添加 mounted 数组，用来存储通过 onMounted 函数注册的生命周期钩子函数
            mounted: [],
            // 只有 keepAlive 的组件的实例下会有 keepAliveCtx 属性
            keepAliveCtx: null
        }


        // 检查当前要挂载的组件是否是 KeepAlive 组件
        const isKeepAlive = vnode.type.__isKeepAlive

        if (isKeepAlive) {
            // 在 KeepAlive 组件实例上添加 keepAliveCtx 对象
            instance.keepAliveCtx = {
                // move 函数用来移动一段 vnode
                move(vnode, container, anchor) {
                    // 本质上是将组件渲染的内容移动到指定容器中，即隐藏容器中
                    insert(vnode.component.subTree.el, container, anchor)
                },
                createElement
            }
        }


        // 定义 emit 函数，接受2个参数
        /**
         * emit 的触发实际上也是借助的 props 来实现的
         * 最后这个emit函数会传给 setup 函数，通过 setupContext 可以获取到这个方法
         *     注意：方法运行的位置实际上是方法声明的位置，然后作用域链也是根据方法声明的位置来看的
         * @param {Event} event - 事件名称.
         * @param {string} paylod - 传递事件处理函数的参数.
        */
        function emit(event, ...payload) {
            // 根据约定对事件名称进行处理，例如 change --> onChange
            const eventName = `on${event[0].toUpperCase() + event.slice(1)}`

            // 根据处理后的事件名称去 props 中寻找对应的事件处理函数
            // 注意：如果子组件没有显示的声明为props的属性会存储到attrs中，因此这里拿不到，需要修改 resolveProps 函数
            const handler = instance.props[eventName]

            if (handler) {
                // 调用事件处理函数并传递参数
                handler(...payload)
            } else {
                console.error('事件不存在')
            }
        }


        // setupContext 传入给 setup 函数的第二个参数，执行上下文
        const setupContext = { attrs, emit, slots }

        // 在调用 setup 函数之前，设置当前组件实例
        setCurrentInstance(instance)

        // 调用 setup 函数，将只读版本的 props 作为第一个参数传递，避免用户意外地修改 props 的值，
        // 将 setupContext 作为第二个参数传递
        const setupResult = setup(shallowReadonly(instance.props), setupContext)

        // 在 setup 函数执行完毕之后，重置当前组件实例
        setCurrentInstance(null)


        // setupState 用来存储由 setup 返回的数据
        let setupState = null


        // 如果 setup 函数的返回值是函数，则将其作为渲染函数
        if (typeof setupResult === 'function') {
            // 报告冲突
            if (render) {
                console.error('setup 函数返回渲染函数，render 选项将被忽略')
            }
            // 将 setupResult 作为渲染函数
            render = setupResult
        } else {
            // 如果 setup 的返回值不是函数，则作为数据状态赋值给 setupState ,这个对象当中的属性按照正常的语法来说都是用响应式函数声明的变量
            setupState = setupResult
        }

        // 将组件实例设置到 vnode 上，用于后续更新
        vnode.component = instance

        // 创建渲染上下文对象，本质上是组件实例的代理,如果不用代理的话，剩下的this都是state，那么就只暴露了data数据，而props数据和data数据都应该暴露
        const renderContext = new Proxy(instance, {

            get(t, k, r) {
                // 取得组件自身状态与 props 数据
                const { state, props, slots } = t

                // 当 k 的值为 $slots 时，直接返回组件实例上的 slots
                if (k === '$slots') return slots

                // 先尝试读取自身状态数据
                // 面向vue2的响应式数据
                if (state && k in state) {
                    return state[k]
                } else if (k in props) { // 如果组件自身没有该数据，则尝试从props 中读取
                    return props[k]
                }

                // 面向vue3的响应式数据 setup 返回的这个对象当中的每一个属性按照正常语法都是响应式声明的变量
                else if (setupState && k in setupState) {
                    // 渲染上下文需要增加对 setupState 的支持
                    return setupState[k]
                } else {
                    console.error('不存在')
                }
            },

            set(t, k, v, r) {
                const { state, props } = t
                if (state && k in state) {
                    state[k] = v
                } else if (k in props) {
                    console.warn(`Attempting to mutate prop "${k}". Propsare readonly.`)
                } else if (setupState && k in setupState) {
                    // 渲染上下文需要增加对 setupState 的支持
                    setupState[k] = v
                } else {
                    console.error('不存在')
                }
            }
        })

        // 在这里调用 created 钩子
        created && created.call(renderContext)


        // 将组件的 render 函数调用包装到 effect 内
        // 渲染环境
        effect(() => {
            // 调用组件的渲染函数，获得子树 renderContext 这个上下文对象间接的可以访问data setup props 返回的数据
            // 只不过 data 和 props 是通过 tagret，也就是 instance 实例上读取的，而 setup 返回的对象没有挂载在实例上，直接在这里缓存到setupState当中去获取
            // 由于当中的变量按照正常语法都是响应式声明的属性，因此也可以产生依赖关系，数据发生变化也能进行页面的重新渲染，而 props 只能通过父组件使子组件被动更新
            const subTree = render.call(renderContext, state)

            // 检查组件是否已经被挂载
            if (!instance.isMounted) {

                // 在这里调用 beforeMount 钩子  
                /**
                 * 注意看，这一行代码的执行位置是在调用render渲染函数得到subTree执行的，我们此时知识得到了 虚拟dom，
                 * 但是执行了setup函数和render函数，通过renderContext建立了响应式了！
                 */
                instance.beforeMount && instance.beforeMount.call(renderContext)
                patch(null, subTree, container, anchor)
                instance.isMounted = true

                // 在这里调用 mounted 钩子 这里是让 setup 函数中的数据产生依赖关系
                instance.mounted && instance.mounted.forEach(hook => hook.call(renderContext))

            } else {
                // 在这里调用 beforeUpdate 钩子
                instance.beforeUpdate && instance.beforeUpdate.forEach(hook => hook.call(renderContext))

                // 当 isMounted 为 true 时，说明组件已经被挂载，只需要完成自更新即可，
                // 所以在调用 patch 函数时，第一个参数为组件上一次渲染的子树，
                // 意思是，使用新的子树与上一次渲染的子树进行打补丁操作
                patch(instance.subTree, subTree, container, anchor)

                // 在这里调用 updated 钩子
                insta&& insnce.updated tance.updated.call(renderContext)
            }
            // 更新组件实例的子树
            instance.subTree = subTree
        }, { scheduler: queueJob })
    }

    // 更新子节点
    function patchChildren(n1, n2, container) {
        // 判断新子节点的类型是否是文本节点
        if (typeof n2.children === 'string') {
            // 旧子节点有三种可能:没有子节点,文本子节点,数组节点
            // 只有当旧子节点为一组子节点时,才需要逐个卸载,其他情况下什么都不需要做
            if (Array.isArray(n1.children)) {
                n1.children.forEach((c) =>
                    unmount(c)
                )
            }
            // 最后将新的文本节点内容设置给元素
            setElementText(container, n2.children)
        } else if (Array.isArray(n2.children)) {

            // 这里需要 diff 算法
            if (Array.isArray(n1.children)) {
                // 说明新子节点是一个数组
                // 封装 patchKeyedChildren 函数处理两组子节点
                // 如果不是 v-for 出来的呢
                patchKeyedChildren(n1, n2, container)
            } else {
                /*
                    此时:
                    旧子节点只能是文本节点或者没有内容
                    无论哪种情况只需要清空,再重新将数组当中的属性逐一挂载就可以了
                */
                setElementText(container, '')
                n2.children.forEach(c =>
                    patch(null, c, container)
                )
            }
        } else {
            // 到这里的时候,说明新的子节点不存在
            // 旧子节点是一组子节点时,逐一卸载
            if (Array.isArray(n1.children)) {
                n1.children.forEach((c) =>
                    unmount(c)
                )
            }
            // 如果旧子节点是字符串
            else if (typeof n1.children === 'string') {
                setElementText(container, '')
            }
            /*
                 如果什么都没有，就不需要做，这里也体现出细节，其实我们不判断旧子节点是不是字符串，直接最后 setElementText(container, '') 也可以，还可以少一个判断
                 但是值得注意的是，如果本身什么都没有，还进行了  el.textContent = text 的操作，这个是 DOM级别的运算，相比于js层面的判断计算量要大很多
            */
        }
    }

    function patchKeyedChildren(n1, n2, container) {
        const newChildren = n2.children
        const oldChildren = n1.children

        // 更新相同的前置节点
        let j = 0
        let oldVNode = oldChildren[j]
        let newVNode = newChildren[j]
        while (oldVNode.key === newVNode.key) {
            patch(oldVNode, newVNode, container)
            j++
            oldVNode = oldChildren[j]
            newVNode = newChildren[j]
        }

        // 更新相同的后置节点
        // 索引 oldEnd 指向旧的一组子节点的最后一个节点
        let oldEnd = oldChildren.length - 1
        // 索引 newEnd 指向新的一组子节点的最后一个节点
        let newEnd = newChildren.length - 1

        oldVNode = oldChildren[oldEnd]
        newVNode = newChildren[newEnd]

        // while 循环从后向前遍历，直到遇到拥有不同 key 值的节点为止
        while (oldVNode.key === newVNode.key) {
            // 调用 patch 函数进行更新
            patch(oldVNode, newVNode, container)
            // 递减 oldEnd 和 nextEnd
            oldEnd--
            newEnd--
            oldVNode = oldChildren[oldEnd]
            newVNode = newChildren[newEnd]
        }

        // 预处理完毕后，如果满足如下条件，则说明从 j --> newEnd 之间的节点应作
        if (j > oldEnd && j <= newEnd) {
            // 锚点的索引
            const anchorIndex = newEnd + 1
            // 锚点元素
            const anchor = anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null
            // 采用 while 循环，调用 patch 函数逐个挂载新增节点
            while (j <= newEnd) {
                patch(null, newChildren[j++], container, anchor)
            }
        } else if (j > newEnd && j <= oldEnd) {
            // j -> oldEnd 之间的节点应该被卸载
            while (j <= oldEnd) {
                unmount(oldChildren[j++])
            }
        } else {
            // 构造 source 数组
            const count = newEnd - j + 1
            const source = new Array(count)
            source.fill(-1)

            const oldStart = j
            const newStart = j
            let moved = false
            let pos = 0
            const keyIndex = {}
            for (let i = newStart; i <= newEnd; i++) {
                keyIndex[newChildren[i].key] = i
            }

            // 新增 patched 变量，代表更新过的节点数量
            let patched = 0
            for (let i = oldStart; i <= oldEnd; i++) {
                oldVNode = oldChildren[i]
                // 如果更新过的节点数量小于等于需要更新的节点数量，则执行更新
                if (patched <= count) {
                    const k = keyIndex[oldVNode.key]
                    if (typeof k !== 'undefined') {
                        newVNode = newChildren[k]
                        patch(oldVNode, newVNode, container)
                        // 每更新一个节点，都将 patched 变量 +1
                        patched++
                        source[k - newStart] = i
                        if (k < pos) {
                            moved = true
                        } else {
                            pos = k
                        }
                    } else {
                        // 没找到
                        unmount(oldVNode)
                    }
                } else {
                    // 如果更新过的节点数量大于需要更新的节点数量，则卸载多余的节点
                    unmount(oldVNode)
                }
            }

            // 需要移动
            if (moved) {
                const seq = lis(sources)

                // s 指向最长递增子序列的最后一个元素
                let s = seq.length - 1
                let i = count - 1
                for (i; i >= 0; i--) {
                    if (source[i] === -1) {
                        // 省略部分代码
                    } else if (i !== seq[s]) {
                        // 说明该节点需要移动
                        // 该节点在新的一组子节点中的真实位置索引
                        const pos = i + newStart
                        const newVNode = newChildren[pos]
                        // 该节点的下一个节点的位置索引
                        const nextPos = pos + 1
                        // 锚点
                        const anchor = nextPos < newChildren.length
                            ? newChildren[nextPos].el
                            : null
                        // 移动
                        insert(newVNode.el, container, anchor)
                    } else {
                        // 当 i === seq[s] 时，说明该位置的节点不需要移动
                        // 并让 s 指向下一个位置
                        s--
                    }
                }
            }
        }

    }

    // 更新 dom 节点
    function patchElement(n1, n2) {
        const el = n2.el = n1.el
        const oldProps = n1.props
        const newProps = n2.props
        // 第一步：更新 props 


        if (n2.patchFlags) {
            // 靶向更新
            if (n2.patchFlags === 1) {
                // 只需要更新 class
            } else if (n2.patchFlags === 2) {
                // 只需要更新 style
            } else if (others) {
                // ...
            }
        } else {
            // 全量更新
            // 第一个for循环更新相同属性
            for (const key in newProps) {
                if (newProps[key] !== oldProps[key]) {
                    patchProps(el, key, oldProps[key], newProps[key])
                }
            }
            // 第二个for循环添加新的属性
            for (const key in oldProps) {
                if (!(key in newProps)) {
                    patchProps(el, key, oldProps[key], null)
                }
            }
        }


        // 更新children
        patchChildren(n1, n2, el)

    }

    // 挂载节点
    function mountElement(vnode, container, anchor) {
        // 让 vnode.el 引用真实的 DOM 元素
        const el = vnode.el = createElemnt(vnode.type)

        // 判断children中存储的子节点是否为字符串节点
        if (typeof vnode.children == 'string') {
            setElementText(el, vnode.children)
        } else if (Array.isArray(vnode.children)) {

            // 递归遍历子节点
            vnode.children.forEach(child => {
                // 挂载阶段 所以传给 patch 的第一个参数是null
                patch(null, child, el)
            });
        }

        // 绑定属性
        if (vnode.props) {
            for (const key in vnode.props) {
                // 调用 patchProps 函数即可 null 需要改成动态的 
                patchProps(el, key, null, vnode.props[key])
            }
        }

        // 判断一个 VNode 是否需要过渡
        const needTransition = vnode.transition
        if (needTransition) {
            // 调用 transition.beforeEnter 钩子，并将 DOM 元素作为参数传递
            vnode.transition.beforeEnter(el)
        }

        insert(el, container, anchor)

        if (needTransition) {
            // 调用 transition.enter 钩子，并将 DOM 元素作为参数传递
            vnode.transition.enter(el)
        }

    }

    // 在卸载的时候，可以调用DOM元素上的指令钩子函数 before unmount unmounted,如果是组件，可以调用组件相关的生命周期函数
    function unmount(vnode) {
        // 判断 VNode 是否需要过渡处理
        const needTransition = vnode.transition

        // 在卸载的时候，如果卸载的 n2 类型为 Fragment，则需要卸载其他 children
        if (vnode.type === Fragment) {
            vnode.children.forEach(c => {
                unmount(c)
            })
        } else if (typeof vnode.type === 'object') {
            // vnode.shouldKeepAlive 是一个布尔值，用来标识该组件是否应该被 KeepAlive
            if (vnode.shouldKeepAlive) {
                // 对于需要被 KeepAlive 的组件，我们不应该真的卸载它，而应调用该组件的父组件，
                // 即 KeepAlive 组件的 _deActivate 函数使其失活
                vnode.keepAliveInstance._deActivate(vnode)
            } else {
                // 对于组件的卸载，本质上是要卸载组件所渲染的内容，即 subTree
                unmount(vnode.component.subTree)
                return
            }
            return
        }


        const parent = vnode.el.parentNode
        if (parent) {
            // 将卸载动作封装到 performRemove 函数中
            const performRemove = () => parent.removeChild(vnode.el)
            if (needTransition) {
                // 如果需要过渡处理，则调用 transition.leave 钩子，
                // 同时将 DOM 元素和 performRemove 函数作为参数传递
                vnode.transition.leave(vnode.el, performRemove)
            } else {
                // 如果不需要过渡处理，则直接执行卸载操作
                performRemove()
            }
        }

    } 

    // 获取 el 的父元素
    const parent = vnode.el.parentNode

    // 调用 removeChild 移除元素
    if (parent) {
        parent.removeChild(vnode.el)
    }
}

function render(vnode, container) {
    if (vnode) {
        // 此时第一个参数为 null
        patch(container._vnode || null, vnode, container)
    } else {
        if (container._vnode) {
            // 调用 unmount 函数卸载 n2
            unmount(container._vnode)
        }
    }
    container._vnode = vnode
}

return {
    render
}
