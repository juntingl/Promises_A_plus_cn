const PENDING   = 'pending',
      FULFILLED = 'fulfilled',
      REJECTED  = 'rejected';

/**
 * promise 解析流程操作
 * @param {Object} promise2 promise 实例化对象
 * @param {*} x 值，传递过来回调函数的值 （普通的 JavaScript 值，thenable、promise、error）
 * @param {*} resolve TODO: 因为目前 MyPromise 本身还没有实现 resolve 和 reject 的静态方法，所以暂时先传递进来
 * @param {*} reject
 */
function resolutionProcedure (promise2, x, resolve, reject) {
  if(promise2 === x) {
    // 通过 reject 抛出去时，被捕获时以是一个 String，不会立即提示，而需要下一个 then 时才能被抛出, 所以在这里直接进行抛出捕获
    try {
      throw new TypeError('TypeError: Chaining cycle detected for promise #<MyPromise>')
    } catch (error) {
      console.log(error)
      reject(error)
    }
  }
  let isCalled = false;

  // 如果 x 是一个对象、函数、promise, 将执行 then 方法
  if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
    // x 是否存在 then 方法
    try {
      let then = x.then; // 先保存其引用

      if (typeof then === 'function') {
        if (isCalled) return
        isCalled = true

        then.call(x,
          (y) => {
            resolutionProcedure(promise2, y, resolve, reject)
          },
          (r) => {
            reject(r)
          }
        )
      } else {
        // 不是一个函数
        resolve(x)
      }
    } catch (error) {
      reject(error)
    }
  } else {
    // 普通值
    resolve(x)
  }
}

class MyPromise {
  constructor(executor) {
    this.status = PENDING;
    this.value  = undefined;
    this.reason = undefined;

    // 针对异步回调，进行收集
    this.onFulfilledList = [];
    this.onRejectedList = []

    // 提供给予外部回调函数（resolve、reject），来修改当前 promise 状态
    const resolve = (value) => {
      if (this.status === PENDING) {
        this.status = FULFILLED;
        this.value = value;
        // 发布
        this.onFulfilledList.forEach(fn => fn())
      }
    }
    const reject = (reason) => {
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
        // 发布
        this.onRejectedList.forEach(fn => fn())
      }
    }
    // 执行，已供外部可以拿到回调函数
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error)
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => {
      throw new Error(reason)
    };
    let isCalled = false; // 防止被重复调用
    const promise2 = new MyPromise((resolve, reject) => {

      if (this.status === FULFILLED) {
        if (isCalled) return
        isCalled = true;
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value)
            resolutionProcedure(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        }, 0)
      }

      if (this.status === REJECTED) {
        if (isCalled) return
        isCalled = true;
        setTimeout(() => {
          try {
            let x = onRejected(this.reason)
            resolutionProcedure(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        }, 0)
      }

      if (this.status === PENDING) {
        // 订阅
        this.onFulfilledList.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value)
              resolutionProcedure(promise2, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          }, 0);
        });
        this.onRejectedList.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason)
              resolutionProcedure(promise2, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          }, 0);
        });
      }
    })

    return promise2;
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  static resolve () {}

  static reject() {}

  static all () {}

  static race() {}
}

module.exports = MyPromise;