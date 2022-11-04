import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'
import { ref } from '../ref/ref.js'



const map = reactive(new Map([['count', ref(0)]]))
// 这里需要 .value
console.log(map.get('count').value)
