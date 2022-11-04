// 重试机制
function test(options) {
    return Promise.reject(2).catch(e => {
        console.log(e)
        if (options.onError) {
            return new Promise((resolve, reject) => {
                const retry = () => {
                    // 如果执行了这里,需要先去执行test()函数
                    resolve(test())
                }

                const fail = () => reject(e)

                options.onError(retry, fail)
            })
        } else {
            throw error
        }
    })
}

test({
    onError(a, b) {
       a()
    }
}).then(r => {
    console.log('走了');
    console.log(r);
    return Promise.reject(3)
}).catch(e => {
    console.log(e);
}).finally(f => {
    console.log('finally');
})
