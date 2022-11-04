

/* 
 <template>
    <Transition>
        <div>我是需要过渡的元素</div>
    </Transition>
 </template>
*/

// 创建一个容器
const renderer = createRenderer(options)


const Transition = {
    name: 'Transition',
    setup(props, { slots }) {
        return () => {
            const innerVNode = slots.default()

            innerVNode.transition = {
                beforeEnter(el) {
                    // 设置初始状态：添加 enter-from 和 enter-active 类
                    el.classList.add('enter-from')
                    el.classList.add('enter-active')
                },
                enter(el) {
                    // 在下一帧切换到结束状态
                    nextFrame(() => {
                        // 移除 enter-from 类，添加 enter-to 类
                        el.classList.remove('enter-from')
                        el.classList.add('enter-to')
                        // 监听 transitionend 事件完成收尾工作
                        el.addEventListener('transitionend', () => {
                            el.classList.remove('enter-to')
                            el.classList.remove('enter-active')
                        })
                    })
                },
                leave(el, performRemove) {
                    // 设置离场过渡的初始状态：添加 leave-from 和 leave-active类
                    el.classList.add('leave-from')
                    el.classList.add('leave-active')
                    // 强制 reflow，使得初始状态生效
                    document.body.offsetHeight
                    // 在下一帧修改状态
                    nextFrame(() => {
                        // 移除 leave-from 类，添加 leave-to 类
                        el.classList.remove('leave-from')
                        el.classList.add('leave-to')

                        // 监听 transitionend 事件完成收尾工作
                        el.addEventListener('transitionend', () => {
                            el.classList.remove('leave-to')
                            el.classList.remove('leave-active')
                            // 调用 transition.leave 钩子函数的第二个参数，完成 DOM元素的卸载
                            performRemove()
                        })
                    })
                }
            }

            return innerVNode
        }
    }
}


const Father = {
    name: 'Father',
    render() {
        return {
            type: Transition,
            children: {
                default() {
                    return { type: 'div', children: '我是需要过渡的元素' }
                }
            }
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

