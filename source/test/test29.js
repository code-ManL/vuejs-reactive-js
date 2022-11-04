import { reactive } from '../createReactive/reactive/reactive.js'
import { effect } from '../effect.js'
import { toRefs, toRef } from '../ref/toRefs.js'
import { proxyRefs } from '../ref/toRefs.js'
import { ref } from '../ref/ref.js'



const count = ref(0)
console.log(count);

// const obj = reactive({ count })


// console.log(obj.count === count.value);