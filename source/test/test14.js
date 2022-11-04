import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'

const obj = { foo: 1 }

const reavObj = reactive({ bar: 2 })

const arr = reactive([obj, reavObj])


console.log(arr.includes(obj));      // false
console.log(arr.includes(arr[0]));   // true
console.log(arr.includes(reavObj));  //false 因为 arr通过索引获取各个元素的时候，在遇到 reavObj 的时候，由于 reavObj 是代理对象，判断结果也为 object 类型，因此在返回的时候，也进行了 reactive 包装，target 是代理对象 reavObj

// 重写 include 方法，返回 true



/*
    在这里无论用哪种方式去访问都会返回false
    根本原因在于 includes方法 内部的实现机制
    1. 内部会访问数组的length
    2. 内部会访问数组的索引

    情况一:
        在访问数组的索引的时候就相当于 arr[0] 这样去访问，由于我们现在存储的元素是 object 类型，因此返回前会调用reactive
    进行包装，返回一个包装过后的 Proxy 实例，因此和传入给 include的obj 不一样

    情况二:
        在访问数组的索引的时候就相当于 arr[0] 这样去访问，由于我们现在存储的元素是 object 类型，因此返回前会调用reactive
    进行包装，返回一个包装过后的 Proxy 实例，而我们现在传入给 include的是 arr[0] 这意味着他也会返回返回一个reactive包装的 Proxy 实例，
    这些实例返回的过程都是 new 出来的，因此不一样
*/




