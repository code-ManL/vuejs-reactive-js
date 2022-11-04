import { createRenderer, options } from "../render"
// 创建一个容器
const renderer = createRenderer(options)



//  <MyComponent title="A Big Title" :other="val" />

const MyComponent = {
    name: 'MyComponent',

    // 用 data 函数来定义组件自身的状态
    data() {
        return {
            foo: 'hello world'
        }
    },

    props: {
        title: String,
    },

    render() {
        return {
            type: 'div',
            children: `foo 的值是: ${this.foo}` // 在渲染函数内使用组件状态
        }
    }
}

const ComVNode = {
    type: MyComponent,
    props: {
        title: 'dawdawda'
    }
}

renderer.render(ComVNode, document.querySelector('#app'))
