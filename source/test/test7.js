import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'

const obj = { foo: { bar: { zoo: 1 } } }

const p = reactive(obj)
effect(() => {
    console.log(p.foo.bar.zoo);
})

p.foo.bar = {
    zoo: 3
}


// p.foo.bar = 2



