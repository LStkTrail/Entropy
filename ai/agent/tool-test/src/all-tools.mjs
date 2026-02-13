import { tool } from '@langchain/core/tools'
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { z } from 'zod'

// 1. 读取文件工具
const readFileTool = tool(
  async ({ filePath}) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      console.log(`  [工具调用] read_file("${filePath}")`)
      return `文件内容：\n${content}`
    } catch (error) {
      console.error(`  [读取文件失败] ${filePath}: ${error.message}`)
      return `读取文件失败: ${error.message}`
    }
  },
  {
    name: 'read_file',
    description: '读取指定路径的文件内容',
    schema: z.object({
      filePath: z.string().describe('要读取的文件路径'),
    }),
  },
)

// 2. 写入文件工具
const writeFileTool = tool(
  async ({ filePath, content}) => {
    try {
      const dir = path.dirname(filePath)
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(filePath, content, 'utf-8')
      console.log(`  [工具调用] write_file("${filePath}") - 成功写入 ${content.length} 字节`)
      return `文件写入成功: ${filePath}`
    } catch (error) {
      console.error(`  [写入文件失败] ${filePath}: ${error.message}`)
      return `写入文件失败: ${Error.message}`
    }
  },
  {
    name: 'write_file',
    description: '向指定路径写入文件内容，自动创建目录',
    schema: z.object({
      filePath: z.string().describe('要写入的文件路径'),
      content: z.string().describe('要写入的文件内容'),
    }),
  },
)

// 3. 执行命令工具（包含实时输出）
const execCommandTool = tool(
  async ({ command, workingDirectory }) => {
    const cwd = workingDirectory || process.cwd()
    console.log(`  [工具调用] exec_command("${command}") 在目录 ${cwd} 中执行`)
    
    return new Promise((resolve, reject) => {
      // 解析解析和参数
      const [cmd, ...args] = command.split(' ')
      const child = spawn(cmd, args, {
        cwd,
        stdio: 'inherit',
        shell: true,
      })
      let errorMsg = ''
      child.on('error', (error) => {
        errorMsg = error.message
      })

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`  [工具调用] execute_command("${command}") - 执行成功`)
          const cwdInfo = workingDirectory
            ? `\n\n重要提示: 命令在目录 ${workingDirectory} 中执行成功。如果需要在这个项目目录中继续操作，请使用 working_directory: "${workingDirectory}" 参数。不要使用 cd 命令。`
            : ''
          resolve(`命令执行成功: ${command}${cwdInfo}`)
        } else {
          console.log(`  [工具调用] execute_command("${command}") - 执行失败 (退出码: ${code})`)
          resolve(`命令执行失败: ${command} (退出码: ${code}${errorMsg ? `\n错误信息: ${errorMsg}` : ''})`)
        }
      })
    })
  },
  {
    name: 'execute_command',
    description: '执行系统命令，支持指定工作目录，实时输出命令执行结果',
    schema: z.object({
      command: z.string().describe('要执行的命令'),
      workingDirectory: z.string().describe('工作目录（推荐指定）'),
    }),
  },
)

// 4. 列出目录内容工具
const listDirectoryTool = tool(
  async ({ directoryPath }) => {
    try {
      const files = await fs.readdir(directoryPath)
      console.log(`  [工具调用] list_directory("${directoryPath}") - 成功列出 ${files.length} 个文件/目录`)
      return `目录内容: ${files.map(f => `- ${f}`).join('\n')}`
    } catch (error) {
      console.error(`  [列出目录失败] ${directoryPath}: ${error.message}`)
      return `列出目录失败: ${error.message}`
    }
  },
  {
    name: 'list_directory',
    description: '列出指定目录的内容，支持相对路径',
    schema: z.object({
      directoryPath: z.string().describe('要列出的目录路径'),
    }),
  }
)

export { readFileTool, writeFileTool, execCommandTool, listDirectoryTool }