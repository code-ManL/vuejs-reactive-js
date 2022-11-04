import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'



// 数据污染
const map = new Map()

const p1 = reactive(map)

const p2 = reactive(new Map())

p1.set('p2', p2)


effect(() => {
    console.log(map.get('p2').size);
})

map.get('p2').set('foo', 1)

