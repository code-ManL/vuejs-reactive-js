import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'

const obj = [1]

const p = reactive(obj)
effect(() => {
    console.log(p.includes(1));
})


p[0] = 3



