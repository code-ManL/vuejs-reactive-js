import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'

const p2 = reactive(new Map([['key1', 1], ['key2', 2]]));


effect(() => {
    for (const item of p2.entries()) {
        // for (const item of p2) {
        // for (const item of p2.keys()) {
        // for (const item of p2.values()) {
        console.log(item);
    }
})

