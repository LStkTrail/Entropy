import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import { tool } from '@langchain/core/tools'
import { HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages'
import fs from 'node:fs/promises'
import { z } from 'zod'
import { fetch as undiciFetch, ProxyAgent } from 'undici'

const baseURL = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1'
const modelName = process.env.SILICONFLOW_MODEL_NAME || 'deepseek-ai/DeepSeek-V3'
const apiKey = process.env.SILICONFLOW_API_KEY

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

const readFileTool = tool(
  async ({ filePath }) => {
    const content = await fs.readFile(filePath, 'utf-8')
    console.log(`[工具调用] read_file("${filePath}")`)
    return `文件内容：\n${content}`
  },
  {
    name: 'read_file',
    description: '使用此工具读取文件内容。当用户要求读取文件、查看代码、分析文件内容时，调用此工具。输入文件路径（可以是相对路径或绝对路径）。',
    schema: z.object({
      filePath: z.string().describe('要读取的文件路径'),
    }),
  }
)

const tools = [
  readFileTool
]

const modelWithTools = model.bindTools(tools)

const messages = [
  new SystemMessage(`你是一个代码助手，可以使用工具读取文件并解释代码。
    
工作流程：
1. 用户要求读取文件时，立即调用 read_file 工具
2. 等待工具返回文件内容
3. 基于文件内容进行分析和解释

可用工具：
- read_file：读取文件内容（可以使用此工具获取文件内容）
`),
  new HumanMessage('请读取 src/tool-file-read.mjs 文件内容并解释代码')
]

let response = await modelWithTools.invoke(messages)
// console.log(response)

messages.push(response)

while (response.tool_calls && response.tool_calls.length > 0) {
  console.log(`\n[检测到 ${response.tool_calls.length} 个工具调用]`)

  // 执行所有工具调用
  const toolResults = await Promise.all(
    response.tool_calls.map(async (toolCall) => {
      const tool = tools.find(t => t.name === toolCall.name)
      if (!tool) {
        throw new Error(`未找到工具: ${toolCall.name}`)
      }
      
      console.log(`[执行工具] ${tool.name}(${JSON.stringify(toolCall.args)})`)

      try {
        const result = await tool.invoke(toolCall.args)
        console.log(`[工具返回] ${tool.name}: ${result}`)
        return result
      } catch (error) {
        console.error(`[工具调用失败] ${tool.name}: ${error.message}`)
        return `工具调用失败: ${error.message}`
      }
    })
  )

  response.tool_calls.forEach((toolCall, index) => {
    messages.push(new ToolMessage(toolResults[index], toolCall.id))
  })

  response = await modelWithTools.invoke(messages)
  messages.push(response)
}

console.log('\n[最终响应]:', response.content)
