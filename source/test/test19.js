import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'
import { shallowReactive } from '../createReactive/shallowReactive/shallowReactive.js'


const reobj = reactive({ bar: 2 })

const map = reactive(new Map([['key1', 1], ['key2', { foo: 1, bar: reactive({ zoo: 1 }) }], ['key3', reobj]]))

// effect(() => {
//     console.log(map.get('key2').bar.zoo);
// })

// // map.get('key2').bar = { zoo: 3 }

// console.log(map.get('key2'));


console.log(map.get('key3') === reobj);
