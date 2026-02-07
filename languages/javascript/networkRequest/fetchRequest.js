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
