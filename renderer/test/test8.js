

/* 
 <Teleport to="body">
        <h1>Title</h1>
        <p>content</p>
 </Teleport>

*/

// 创建一个容器
const renderer = createRenderer(options)



const Teleport = {
    __isTeleport: true,
    process(n1, n2, container, anchor, internals) {
        // 通过 internals 参数取得渲染器的内部方法
        const { patch } = internals
        // 如果旧 VNode n1 不存在，则是全新的挂载，否则执行更新
        if (!n1) {
            // 挂载
            // 获取容器，即挂载点
            const target = typeof n2.props.to === 'string'
                ? document.querySelector(n2.props.to)
                : n2.props.to
            // 将 n2.children 渲染到指定挂载点即可
            n2.children.forEach(c => patch(null, c, target, anchor))
        } else {
            // 更新
            patchChildren(n1, n2, container)
            // 如果新旧 to 参数的值不同，则需要对内容进行移动
            if (n2.props.to !== n1.props.to) {
                // 获取新的容器
                const newTarget = typeof n2.props.to === 'string'
                    ? document.querySelector(n2.props.to)
                    : n2.props.to
                // 移动到新的容器
                n2.children.forEach(c => move(c, newTarget))
            }
        }

    }
}


const Father = {
    name: 'Father',
    render() {
        return {
            type: Teleport,
            // 以普通 children 的形式代表被 Teleport 的内容
            children: [
                { type: 'h1', children: 'Title' },
                { type: 'p', children: 'content' }
            ]
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

