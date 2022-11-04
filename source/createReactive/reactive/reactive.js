
import { createReactive } from '../createReactive.js'

//  定义一个 Map 实例，存储原始对象到代理对象的映射
const reactiveMap = new Map()

export function reactive(obj) {
    // 优先通过原始对象 obj 寻找之前创建的代理对象，如果找到了，直接返回已有的代理对象，简单的说就是代理过的对象不再重复代理，取出之前创建的代理对象返回
    const existionProxy = reactiveMap.get(obj)
    if (existionProxy)
        return existionProxy

    // 否则，创建新的代理对象
    const proxy = createReactive(obj)

    // 存储到 Map 中，从而帮忙重复创建
    reactiveMap.set(obj, proxy)

    return proxy
}
