import { effect, track, trigger } from "../effect.js"

//实验五 computed 

/**
 *  1.不希望立即执行副作用函数，需要懒加载 
 *  2.只有调用value的时候才计算，没有做到对值进行缓存，如果多次访问会导致多次计算
*/
function computed(getter) {
    // value 用来缓存上一次计算的值
    let value

    // dirty 标志，用来标识是否需要重新计算值，为 true 则意味着 "脏" ，需要计算
    let dirty = true

    const effectFn = effect(getter, {
        lazy: true,
        scheduler: function () {
            dirty = true
            // 当计算属性依赖的响应式数据变化时，手动调用trigger函数触发响应
            trigger(obj, 'value')
        }
    })

    const obj = {
        get value() {
            if (dirty) {
                value = effectFn()
                // 将dirty设置为false ,下一次访问直接使用缓存到value中值
                dirty = false
            }
            // 当读取 value 时，手动调用track函数进行追踪
            track(obj, 'value')
            return value
        }
    }
    return obj
}

const data5 = { foo: 1, bar: 2 }

const obj5 = new Proxy(data5, {
    get(target, key) {
        track(target, key)
        // 返回读取的值
        return target[key]
    },
    set(target, key, newVal) {
        // 设置属性值
        target[key] = newVal;

        trigger(target, key)

        return true
    }
})

// const effectFn = effect(
//     () => {
//         return obj5.foo + obj5.bar;
//     },
//     // options
//     {
//         lazy: true
//     }
// )

// // 手动执行副作用函数
// const value = effectFn()
// console.log(value);

const sum = computed(() => obj5.foo + obj5.bar)

//需要在computed内部追踪最外层的副作用函数，建立依赖关系
effect(() => {
    console.log(sum.value);
})

setTimeout(() => {
    obj5.foo++
}, 1000)