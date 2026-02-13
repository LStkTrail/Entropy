import { config } from 'dotenv'
import { ChatOpenAI } from '@langchain/openai'
import { fetch as undiciFetch, ProxyAgent } from 'undici'

config()

// 使用 SiliconFlow（国内、OpenAI 兼容，避免 ARK 超时）
const baseURL = process.env.ARK_BASE_URL || 'https://api.siliconflow.cn/v1'
const modelName = process.env.ARK_MODEL_NAME || 'deepseek-ai/DeepSeek-V3'
const apiKey = process.env.ARK_API_KEY

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
const configuration = {
    baseURL,
    timeout: 120000
}
if (proxyUrl) {
    const dispatcher = new ProxyAgent(proxyUrl)
    configuration.fetch = (url, opts) => undiciFetch(url, { ...opts, dispatcher })
    console.log('使用代理:', proxyUrl)
}

console.log(`BASE_URL: ${baseURL}`)
console.log(`MODEL_NAME: ${modelName}`)

const model = new ChatOpenAI({
    model: modelName,
    apiKey,
    configuration,
    timeout: 120000,
    streamUsage: false
})

try {
    console.log("正在请求模型，请稍后...")
    const response = await model.invoke("10个字介绍一下自己")
    console.log("请求成功：", response.content)
} catch (error) {
    console.error("请求失败，错误详情：", error)
    if (error.name === 'TimeoutError') {
        console.error("提示：若在受限网络环境，可配置 HTTP_PROXY/HTTPS_PROXY 或检查 SILICONFLOW_API_KEY 是否有效")
    }
}