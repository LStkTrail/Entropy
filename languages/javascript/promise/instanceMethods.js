const promise = new Promise((resolve, reject) => {
  let success = true
  if (success) {
    setTimeout(() => resolve("Hello"), 2000)
  } else {
    reject(new Error("Not good"))
  }
})

promise
  .then((data) => {
    console.log(`1. Data is: ${data}`)
    return "Next step!"
  })
  .then((data) => {
    console.log(`2. Data is: ${data}`)
    return "Next Next step!"    
  })
  .then((data) => {
    // throw new Error("This step is not good!")
    return Promise.reject(new Error("This step is not good!"))
  })
  .catch((err) => {
    console.error(`[ERROR]: [${err}]`)
    return "First Robot"
  })
  .finally(() => {
    console.log("Clearing...")
    return "Robot"
  })
  .then((data) => {
    console.log(data)
  })