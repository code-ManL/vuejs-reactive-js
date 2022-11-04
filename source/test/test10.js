import { effect } from '../effect.js'
import { shallowReadonly } from '../createReactive/shallowReadonly/shallowReadonly.js'


const obj = { foo: 2, bar: { zoo: 3 } }

const p = shallowReadonly(obj)

effect(() => {
    console.log(p.bar.zoo);
})

p.bar.zoo = 4
console.log(obj);
// p.foo.bar = 2



