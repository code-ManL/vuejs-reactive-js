import { effect } from '../effect.js'
import { shallowReadonly } from '../createReactive/shallowReadonly/shallowReadonly.js'
import { shallowReactive } from '../createReactive/shallowReactive/shallowReactive.js'


const obj = {
    foo: 1,
    bar: 2,
    zoo: {
        tt: 3
    }
}

const props = shallowReactive(obj)

const prop = shallowReadonly(props)

effect(() => {
    console.log(prop.zoo.tt);
})

prop.zoo.tt = 4
console.log(obj);

