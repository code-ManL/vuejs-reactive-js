import { effect } from "../effect.js";
import { reactive } from "../createReactive/reactive/reactive.js";
import { shallowReactive } from '../createReactive/shallowReactive/shallowReactive.js'


const obj = { foo: 1, bar: {} }

const p = reactive(obj)

// for...in 会直接调用EnumerateObjectProperties(obj)，当中会调用Reflct.ownKeys(obj) 这个会触发代理对象的ownKeys方法
effect(() => {
    console.log('---');
    for (const key in p) {
        console.log(key);
    }
})
// delete p.bar
p.bar.zoo = 3

/**
 * 
 *  effect(() => {
 *     console.log(p.bar.c);
 *  })
 *  p.bar.c++ 
 * 
 * 收集依赖过程分析：
 * 当触发我们传入给effect的回调函数的时候，
 *      注意分析这个p.bar.c
 *      首先，我们获取 p.bar, p 是经过Proxy代理的对象，p.bar的时候就会触发getter钩子。这个时候，bar会收集依赖，然后最后返回的是 
 *      Reflect.get(target, key, reveiver) , 就是原始对象上的 { c : 1 }
 * 
 *      然后，当我们通过这个 { c : 1 } 去获取c的值的时候，其实操作的就是普通的对象，这个时候不会触发依赖的收集，只是单纯的从原始对象上获取值
 * 
 *      最后将这个值打印输出，fn函数执行完毕 
 *         
 *  更新数据触发依赖分析：
 *  当我们执行p.bar.c++的时候
 *  首先触发的是p.bar，这是一个读取的操作，此时不存在副作用函数，activeEffectFn为undefined,直接返回p.bar的值，是对象 { c: 2 }
 * 
 *  然后我们去更新这个对象身上c的值的时候，实际上他就是原始对象身上属性中所引用的一个普通对象，不存在代理，直接对原始对象进行了操作，因此不会触发依赖
 * 
 *  如果我们去修改p.bar的对象的时候，这个时候才会触发副作用函数的重新执行
 * 
 */

/**
 * 2个问题
 *  1.访问不存的属性，也会产生依赖
 *  2.删除了属性，依赖还存在
 *  
 */