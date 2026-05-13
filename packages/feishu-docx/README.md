# Feishu Docx

将飞书文档转换为其他格式（Markdown、HTML等）

访问 [https://github.com/yangzupan/feishu-pages](https://github.com/yangzupan/feishu-pages) 了解更多信息。

## 功能特性

- 📝 支持将飞书新版文档 Docx 转换为 Markdown 格式
- 🖼️ 支持图片、附件、画板等资源处理
- 🎨 支持多种块类型：标题、列表、代码块、表格、高亮块、分栏等
- 🔗 支持文档引用和链接转换
- 🌐 支持国际化内容和公式渲染
- 📊 支持复杂表格（含合并单元格）转换为 HTML

## 安装

```bash
pnpm add @pange/feishu-docx
```

## 使用

### 基本用法

```typescript
import { MarkdownRenderer } from '@pange/feishu-docx'
import * as fs from 'fs'

// 从文件加载文档JSON
const docx = JSON.parse(fs.readFileSync('test.json', 'utf-8'))
const renderer = new MarkdownRenderer(docx)
const markdown = renderer.parse()
const fileTokens = renderer.fileTokens
```

此时 `fileTokens` 的内容为：

```js
{
  "TVEyb1pmWo8oIwxyL3kcIfrrnGd": {
      token: 'TVEyb1pmWo8oIwxyL3kcIfrrnGd',
      type: 'image', // 或 'file' | 'board'
  }
}
```

### 高级用法

```typescript
import { MarkdownRenderer, BlockType } from '@pange/feishu-docx'

// 创建渲染器实例
const renderer = new MarkdownRenderer(docx, {
  outputUnsupported: true // 输出不支持的块类型信息
})

// 解析整个文档
const markdown = renderer.parse()

// 获取页面元数据（从第一个代码块中提取 YAML/JSON）
const meta = renderer.meta

// 遍历所有块
renderer.blocks.forEach(block => {
  if (block.block_type === BlockType.Heading1) {
    console.log('找到一级标题:', block.heading1)
  }
})
```

## API 参考

### MarkdownRenderer

主要的渲染器类，用于将飞书文档转换为 Markdown 格式。

#### 构造函数

```typescript
new MarkdownRenderer(docx: any, options?: RendererOptions)
```

**参数：**
- `docx`: 飞书文档的 JSON 数据结构
- `options`: 可选配置项
  - `outputUnsupported`: 是否输出不支持的块类型信息（默认: false）

#### 方法

##### `parse(): string`

解析整个文档并返回 Markdown 字符串。

##### `parseBlock(block: Block, indent: number): string`

解析单个块元素。

**参数：**
- `block`: 要解析的块元素
- `indent`: 缩进级别

**返回：** 解析后的 Markdown 字符串

#### 属性

##### `fileTokens: Record<string, FileToken>`

文档中引用的所有文件、图片和画板的令牌集合。

##### `meta: any`

从文档第一个代码块中提取的页面元数据（YAML 或 JSON 格式）。

##### `blocks: Record<string, Block>`

文档中所有块的映射表，key 为 block_id。

## 支持的块类型

| 块类型 | 说明 | Markdown 输出 |
|--------|------|---------------|
| Page | 文档根节点 | `# 标题` |
| Text | 段落文本 | 普通文本 |
| Heading1-9 | 各级标题 | `#` 到 `#########` |
| Bullet | 无序列表 | `- 项目` |
| Ordered | 有序列表 | `1. 项目` |
| Code | 代码块 | `\`\`\`language ... \`\`\`` |
| Quote | 引用 | `> 引用内容` |
| TodoList | 待办事项 | `- [x]` 或 `- [ ]` |
| Divider | 分割线 | `---` |
| Image | 图片 | `<img>` HTML 标签 |
| Table | 表格 | Markdown 表格或 HTML 表格 |
| Callout | 高亮块 | HTML div 结构 |
| Grid | 分栏布局 | HTML div 结构 |
| File | 文件附件 | `[文件名](token)` |
| Board | 画板 | `<img>` HTML 标签 |
| Iframe | iframe 嵌入 | `<iframe>` 标签 |
| SyncedBlock | 同步块 | 递归渲染子块 |

## 如何添加新的测试用例

参考：https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document/list

1. 在飞书中创建一个包含新特性的文档
2. 通过飞书 API 获取文档的 JSON 数据
3. 将 JSON 数据保存为测试文件
4. 编写测试用例验证转换结果



## 参考项目

- [feishu-pages](https://github.com/longbridge/feishu-pages)



## 许可证

MIT

