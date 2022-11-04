import { reactive } from '../createReactive/reactive/reactive.js'
import { toRefs } from '../ref/toRefs.js'
import { proxyRefs } from '../ref/toRefs.js'

const obj = reactive({
    foo: 1,
    bar: 2
})

const newobj = proxyRefs({ ...toRefs(obj) })

const newobj2 = proxyRefs(toRefs(obj))


console.log(newobj2);
console.log(newobj);