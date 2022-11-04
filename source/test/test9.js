import { effect } from '../effect.js'
import { readonly } from '../createReactive/readonly/readonly.js'

const obj = { foo: 2, bar: { zoo: 3 } }

const p = readonly(obj)

effect(() => {
    console.log(p.bar.zoo);
})

p.bar.zoo = 4
// p.foo.bar = 2



