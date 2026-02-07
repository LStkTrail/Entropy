const promise = new Promise((reslove, reject) => {
  const success = true
  setTimeout(() => {
    if (success) {
      reslove("Success!", "Hello")
    } else {
      reject(new Error("Fail"))
    }
  }, 2000)
})

promise.
  then((data, str) => {
    console.log("Receive data: ", data)
    console.log("Receive str: ", str)
    return "Next Step"
  })
  .then((data) => {
    console.log("Next receive data: ", data)
  })