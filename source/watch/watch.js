import { effect, trigger, track } from "../effect.js";

function traverse(value, seen = new Set()) {
    // 如果要读取的数据时原始值，或者已经被读取过，那么什么都不做
    if (typeof value !== 'object' || value === null || seen.has(value)) {
        return
    }
    console.log(value);
    // 将数据添加到 seen 中，代表遍历地读取过了，避免循环引用引起的死循环
    seen.add(value)
    // 暂时不考虑数组等其他结构
    // 假设 value 就是一个对象，使用 for...in 读取对象的每一个值，并递归的调用 traverse 进行处理
    for (const key in value) {
        traverse(value[key], seen)
    }

    return value
}

// function isObject(value) {
//     const valueType = typeof value
//     return (valueType !== null && typeof value === 'object' || typeof value === 'function')
// }

// function deepClone(originValue) {
//     // 如果不是对象类型则直接将当前值返回
//     if (!(isObject(originValue))) return originValue

//     const newObject = {}
//     for (const key in originValue) {
//         newObject[key] = deepClone(originValue[key])
//     }

//     return newObject
// }

function watch(source, cb, options = {}) {
    // 定义 getter
    let getter
    // 如果 source 是函数，说明用户传递的是getter，所以直接把 source 赋值给 getter
    if (typeof source === 'function')
        getter = source
    else {
        // 如果传入的source是一个对象，那么 traverse 始终返回的是这个对象
        getter = () => traverse(source)
    }

    // 定义旧值与新值
    let oldValue, newValue


    // cleanup 用来存储用户注册的过期回调
    let cleanup

    //定义 onInalidate函数
    function onInvalidate(userFn) {
        // 将国企回调存储到 cleanup 中
        cleanup = userFn
    }

    // 提取scheduler 调度函数为一个独立的 job 函数
    const job = () => {
        // console.log(oldValue, 'old'); 已经改了
        // 这里也可以接受fn newValue = fn() 也可以，因为返回的effectFn和收集的依赖指向的是同一个副作用函数
        newValue = effectFn()

        // 在调用回调函数 cb 之前，先调用过期函数
        if (cleanup) {
            cleanup()
        }

        // 当数据变化时，调用回调函数
        cb(newValue, oldValue, onInvalidate)

        oldValue = newValue
    }

    const effectFn = effect(
        getter,
        {
            lazy: true,
            scheduler: () => {
                // 在调度函数中判断 flush 是否为 post ，如果是，将其放入微任务队列中
                if (options.flush === 'post') {
                    const p = Promise.resolve()
                    p.then(job)
                } else {
                    job()
                }
            },
        }
    )

    if (options.immediate) {
        job()
    } else {
        // 这里有个2缺陷
        //  1. 就是如果是对象，那么trigger只要执行了，值就会变，从而导致oldValue和newValue值一样
        //  2. 就是如果对象是深层次的，那么track的时候，那个target永远是代理对象，而key是最外层的key因此，嵌套对象当中的key是无法收集依赖的
        oldValue = effectFn()
    }
}

const data6 = { foo: 1, a: { b: 2 } }
const obj6 = new Proxy(data6, {
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


// watch(obj6, (old, newv) => {
//     console.log(old, newv);
// })
// obj6.a.b++


/**
 *  实验二 
 *  当我们第一次修改foo的值的时候，此时的cleanup为undefined，然后调用了watch的回调函数
 *      注意：调用watch的回调函数的时候，当中所有声明的变量都是新创建出来的
 *          --- 这个时候创建了第一个expired变量，值为false，然后向onInvalidate函数传递了一个控制该变量值的函数
 * 
 *  当我们第二次修改foo值得时候，此时的cleanup有值，值是我们第一次修改foo值时，用户传入的回调函数，然后调用该函数，使得第一次声明的expired变量的值变为true
 *  那么， if(!expired)的判断永远为假，使得第一次请求的结果不会赋值给finalDate变量。
 *  执行了这个cleanup回调函数之后，我们又重新调用了watch的回调函数，这个时候又创建了第二个expired变量，然后相同的向onInvaliDate传递了控制该变量值的回调函数
 *  接下来没有第三次修改，请求结果回来之后，将最新的结果赋值给了finalDate变量
 *  
 *  这个主要的思路是：在每一次数据发生变化，执行新的watch回调的之前，通过上一次watch回调传来的cleanup函数，将上一次watch回调当中的控制变量设置新值，清空过期
 *  的依赖(简单的说永远不执行最后的赋值语句)。
 *  这样反复的修改，只有最后一次修改数据所触发的watch回调的结果会赋值给finalDate
 */
// 第一次修改

let finalDate;
watch(obj6, async (newVal, oldValue, onInvalidate) => {
    let expired = false;
    onInvalidate(() => {
        expired = true
    })

    const res = await fetch('/test.js')

    if (!expired) {
        finalDate = res
    }
})


obj6.foo++

setTimeout(() => {
    //2秒后第二次修改
    obj6.foo++
}, 2000)