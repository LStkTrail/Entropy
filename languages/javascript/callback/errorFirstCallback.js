function divide(a, b, callback) {
  setTimeout(() => {
    if (b == 0) callback(new Error("除数不能为 0"), null)
    else callback(null, a / b)
  }, 1000)
}

divide(10, 2, (err, result) => {
  if (err) return console.error(err.message)
  console.log("结果是：", result)
})
divide(10, 0, (err, result) => {
  if (err) return console.error(err.message)
  console.log("结果是：", result)
})