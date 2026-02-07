function printUser() {
  // console.log("User is: ", name)
  console.log("!!!")
  return "Mamba out"
}

const p1 = new Promise((resolve) => 
  // setTimeout(() => { resolve("Kobe") }, 3000)
  setTimeout(resolve, 3000)
)

p1.then(printUser).then((data) => console.log(data))
p1.then((name) => printUser(name)).then((data) => console.log(data))
p1.then((name) => {printUser(name)}).then((data) => console.log(data))