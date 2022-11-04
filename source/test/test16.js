import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'

// 栈溢出

// const obj = { foo: 2 }

// const p = reactive(obj)

// effect(() => {
//     p.foo++
// })

// effect(() => {
//     p.foo = p.foo + 1
// })


//  数组的push方法 会访问和设置length 和当前情况一样,但已经重写解决,这个还是遗留问题
const arr = reactive([])

effect(() => {
    arr.push(1)
})


effect(() => {
    arr.push(2)
})

const obj = reactive({ name: 'wada' })

effect(() => {
    arr.push(obj)
})


console.log(arr);