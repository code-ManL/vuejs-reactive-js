import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'
import { ref } from '../ref/ref.js'



const map = reactive(new Map([['count', ref(0)]]))
// θΏιιθ¦ .value
console.log(map.get('count').value)
