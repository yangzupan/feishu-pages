# Feishu Docx

将飞书文档转换为其他格式（Markdown、HTML等）

访问 [https://github.com/longbridge/feishu-pages](https://github.com/longbridge/feishu-pages) 了解更多信息。

## 如何添加新的测试用例

参考：https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document/list

## 安装

```bash
pnpm add @pange/feishu-docx
```

## 使用

```typescript
import { MarkdownRenderer } from '@pange/feishu-docx'

// 从文件加载文档JSON
const docx = fs.readFileSync('test.json')
const render = new MarkdownRenderer(docx)
const text = render.parse();
const fileTokens = render.fileTokens;
```

此时 `fileTokens` 的内容为：

```js
{
  "TVEyb1pmWo8oIwxyL3kcIfrrnGd": {
      token: 'TVEyb1pmWo8oIwxyL3kcIfrrnGd',
      type: 'file',
  }
}
```

## 许可证

MIT
