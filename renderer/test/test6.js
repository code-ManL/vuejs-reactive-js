import { createRenderer, options } from "../render"
// 创建一个容器
const renderer = createRenderer(options)


// function Son(props) {
//   return {
//     type: 'h1',
//     children: props.title
//   }
// }
//   Son.props = {
//   title: String
// }


const Father = {
  name: 'Father',

  // 用 data 函数来定义组件自身的状态
  data() {
    return {
      title: 'dwada',
    }
  },

  render() {
    return {
      type: Son,
      props: {
        // v-bind
        title: this.title,
      }
    }
  }
}

const vnode = {
  type: Father
}

renderer.render(vnode, document.querySelector('#app'))
