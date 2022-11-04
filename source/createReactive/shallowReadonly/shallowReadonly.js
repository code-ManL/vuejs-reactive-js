
import { createReactive } from '../createReactive.js'

export function shallowReadonly(obj) {
    return createReactive(obj, true, true)
}
