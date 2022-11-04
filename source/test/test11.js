import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'

const obj = ['foo', 'wad']

const p = reactive(obj)
effect(() => {
    console.log(p.length);
})


p[2] = 'awd'



