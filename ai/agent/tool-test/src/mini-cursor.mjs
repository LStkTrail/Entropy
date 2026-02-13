import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages'
import { readFileTool, writeFileTool, execCommandTool, listDirectoryTool } from './all-tools.mjs'

import { fetch as undiciFetch, ProxyAgent } from 'undici'
import chalk from 'chalk'

const baseURL = process.env.ARK_BASE_URL
const modelName = process.env.ARK_MODEL_NAME
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

const model = new ChatOpenAI({
  model: modelName,
  apiKey: apiKey,
  temperature: 0,
  configuration,
  streamUsage: false
})

const tools = [
  readFileTool,
  writeFileTool,
  execCommandTool,
  listDirectoryTool
]

const modelWithTools = model.bindTools(tools)

// Agent 执行函数
async function runAgentWithTools(query, maxIterations = 30) {
  const messages = [
    new SystemMessage(`你是一个项目管理助手，使用工具完成任务。
      
当前工作目录: ${process.cwd()}

工具:
1. read_file：读取文件
2. write_file：写入文件
3. execute_command：执行命令（支持 workingDirectory 参数）
4. list_directory：列出目录

重要规则 - execute_command 工具：
- workingDirectory 参数会自动切换到指定目录中
- 当使用 workingDirectory 参数时，绝对不要在 command 中使用 cd 命令
- 错误示例：{ command: "cd react-todo-app && pnpm install", workingDirectory: "react-todo-app" }
这是错误的，因为 workingDirectory 已经在 react-todo-app 目录中，再使用 cd react-todo-app 会找不到目录
- 正确示例：{ command: "pnpm install", workingDirectory: "react-todo-app" }
这是正确的，因为 workingDirectory 已经在 react-todo-app 目录中，直接执行命令即可

回复要简洁，只需要说做了什么`),
    new HumanMessage(query),
  ]

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen(`正在 AI 思考...[${i + 1}/${maxIterations}]`))

    const response = await modelWithTools.invoke(messages)
    messages.push(response)

    // 检查是否有工具调用
    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log('\n[最终响应]:', response.content)
      return response.content
    }

    // 执行所有工具调用
    for (const toolCall of response.tool_calls) {
      const foundTools = tools.find(t => t.name === toolCall.name)
      if (foundTools) {
        const toolResults = await foundTools.invoke(toolCall.args)
        messages.push(new ToolMessage(toolResults, toolCall.id))
      }
    }
  }

  return messages[messages.length - 1].content
}


const case1 = `创建一个功能丰富的 React TodoList 应用：

1. 创建项目：echo -e "n\nn" | pnpm create vite react-todo-app --template react-ts
2. 修改 src/App.tsx，实现完整功能的 TodoList：
  - 添加、删除、编辑、标记完成
  - 分类筛选（全部/进行中/已完成）
  - 统计信息显示
  - localStorage 数据持久化
3. 添加复杂样式：
  - 渐变背景（蓝到紫）
  - 卡片阴影、圆角
  - 悬停效果
4. 添加动画：
  - 添加/删除时的过渡动画
  - 使用 CSS transition
5. 列出目录确认

注意：使用 pnpm，功能要完整，样式要美观，要有动画效果

之后再 react-todo-app 项目中：
1. 使用 pnpm install 安装依赖
2. 使用 pnpm run dev 启动服务器
`

try {
  await runAgentWithTools(case1)
} catch (error) {
  console.error('执行失败:', error)
} finally {
  console.log(chalk.bgRed('执行结束'))
}