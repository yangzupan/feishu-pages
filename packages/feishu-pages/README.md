# Feishu Pages

将飞书Wiki生成为Markdown，用于配合静态页面生成器使用

访问 [https://github.com/yangzupan/feishu-pages](https://github.com/yangzupan/feishu-pages) 了解更多信息。

## 功能特性

- 📚 导出飞书知识库为 Markdown 文件
- 📁 保持知识库的目录结构组织
- 🖼️ 自动下载图片、附件和画板等资源
- 🔗 智能处理内部文档链接
- 🌐 支持国际化内容
- 📊 生成 SUMMARY.md 导航文件
- 💾 支持缓存机制，提高重复执行效率
- 🎨 支持 PicList 图床上传
- ⚙️ 灵活的环境变量配置
- 🔄 与 GitHub Actions 无缝集成

## 安装

```bash
pnpm add @pange/feishu-pages
```

## 快速开始

### 1. 创建飞书应用并配置权限

在开始使用之前，必须先完成飞书开放平台的配置工作：

1. 访问 [https://open.feishu.cn/app](https://open.feishu.cn/app) 创建一个新应用
2. 获取 `App ID` 和 `App Secret`
3. 为应用开启以下权限：
   - `docx:document:readonly` - 读取文档内容
   - `wiki:wiki:readonly` - 读取知识库
   - `drive:drive:readonly` - 读取云空间文件
   - `board:whiteboard:node:read` - 读取画板
4. 将应用发布为正式版本
5. 在飞书 IM 中创建群聊，将应用添加为机器人
6. 在知识库设置中将此群聊添加为**管理员**

> ⚠️ 如果不将应用设置为知识库管理员，会遇到 `permission denied: wiki space permission denied` 错误。

### 2. 获取知识库空间 ID

从知识库 URL 中获取 `space_id`：

```
https://your-company.feishu.cn/wiki/settings/6992046856314306562
                                              ^^^^^^^^^^^^^^^^^^^
                                              这就是 space_id
```

### 3. 配置环境变量

创建 `.env` 文件（参考 `.env.default`）：

```bash
# 飞书应用配置
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
FEISHU_SPACE_ID=your_space_id

# 输出配置
OUTPUT_DIR=./dist
BASE_URL=/

# URL 样式（optional）
# original: 使用原始 token 作为 URL
# nested: 使用嵌套 slug 路径
URL_STYLE=nested
```

### 4. 运行命令

```bash
npx @pange/feishu-pages
```

或在 package.json 中添加脚本：

```json
{
  "scripts": {
    "fsp": "feishu-pages"
  }
}
```

然后运行：

```bash
npm run fsp
```

## 配置选项

### 环境变量

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `FEISHU_ENDPOINT` | 飞书 API 端点（国内版/国际版） | 否 | `https://open.feishu.cn` |
| `FEISHU_APP_ID` | 飞书应用 ID | 是 | - |
| `FEISHU_APP_SECRET` | 飞书应用密钥 | 是 | - |
| `FEISHU_SPACE_ID` | 飞书知识库空间 ID | 是 | - |
| `FEISHU_LOG_LEVEL` | SDK 日志级别 (0-4) | 否 | `1` |
| `OUTPUT_DIR` | 输出目录路径 | 否 | `./dist` |
| `BASE_URL` | 基础 URL 路径前缀 | 否 | `/` |
| `ROOT_NODE_TOKEN` | 根节点令牌（从指定节点开始导出） | 否 | 空（导出整个知识库） |
| `URL_STYLE` | URL 样式：`original` 或 `nested` | 否 | `original` |
| `SKIP_ASSETS` | 是否跳过资源下载（true/false） | 否 | `false` |

### PicList 图床配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PICLIST_ENABLED` | 是否启用 PicList 上传 | `false` |
| `PICLIST_API_URL` | PicList API 地址 | `http://127.0.0.1:36677` |
| `PICLIST_KEY` | PicList API 密钥 | 空 |

## 输出结构

运行成功后，输出目录结构如下：

```
dist/
├── docs/                 # Markdown 文档目录
│   ├── assets/          # 下载的资源文件（图片、附件等）
│   ├── SUMMARY.md       # 导航文件
│   └── ...              # 按知识库结构组织的 Markdown 文件
├── docs.json            # 文档元数据 JSON 文件
└── .cache/              # 缓存文件（加速重复执行）
```

### docs.json

包含所有文档的元数据信息，可用于：
- 生成自定义导航
- 构建搜索索引
- 集成到静态站点生成器

### SUMMARY.md

自动生成知识库的导航结构，格式兼容主流静态站点生成器。

## 高级用法

### 部分导出

如果只想导出知识库的某个子目录，可以设置 `ROOT_NODE_TOKEN`：

```bash
ROOT_NODE_TOKEN=your_node_token npx @pange/feishu-pages
```

节点令牌可以从飞书文档 URL 中获取：
```
https://your-company.feishu.cn/wiki/XXXXXXXXXXXXXXXXXXXX
                                        ^^^^^^^^^^^^^^^^^^^^
                                        这就是 node_token
```

### 自定义 URL 结构

#### Original 模式（默认）

使用飞书原始的 node_token 作为 URL：

```
/dist/docs/Rd52wbrZ1ifWmXkEUQpcXnf4ntT.md
```

生成的链接：`/Rd52wbrZ1ifWmXkEUQpcXnf4ntT`

#### Nested 模式

使用基于标题的 slug 路径：

```
/dist/docs/intro/getting-started.md
```

生成的链接：`/intro/getting-started`

### 隐藏文档

在飞书文档的第一个代码块中添加 YAML frontmatter：

```yaml
---
hide: true
---
```

标记为 `hide: true` 的文档将不会被导出。

### 自定义 Slug

在 frontmatter 中设置 `slug` 字段来自定义 URL 路径：

```yaml
---
slug: custom-path/here
---
```

### 侧边栏排序

使用 `sidebar_position` 控制文档在侧边栏中的顺序：

```yaml
---
sidebar_position: 1
---
```

## 与静态站点生成器集成

### VitePress

```bash
# 1. 导出文档
npx @pange/feishu-pages

# 2. 复制文档到 VitePress 目录
cp -r dist/docs ./docs

# 3. 构建 VitePress
npm run docs:build
```

### Docusaurus

```bash
# 1. 导出文档
npx @pange/feishu-pages

# 2. 配置 Docusaurus 使用 docs 目录
# 在 docusaurus.config.js 中：
module.exports = {
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          path: './dist/docs',
          sidebarPath: require.resolve('./sidebars.js'),
        },
      },
    ],
  ],
};

# 3. 构建
npm run build
```

## GitHub Actions 集成

创建 `.github/workflows/feishu-pages.yml`：

```yaml
name: Export Feishu Docs

on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨 2 点执行
  workflow_dispatch:      # 支持手动触发

jobs:
  export:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Cache dist
        uses: actions/cache@v3
        with:
          path: dist/.cache
          key: ${{ runner.os }}-feishu-cache-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-feishu-cache-
      
      - name: Export Feishu Docs
        env:
          FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
          FEISHU_APP_SECRET: ${{ secrets.FEISHU_APP_SECRET }}
          FEISHU_SPACE_ID: ${{ secrets.FEISHU_SPACE_ID }}
          OUTPUT_DIR: ./dist
          URL_STYLE: nested
        run: |
          npm install -g @pange/feishu-pages
          feishu-pages
      
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: feishu-docs
          path: dist/
```

## 缓存机制

Feishu Pages 内置了智能缓存机制：

- **文档内容缓存**：未变更的文档不会重新从 API 获取
- **资源文件缓存**：已下载的图片和附件会被缓存
- **增量更新**：只处理有变化的文档，大幅提高执行速度

缓存位置：`{OUTPUT_DIR}/.cache`

如需清除缓存，删除 `.cache` 目录即可。

## 常见问题

### Permission Denied 错误

**问题**：`permission denied: wiki space permission denied`

**解决方案**：
1. 确保飞书应用已发布为正式版本
2. 在知识库设置中将应用所在的群聊添加为**管理员**
3. 检查应用是否具有 `wiki:wiki:readonly` 权限

### Rate Limit 错误

**问题**：`request trigger frequency limit`

**解决方案**：
- 项目已内置请求频率控制（每个请求间隔 300ms）
- 如仍遇到问题，请提交 Issue

### 画板图片有空白区域

**问题**：导出的画板图片周围有空白

**解决方案**：
使用 ImageMagick 裁剪空白区域：

```bash
find ./dist -name "*-board.png" -exec mogrify -trim {} +
```

### 文档链接不正确

**问题**：导出的文档内部链接无法正确跳转

**解决方案**：
1. 确保设置了正确的 `BASE_URL`
2. 使用 `nested` URL 样式以获得更友好的链接
3. 检查是否在 frontmatter 中正确设置了 `slug`

## 开发

```bash
# 克隆仓库
git clone https://github.com/yangzupan/feishu-pages.git
cd feishu-pages

# 安装依赖
pnpm install

# 构建
pnpm build

# 本地测试
cd packages/feishu-pages
pnpm dev
```


## 参考项目

- [feishu-pages](https://github.com/longbridge/feishu-pages)


## 相关项目

- [@pange/feishu-docx](https://github.com/yangzupan/feishu-pages/tree/main/packages/feishu-docx) - 飞书文档转换核心库
- [VitePress](https://vitepress.dev/) - 推荐的静态站点生成器
- [Docusaurus](https://docusaurus.io/) - Facebook 开源的文档站点生成器



## 许可证

MIT