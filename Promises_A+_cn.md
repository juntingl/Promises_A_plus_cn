# Promises/A+

> 为开发者自行实现 Promise 提供可依据、参考、遵守的规范.

一个开放的标准，实现可靠，可互操作的 JavaScript Promise 标准，由开发者定制，供开发者参考。

Promise 表示异步操作的最终结果。与 Promise 主要的互动方式是通过它的 `then` 方法，该方法通过注册回调函数来接收 Promise 的最终值或 Promise 无法履行的原因。

此规范详细说明了 `then` 方法的行为，提供可互操作的基础，所有符合 Promises/A+ 规范的 Promise 都可以遵循依赖与提供。因此，此规范应该被认为非常稳定。尽管 Promises/A+ 组织可能偶尔会修改此规范，并进行微小的向下兼容的更改，来解决新发现的极端情况，我们只有经过认真考虑、讨论和测试，才会进行大规模和不向下兼容的变更。

从历史上看，Promises/A+ 阐明了早期提出的 Promises/A 提案的行为条款，在其事实行为的基础上进行扩展，并省略了未指定或有问题的部分。

最后，核心 Promises/A+ 规范没有涉及如何创建、履行、或拒绝承诺，而是选择专注于提供可互操作的 `then` 方法。这些配套规范在未来工作中可能涉及到这些主题。

## 1. 术语

1.1 “promise” 是一个具有 `then` 方法的对象或函数，其行为符合此规范。

1.2 “thenable” 是一个对象或函数，它定义了一个 `then` 方法。

1.3 “value” 是任何合法的 JavaScript 值（包括 `undefined`、`thenable` 或 `promise`）。

1.4 “exception” 是一个使用 `throw` 语句抛出的值。

1.5 “reason” 是一个值，表明 promise 被拒绝的原因。

## 2. 要求

### 2.1 Promise 的状态

Promise 必须以下三种状态之一：`pending`、`fulfilled`、`rejected`。

**2.1.1 等待时（初始态 pending):**

  * 2.1.1.1 promise 可以过渡到 `fulfilled` 或 `rejected` 状态

**2.1.2 完成后（fulfilled）:**

  * 2.1.2.1 不能过渡到任何其他状态了。

  * 2.1.2.2 必须有一个不能改变值。

**2.1.3 拒绝时 （rejected) :**

  * 2.1.3.1 不能过渡到其他状态了。

  * 2.1.3.2 必须要有一个不能改变拒绝原因。

> 在这里，“不能改变” 指的是恒等于 （即可用 === 判断相等），但不意味着更深层次的不可变。对于是引用类型值，其属性是可以更改的。

### 2.2 then 方法

promise 必须提供一个 `then` 方法来访问其当前或最终的值或拒绝理由。

promise 的 `then` 方法接受两个参数：

```js
promise.then(onFulfilled, onRejected)
```

**2.2.1 onFulfilled 和 onRejected 两个都是可选参数 :**

  * 2.2.1.1 如果 `onFulfilled` 不是一个函数，则必须被忽略它。
  * 2.2.1.2 如果 `onRejected` 不是一个函数，则必须被忽略它。

**2.2.2 如果 `onFulfilled` 是一个函数**

  * 2.2.2.1 它必须在 `promise` 完成后被调用，并将 `promise` 的值作为其第一个参数。
  * 2.2.2.2 在 `promise` 完成之前不得调用它。
  * 2.2.2.3 它不能被多次调用。

**2.2.3 如果 `onRejected` 是一个函数**

  * 2.2.3.1 它必须在 `promise` 拒绝后被调用，并将 `promise` 的值（拒绝理由）作为其第一个参数。
  * 2.2.3.2 在 `promise` 被拒绝之前不能再调用它。
  * 2.2.3.3 它不能被多次调用。

**2.2.4 onFulfilled 或 onRejected 在执行上下文堆栈仅包含平台代码之前不得调用.** [[3.1]()]

**2.2.5 onFulfilled 和 onRejected 必须作为函数调用（即没有 `this` 值）**

**2.2.6 `then` 可以在同一个 `promise` 上多次调用**

  * 2.2.6.1 如果/当 `promise` 为完成时，所有相应的 `onFulfilled` 回调必须按照其原始调用的顺序执行。
  * 2.2.6.2 如果/当 `promise` 为拒绝状态时，所有相应的 `onRejected` 回调必须按照其原始调用的顺序执行。

**2.2.7 `then` 方法必须返回一个 `promise`**[[3.2]()]

```js
  promise2 = promise1.then(onFulfilled, onRejected)
```

  * 2.2.7.1 如果 onFulfilled 或 onRejected 两者任意一个返回一个值 `x`, 运行 Promise 解决程序：`[[Resolve]](promise2, x)`。
  * 2.2.7.2 如果 onFulfilled 或 onRejected 抛出一个异常 `e`, `promise2` 必须以 `e` 为拒绝理由来拒绝。
  * 2.2.7.3 如果 onFulfilled 不是一个函数并且 `promise1` 已是完成时， `promise2` 必须使用与 `promise1` 相同的值进行返回。
  * 2.2.7.4 如果 onRejected 不是一个函数并且 `promise1` 已被拒绝状态， `promise2` 必须拒绝，其拒绝原因与 `promise1` 一样。

### 2.3 Promise 解析过程

promise 解析过程是一个抽象的操作，将 promise 和 value 作为输入，我们将其表示为 `[[Resolve]](promise, x)`。如果 `x` 是一个 `thenable`, 它试图让 `promise` 采用 `x` 的状态。在假设 `x` 行为至少有点像 `promise`。 否则，就会用 `x` 来完成 promise。

对 `thenable` 的这种处理允许 promise 实现进行相互操作，只要他们公开符合 Promise/A+ 的 `then`方法即可。它还允许 Promise/A+ 实现使用合理的 `then` 方法“同化”不一致的实现。

运行 `[[Resolve]](promise, x)`，请执行以下步骤：

**2.3.1 如果 `promise` 和 `x` 引用同一个对象，以 `TypeError` 作为原因拒绝 `promise`**

**2.3.2 如果 `x` 是一个 promise, 采用其状态[[3.4]()]：**

  * 2.3.1.1 如果 `x` 是 'pending' 状态，`promise` 必须保持 `pending` 状态，直到 `x` 完成后（fulfilled）或拒绝（rejected）
  * 2.3.1.2 如果/当 `x` 是 'fulfilled' 状态，则用相同的值实现 `promise`。
  * 2.3.1.3 如果/当 `x` 是 'rejected' 状态，则用相同的理由拒绝 `promise`。

**2.3.3 否则，如果 `x` 是一个对象或函数**

  * 2.3.3.1 让 `then` 成为 `x.then`[[3.5]()]
  * 2.3.3.2 如果检索属性 `x.then` 会导致抛出异常 `e`, 以 `e` 为理由拒绝 promise。
  * 2.3.3.3 如果 `then` 是一个函数，则用 `x` 作为 `this` 调用它，第一个参数是 `resolvePromise`，第二个参数是 `rejectPromise`，其中：
    * 2.3.3.3.1 如果/当使用值 `y` 来调用 `resolvePromise` 时，运行 `[[Resolve]](promise, y)`
    * 2.3.3.3.2 如果/当使用理由 `r` 来调用 `rejectPromise` 时，使用 `r` 为拒绝理由拒绝 `promise`.
    * 2.3.3.3.3 如果同时调用 `resolvePromise` 和 `rejectPromise`，或者对同一个参数进行多次调用，则以第一次调用优先，任何进一步调用都被忽略。
    * 2.3.3.3.4 如果调用 `then` 方法的时候抛出一个异常 `e`
      * 2.3.3.3.4.1 如果已调用 `resolvePromise` 或 `rejectPromise`，请忽略它。
      * 2.3.3.3.4.2 否则，以 `e` 为理由拒绝 `promise`。
  * 2.3.3.4 如果 `then` 不是一个函数，用 `x` 值作为 `promise` 完成时的值。

**2.3.4 如果 `x` 不是一个对象或函数，用 `x` 值作为 `promise` 完成时的值。**

## 3. 记录

3.1 这里 “平台代码”表示的是引擎、环境和 `promise` 实现代码。实际上，此要求确保 `onFulfilled` 和 `onRejected` 异步执行，在调用 “then” 的事件循环之后，使用一个新的堆栈。这可以使用 “宏任务
（macro-task）”机制(如 setTimeout 或 setImmediate) 实现，也可以使用“微任务（micro-task）”机制（如 MutationObserver 或 process.nextTick）实现。由于 `promise` 实现被认为是平台代码，因此它本身可能包含一个任务调用队列（task-scheduling queue）或 "trampoline"，其中调用处理程序。

3.2 在严格模式下，`this` 在他们内部将是 `undefined`; 在宽松模式（sloppy mode）, `this` 将是全局对象（global object）。

3.3 如果实现可以满足所有要求，则可以允许 `promise2 === promise1`。每个实现都应该记录它是否能够生成 `promise2 === promise1`,以及在什么条件下产生。

3.4 通常，如果 `x` 符合当前实现，我们才认为它是真正的 promise。允许使用特定的实现的方法来采用已知符合的 promise 的状态。

3.5 此过程我们先存储引用 `x.then`，然后测试并调用该引用，避免多次访问该 `x.then` 属性。这些预防措施对于确保访问者属性的一致性非常重要，访问者属性的值可能会在检索之间发生变化。

3.6 实现对 `thenable` 链的深度不受任何限制，并假设超出限制递归将是无限的。只有真正的循环才会导致 `TypeError` 错误; 如果遇到一个不同的 `thenable` 的无限链，那么永远递归才是正确的行为。

## 参考文献

* [Promises/A+ 规范原文](https://promisesaplus.com/)
