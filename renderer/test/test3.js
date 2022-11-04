/* 

     <template>
        <MyComponent>
            <template #header>
                <h1>我是标题</h1>
            </template>
            <template #body>
                <section>我是内容</section>
            </template>
            <template #footer>
                <p>我是注脚</p>
            </template>
        </MyComponent> 
    </template>
    
    当在父组件中使用 < MyComponent > 组件时，可以根据插槽的名
    字来插入自定义的内容：

    <template>
        <header><slot name="header" /></header>
        <div>
            <slot name="body" />
        </div>
        <footer><slot name="footer" /></footer>
    </template>

*/


const Son = {
    name: 'Son',

    render() {
        return [
            {
                type: 'header',
                children: [this.$slots.header()]
            },
            {
                type: 'body',
                children: [this.$slots.body()]
            },
            {
                type: 'footer',
                children: [this.$slots.footer()]
            }
        ]
    }
}

const Father = {
    name: 'Father',


    render() {
        return {
            type: Son,
            // 组件的 children 会被编译一个对象
            children: {
                header() {
                    return { type: 'h1', children: '我是标题' }
                },
                body() {
                    return { type: 'section', children: '我是内容' }
                },
                footer() {
                    return { type: 'p', children: '我是注脚' }
                }
            }
        }
    }
}

const vnode = {
    type: Father
}

renderer.render(vnode, document.querySelector('#app'))


