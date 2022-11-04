// 用户自定义的副作用函数，这里当前只有obj.text字段和副作用函数建立相应联系，因此定时器中的notExist不应该触发副作用函数重新执行
// 现在的问题就是： 没有在副作用函数与被操作数的目标字段之间建立明确的联系
/**
 *  需要建立这样明确的联系
 * 
 *  target(原始对象)
 *          |__key
 *              |__effectFn
 */

// 副作用函数是会产生副作用的函数

import { TriggerType, ITERATE_KEY, MAP_ITERATE_KEY } from './Types/Types.js';
import { shouldTrack } from './createReactive/createReactive.js';


const bucket = new WeakMap()

// 用一个全局变量存储当前被激活的副作用函数
let activeEffect;

// effect栈
const effectStack = []

// 清除依赖中的副作用函数
function cleanup(effectFn) {
    for (let i = 0; i < effectFn.deps.length; i++) {
        // deps是依赖集合
        const deps = effectFn.deps[i]

        // 将 effectFn 从依赖集合中移除 
        deps.delete(effectFn)
    }
    // 最后需要重置 effectFn.deps 数组
    effectFn.deps.length = 0
}

//effect 函数用于注册副作用函数
export function effect(fn, options = {}) {
    const effectFn = () => {
        // 每次触发更新的时候，先清除之前依赖当中所包含当前的这个副作用函数
        // 这里触发更新的时候，无论清除或者不清除，都会重新将副作用函数add到集合当中，只不过引用的对象为同一个副作用函数，Set自动过滤了
        // 现在我们手动清除，就不会触发这个自动过滤，当然我们的目的不是这个过滤，而是清除那些在分支切换时不应该再触发的副作用函数
        cleanup(effectFn)
        // 当 effectFn 执行时，将其设置为当前激活的副作用函数
        activeEffect = effectFn

        // 将当前的激活的副作用函数存入到effect栈当中
        effectStack.push(activeEffect)

        // 执行副作用函数,每次触发更新的时候，都会执行这个传入的副作用函数，而依赖的收集就取决于这个函数的内容，
        // 每次触发更新时候，将之前集合收集的依赖清除掉，重新执行这个函数，重新收集，因为函数的内容也许发生了改变，
        // 有些依赖这一次执行就不用去收集了，因此需要去清除之前的依赖
        const res = fn()

        // 嵌套副作用函数执行完毕以后将最外层的pop出去
        effectStack.pop()

        // 重新赋值副作用函数,越界-1返回的是undefined
        activeEffect = effectStack[effectStack.length - 1]

        //将调用函数的结果返回给手动触发的副作用函数
        return res
    }
    // 将调度器挂载到effectFn上
    effectFn.options = options

    // activeEffect.deps 用来存储所有与该副作用函数相关联的依赖集合
    effectFn.deps = []

    // 只有非lazy的时候才立即执行，这个lazy控制一上来的副作用函数执行，trigger 当中的scheduler是控制更新时的副作用函数执行
    if (!options.lazy) {
        // 执行副作函数
        effectFn()
    }

    // 将副作用函数作为返回值返回
    return effectFn
}

//大桶 装 所有字段的副作用函数，小桶 装 每个字段的副作用函数 
export function track(target, key) {
    // console.log(key, '-----走了track');

    // 如果没有 activeEffect 直接返回 , return
    if (!activeEffect || !shouldTrack)
        return;

    // 根据 target 从 '桶' 当中取得depsMap ,他是一个 Map 类型: key -> effetcs
    // 这行代码的含义就是从桶（大桶）当中拿出 target 对象所有字段的副作用函数集合（所有小桶）   
    let depsMap = bucket.get(target)

    //如果当前target对象还没有它的大桶，就创建大桶
    if (!depsMap) {
        depsMap = new Map()
        bucket.set(target, depsMap)
    }

    //这行代码的含义是，如果当前target对象有桶（大桶），那么从所有字段的副作用函数集合（所有小桶）中，取出当前key的副作用函数集合（小桶）
    let deps = depsMap.get(key)

    if (!deps) {
        // 创建当前字段装副作用函数的小桶
        deps = new Set()
        depsMap.set(key, deps)
    }
    // 为当前字段(小桶)添加副作用函数,这个副作用函数当前是激活的
    // 无论是首次调用effect()函数，还是trigger触发更新，都会走这一步，由于trigger触发更新的时候，activeEffect引用的对象是相同的，Set会自动过滤重复的
    // 有了cleanup函数之后，每次触发前都进行了依赖删除，那么就不会触发Set的自动过滤了
    deps.add(activeEffect)

    // console.log(bucket);
    // console.log(depsMap, key, '-----Map');

    // deps就是一个与当前副作用函数存在联系的Set集合
    // 将其添加到 activeEfferct.deps 数组中
    activeEffect.deps.push(deps)
    // 每一个deps 都是一个字段的Set集合，这行代码相当于将 该副作用函数 与 和他有关的Set集合 相互联系起来，可能有多个字段所对应的Set集合都包含这个副作用函数  
    // activeEffect.deps 这个数组收集了所有与当前副作用函数有关联的Set集合
}

//  触发变化
export function trigger(target, key, type, newVal) {
    // console.log('更新了');
    // 设置新的值以后，取出当前target所对应的大桶
    const depsMap = bucket.get(target)

    // 如果没有大桶直接返回
    if (!depsMap)
        return;

    // 取出当前字段的所有副作用函数（小桶）
    const effects = depsMap.get(key)

    // 这里会死循环，因为执行副作用函数的时候会清除他，然后track的时候又会重新添加进来
    // 改进
    const effectsToRun = new Set();
    // effects && effects.forEach(fn => {

    // 避免tarck 和 trigger 同时在执行的副作用函数是同一个导致死循环 
    /**
     * 也就是说，传给effect的函数中，在同一层面上，即获取值，也赋值就会造成死循环（注意：操作的对象相同，获取obj.foo，赋值obj.foo）
     * 因为同一层面上，获取值所收集的依赖，和赋值更新时触发的依赖，是同一个依赖(副作用函数)
     * 这就会反复的调用副作用函数（自己调自己），走不出这个fn(传给effect的函数)，造成栈溢出
     */

    // console.log(depsMap);
    effects && effects.forEach(fn => {
        if (fn !== activeEffect) {
            effectsToRun.add(fn)
        }
    })

    // 当操作的类型为 ADD 或者 DELETE 并且目标对象是 Map 类型的数据也应该触发那些与 ITERATE_KEY 相关联的副作用函数去重新执行
    if (type === TriggerType.ADD || type === TriggerType.DELETE || (type === 'SET' && Object.prototype.toString.call(target) === '[object Map]')) {
        // 取得与 ITERATE_KEY 相关联的副作用函数
        const iterateEffects = depsMap.get(ITERATE_KEY)
        //将与 ITERATE_KEY 相关联的副作用函数也添加到 effectsToRun
        iterateEffects && iterateEffects.forEach(fn => {
            if (fn !== activeEffect) {
                effectsToRun.add(fn)
            }
        })
    }

    // 当操作的类型为 ADD 或者 DELETE 并且目标对象是 Map 类型的数据
    if ((type === TriggerType.ADD || type === TriggerType.DELETE) && (type === 'SET' && Object.prototype.toString.call(target) === '[object Map]')) {
        // 取得与 ITERATE_KEY 相关联的副作用函数
        const iterateEffects = depsMap.get(MAP_ITERATE_KEY)
        //将与 ITERATE_KEY 相关联的副作用函数也添加到 effectsToRun
        iterateEffects && iterateEffects.forEach(fn => {
            if (fn !== activeEffect) {
                effectsToRun.add(fn)
            }
        })
    }

    // 当操作的类型为ADD 并且目标对象是数组时，应该取出并执行那些与 length 有关的副作用函数重新执行
    if (type === TriggerType.ADD && Array.isArray(target)) {
        // 取得与 lengthEffects 相关联的副作用函数
        const lengthEffects = depsMap.get('length')
        //将与 lengthEffects 相关联的副作用函数也添加到 effectsToRun
        lengthEffects && lengthEffects.forEach(fn => {
            if (fn !== activeEffect) {
                effectsToRun.add(fn)
            }
        })
    }

    if (Array.isArray(target) && key === 'length') {
        // 对于索引大于或等于新的 length 值的元素
        // 需要把所有相关联的副作用函数取出，并添加到 effectsToRun 队列当中去执行
        depsMap.forEach((effects, key) => {
            if (key >= newVal) {
                effects && effects.forEach(fn => {
                    if (fn !== activeEffect) {
                        effectsToRun.add(fn)
                    }
                })
            }
        })
    }

    effectsToRun.forEach(fn => {
        // 如果一个副作用函数存在调度器，那么可以将触发更新的操作交给用户
        if (fn.options.scheduler) {
            fn.options.scheduler(fn)
        }
        else {
            // 否则直接调用副作用函数
            fn()
        }
    })
}





