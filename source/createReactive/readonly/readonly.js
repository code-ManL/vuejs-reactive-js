
import { createReactive } from '../createReactive.js'

export function readonly(obj) {
    return createReactive(obj, false, true)
}
