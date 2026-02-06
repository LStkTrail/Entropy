// 构造一个虚拟的异步操作
function downloadFile(fileName, callback) {
  console.log(`1. 开始下载文件 ${fileName}...`)

  setTimeout((param1, param2) => {
    console.log(`2. 文件 ${fileName} 下载完成！`)
    console.log(param1)
    console.log(param2)
    callback("Fake Data");
  }, 2000, "A", "B")
}

console.log("Start...")

downloadFile("photo.png", (data) => {
  console.log(`3. 接收到文件数据[${data}]，开始处理...`)
})

console.log("End...")