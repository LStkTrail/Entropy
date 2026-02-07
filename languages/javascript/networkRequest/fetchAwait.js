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

fetchData(("https://unsdasa")).catch(console.error)