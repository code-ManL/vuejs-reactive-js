import { effect } from '../effect.js'
import { reactive } from '../createReactive/reactive/reactive.js'


const reavObj = reactive({ bar: 2 })


const objt = { foo: 1, zoo: reavObj }


const obj = reactive(objt)

 // 问题如果本身是代理的，又代理了一遍   *****************************************************************************************************
console.log(obj.zoo === reavObj);




