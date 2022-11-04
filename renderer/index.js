
// vue采用模板的方式来描述UI，但它同样支持使用虚拟DOM来描述UI.虚拟DOM比模板更加灵活，但模板比虚拟DOM更加直观

// export function Component (){
//         return {
//             tag: 'div',
//             props: {
//                 onClick: () => alert(1)
//             },
//             children: {
//                 tag: "span",
//                 children: [
//                     'dwad',
//                     {
//                         tag: "span",
//                         children: "hello hah"
//                     }
//                 ],
//             },
//         }
// }


// 组件就是一组dom元素的封装
export const Component = {
    // 渲染函数返回要渲染的内容
    // 在编译的时候，编译器可以分析动态内容，并在编译阶段把这些信息提取出来，然后直接交给渲染器

    render() {
        return {
            tag: 'div',
            props: {
                onClick: () => alert(1),
                id:'ff',
                // class:'一个变量',
            },
            children: {
                tag: "span",
                children: [
                    'dwad',
                    {
                        tag: "span",
                        children: "hello hah"
                    }
                ],
            },
            // patchFlags:1  假设数字1代表class是动态的
        }
    }
}

// 创建textNode子节点
function createTextNode(vnodeText) {
    return document.createTextNode(vnodeText)
}

// 挂载原生HTML标签
function mountElement(vnode, container) {

    // 创建dom元素
    const el = document.createElement(vnode.tag)

    // 绑定属性
    for (const key in vnode.props) {
        if (/^on/.test(key)) {
            el.addEventListener(key.substring(2).toLowerCase(), vnode.props[key])
        }
    }

    // 判断children中存储的子节点是否为字符串节点
    if (typeof vnode.children == 'string') {
        el.appendChild(createTextNode(vnode.children))
    }

    // 如果不是字符串节点，并且子节点的数据类型是一个数组
    else if (Array.isArray(vnode.children)) {

        // 递归遍历子节点
        vnode.children.forEach(element => {
            
            // 如果子节点是在数组当中的字符串
            typeof element === 'string' ? el.appendChild(createTextNode(element)) : renderer(element, el)
        });
    }

    // 如果子节点的数据类型是对象
    else if (typeof vnode.children === 'object') {
        renderer(vnode.children, el)
    }

    // 添加节点
    container.appendChild(el)
}


// 挂载组件
function mountComponent(vnode, container) {

    //调用组件函数或者组件对象,返回vnode
    const subtree = typeof vnode.tag === 'object' ? vnode.tag.render() : vnode.tag()

    // 递归调用renderer渲染 subtree
    renderer(subtree, container)
}

// 渲染器
function renderer(vnode, container) {

    // 目标元素为字符串，意味着原生HTML标签
    if (typeof vnode.tag === 'string') {
        mountElement(vnode, container)
    }

    // 如果tag是组件函数或者对象(调用组件函数会返回vnode)
    else if (typeof vnode.tag === 'object' || typeof vnode.tag === 'function') {
        mountComponent(vnode, container)
    }
}

export default renderer
