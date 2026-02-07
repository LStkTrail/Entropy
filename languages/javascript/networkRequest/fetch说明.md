# `fetch` 说明

`fetch` 基于 Promise 设计，可以使用 `async/await`。

---

## 1. 核心概念与工作流程

在使用 `fecth` 之前，需要理解它与传统请求流程的关键区别：**两步处理**。

1. **第一步**：`fetch()` 返回一个 Promise，该 Promise 解析为 `Response` 对象（只要服务器有响应，不管是 200 还是 404，都会成功）
2. **第二步**：需要调用 `Response` 对象的方法（例如 `.json()` ）来获取实际的响应体数据，这也会返回一个 Promise

> **什么是 Promise 解析为 `Response` 对象？**
> 
> 当 `fetch` 的 Promise 对象状态变为 `fulfilled` 时，它传递给回调函数的那个值就是一个浏览器内置的 `Response` 类的实例，即该 Promise 中的执行器函数中是 `reslove(Response实例)`

---

## 2. 基础用法（GET 请求）

### 使用 `async/await`

```js
async function fetchData(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Http Error, status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Fetch Error: ", error)
  }
}

const url = "https://jsonplaceholder.typicode.com/todos/1"
fetchData(url).then((data) => {
  console.log(`Use then, data is [${data}]`)
})
const result = await fetchData(url)
console.log(`Use await, result is [${result}]`)

```

### 使用 `then()` 链式调用

```js
const url = "https://jsonplaceholder.typicode.com/todos/1"
fetch(url)
  .then(response => {
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    return response.json()
  })
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error))
```

---

## 发送数据（POST 请求）

发送数据时，需要传递第二个参数：配置对象（`options`）。

```js
const path = require("path")

require("dotenv").config({
  path: path.resolve(__dirname, "../../../.env"),
})

const apiKey = process.env.API_KEY
const baseUrl = process.env.BASE_URL
const modelId = process.env.MODEL_ID

async function main() {
  if (!apiKey) { throw new Error("Missing API_KEY in .env") }
  if (!modelId) { throw new Error("Missing MODEL_ID in .env") }

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: "user", content: "用一句话介绍自己" }
      ],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`HTTP ${res.status}: ${errText}`)
  }

  const data = await res.json()
  console.log(data.choices[0].message.content)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

