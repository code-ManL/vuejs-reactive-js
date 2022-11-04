import { createRenderer, options } from "../render"
// 创建一个容器
const renderer = createRenderer(options)

//  <MyComponent :title="A Big Title" @father_fn_bar="handler"  />

const Son = {
    name: 'Son',

    // 用 data 函数来定义组件自身的状态
    data() {
        return {
            foo: 'hello world'
        }
    },

    props: {
        title: String,
    },

    setup(props, { emit }) {
        emit('father_fn_bar', 1)
        const count = ref(0)

        // 返回一个对象，对象中的数据会暴露到渲染函数中
        return {
            count
        }
    },

    render() {
        return {
            type: 'div',
            children: `foo 的值是: ${this.foo} , 数量为${this.count.value} 标题为${this.title}}`, // 在渲染函数内使用组件状态
        }
    }
}

const Father = {
    name: 'Father',

    // 用 data 函数来定义组件自身的状态
    data() {
        return {
            title: 'dwada',
        }
    },

    setup(props, setupContext) {
        function father_fn_bar() {
            console.log('father_fn_bar');
        }

        function father_fn_foo() {
            console.log('father_fn_foo');
        }

        // 返回一个对象，对象中的数据会暴露到渲染函数中
        return {
            father_fn_bar,
            father_fn_foo
        }
    },

    render() {
        return {
            type: Son,
            props: {
                // v-bind
                title: this.title,
                change: father_fn_foo,
                // v-on
                onChange: this.father_fn_bar
            }
        }
    }
}

const vnode = {
    type: Father
}

renderer.render(vnode, document.querySelector('#app'))
