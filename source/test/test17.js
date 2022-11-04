import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'

// 栈溢出


const arr = reactive([])

effect(() => {
    console.log(arr.length);
})


arr.push(1)



// 在进行 push 操作的时候，屏幕 length 属性的读取，从而避免在它与副作用函数之间建立响应联系

