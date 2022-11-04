import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'
import { ref } from '../ref/ref.js'


const count = ref(1)
const obj = reactive({})
obj.count = count
console.log(obj.count) // 1
console.log(obj.count === count.value) // true
