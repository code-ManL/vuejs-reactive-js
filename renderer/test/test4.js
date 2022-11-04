import { createRenderer, options, onMounted } from "../render"
// 创建一个容器
const renderer = createRenderer(options)

//  <MyComponent :title="A Big Title" @father_fn_bar="handler"  />

const Son = {
    name: 'Son',
    setup() {
        onMounted(() => {
            console.log('mounted 1')
        })
        // 可以注册多个
        onMounted(() => {
            console.log('mounted 2')
        })
    },

    render() {
        return {
            type: 'div',
            children: `foo 的值是:`, // 在渲染函数内使用组件状态
        }
    }
}

const Father = {
    name: 'Father',

    render() {
        return {
            type: Son,
        }
    }
}

const vnode = {
    type: Father
}

renderer.render(vnode, document.querySelector('#app'))
