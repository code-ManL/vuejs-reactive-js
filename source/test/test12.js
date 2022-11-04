import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'

const obj = ['foo']

const p = reactive(obj)
effect(() => {
    console.log(p[0]);
})


p.length = 0



