import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'

const p2 = reactive(new Map([['key1', 1]]));


effect(() => {
    p2.forEach(function (value, key) {
        console.log(value);
    });
})

p2.set('key', 2)