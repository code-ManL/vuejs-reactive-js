import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'

let map = reactive(new Set([1, 2, 4]))


effect(() => {
    for (const item in map.values()) {
        console.log(item);
    }
})
