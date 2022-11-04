import { reactive } from '../createReactive/reactive/reactive.js'
import { effect } from '../effect.js'
import { toRef } from '../ref/toRefs.js'
import { proxyRefs } from '../ref/toRefs.js'

const count = {
    a: 1,
};

const A = toRef(count, "a");


effect(() => {
    console.log(A.value);
})

A.value = 2
