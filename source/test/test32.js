import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'
import { ref } from '../ref/ref.js'



const obj = {
    a: 1
}
const refObj = ref(obj)
const reactiveObj = reactive(obj)

console.log(refObj.value == reactiveObj);

