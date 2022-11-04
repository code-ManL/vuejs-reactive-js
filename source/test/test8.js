import { effect } from '../effect.js'
import { shallowReactive } from '../createReactive/shallowReactive/shallowReactive.js'
import { reactive } from '../createReactive/reactive/reactive.js'

const obj = { foo: 2 }

const p = reactive(obj)
effect(() => {
    console.log(p.foo);
})

p.bar = 3

// p.foo.bar = 2



