/*
    toRef 返回
    {
        get Value() {
            ....
        }
    }
*/
export function proxyRefs(target) {
    return new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver)
            // 自动 ref 实现：如果读取的值是 ref，则返回它的 value 属性值
            return value.__v_isRef ? value.value : value
        },
        set(target, key, newValue, receiver) {
            // 通过 target 读取真实值
            const value = target[key]

            // 如果是 Ref,则设置对应的 value 属性值
            if (value.__v_isRef) {
                value.value = newValue
                return true
            }

            return Reflect.set(target, key, newValue, receiver)
        },
    })
}

export function toRef(obj, key) {
    const wrapper = {
        get value() {
            // 如果这里是一个对象会调用 reactive 包装
            return obj[key]
        },
        // 允许设置值
        set value(val) {
            obj[key] = val
        }
    }

    //  定义一个不可枚举 且 不可写的属性，__v_isRef 为true，代表这个对象是 ref
    Object.defineProperty(wrapper, '__v_isRef', {
        value: true
    })

    return wrapper
}


export function toRefs(obj) {
    const ret = {}
    //  使用 for...in 循环遍历对象
    for (const key in obj) {
        // 逐个调用 toRef 完成转换
        ret[key] = toRef(obj, key)
    }
    return ret
}

/*
   

const newobj = {
    foo: {
        get value() {
            return obj.foo
        }
    },
    bar: {
        get value() {
            return obj.bar
        }
    }
}


*/