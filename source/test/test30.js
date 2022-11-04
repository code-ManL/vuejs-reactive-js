import { reactive } from '../createReactive/reactive/reactive.js'
import { effect } from '../effect.js'
import { toRefs, toRef } from '../ref/toRefs.js'
import { proxyRefs } from '../ref/toRefs.js'
import { ref } from '../ref/ref.js'




const obj = { foo: 1 };

const b = ref(obj);
const a = reactive(obj);

console.log(a === b.value);
console.log(b.value);
console.log(a);
// const obj = reactive({ count })


// console.log(obj.count === count.value);