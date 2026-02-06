function downloadFile(fileName, callback) {
  console.log(`1. 开始下载文件 ${fileName}...`)

  setTimeout(() => {
    console.log(`2. 文件 ${fileName} 下载完成！`)
    callback(`Fake Data - (${fileName})`);
  }, 2000)
}

downloadFile("photo1.png", (data) => {
  console.log(`3. 接收到文件数据[${data}]，开始处理...`)
  downloadFile("photo2.png", (data) => {
    console.log(`3. 接收到文件数据[${data}]，开始处理...`)
  })
})