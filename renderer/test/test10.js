import { createRenderer, defineAsyncComponent, options } from "../render"
// 创建一个容器
const renderer = createRenderer(options)


/* 
 <template>
    <Component :is='asyncCom'
 </template>
*/


const AsyncComponentWrapper = {
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




const Father = {
    name: 'Father',

    setup() {
        const asyncCom = defineAsyncComponent(() => import('./A.vue'))
        return {
            asyncCom
        }
    },

    render() {
        return {
            type: AsyncComponentWrapper,
        }
    }
}

const vnode = {
    type: Father
}

renderer.render(vnode, document.querySelector('#app'))
