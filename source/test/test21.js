import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'


// 数据污染

const map = {
    foo: 1
}

const p1 = reactive(map)

const p2 = reactive({ bar: 2 })


p1.bar = p2


effect(() => {
    console.log(map.bar.bar);
})


map.bar.bar = 3

console.log(map);


console.log(p2);

