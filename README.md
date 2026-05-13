# Feishu Pages

导出**飞书知识库**,并按相同目录结构生成 [Static Page Generator](https://www.google.com/search?q=Static+Page+Generator) 支持 Markdown 文件组织方式,用于发布为静态网站。

借用飞书文档较好的撰写能力,让不懂 Markdown 和 Git 的非技术人员可以轻松撰写文档,并也最终以静态页面生成的方式来部署文档。这样我们依然可以继续保持 CI 流程和 GitHub PR 的方式来 Review 文档变更。

> 可以访问此文档的 [原始飞书知识库](https://yangzupan.feishu.cn/wiki/space/7639171300409281753) 对比看一下。

## 📦 项目结构

本项目是一个 Monorepo,包含以下核心包:

- **[@pange/feishu-docx](./packages/feishu-docx/README.md)** - 飞书文档转换核心库,支持将飞书新版文档 Docx 转换为 Markdown 格式
- **[@pange/feishu-pages](./packages/feishu-pages/README.md)** - 飞书知识库导出工具,将整个知识库导出为 Markdown 文件并组织目录结构
- **[vitepress-demo](./apps/vitepress-demo/)** - VitePress 演示项目,展示如何使用 feishu-pages

## ✨ 功能特性

### feishu-docx

- 📝 支持将飞书新版文档 Docx 转换为 Markdown 格式
- 🖼️ 支持图片、附件、画板等资源处理
- 🎨 支持多种块类型:标题、列表、代码块、表格、高亮块、分栏等
- 🔗 支持文档引用和链接转换
- 🌐 支持国际化内容和公式渲染
- 📊 支持复杂表格(含合并单元格)转换为 HTML

### feishu-pages

- 📚 导出飞书知识库为 Markdown 文件
- 📁 保持知识库的目录结构组织
- 🖼️ 自动下载图片、附件和画板等资源
- 🔗 智能处理内部文档链接
- 🌐 支持国际化内容
- 📊 生成 SUMMARY.md 导航文件
- 💾 支持缓存机制,提高重复执行效率
- 🎨 支持 PicList 图床上传
- ⚙️ 灵活的环境变量配置
- 🔄 与 GitHub Actions 无缝集成

## 🚀 快速开始

### 前置准备

> 📌 在开始使用之前,必须先完成飞书开放平台的配置工作,获得一些必要的信息,和配置必要的权限,请认真阅读完此页再继续。

#### 1. 创建飞书应用并开通权限

1. 请访问 [https://open.feishu.cn/app](https://open.feishu.cn/app) 创建一个新应用,并获得:
   - `App ID`
   - `App Secret` - 请注意保管 App Secret,不要泄露到互联网。

2. 为应用开启 `机器人` 应用能力。
3. 为应用开启以下权限:
   - `docx:document:readonly` - 读取文档内容
   - `wiki:wiki:readonly` - 读取知识库
   - `drive:drive:readonly` - 读取云空间文件
   - `board:whiteboard:node:read` - 读取画板
4. 将应用发布正式版本,并确保审批通过。
5. 在飞书 IM 中创建新群 `Feishu Pages`,将应用添加为该群机器人,知识库管理员在「知识空间设置」-> 「权限设置」->「添加管理员」中添加,把这个 `Feishu Pages` 群加成 **管理员**。
   - 否则会遇到 `permission denied: wiki space permission denied` 错误。 [ref](https://open.feishu.cn/document/server-docs/docs/wiki-v2/wiki-qa)

#### 2. 获取飞书知识库 space_id

我们需要配置 `FEISHU_SPACE_ID` 的环境变量,这个为飞书知识库的 `space_id`,你可以访问知识库设置界面,从 URL 中获取。

例如:`https://your-company.feishu.cn/wiki/settings/6992046856314306562` 这里面 `6992046856314306562` 为 `space_id`。

#### 3. 环境变量配置

Feishu Pages 支持 `.env` 文件,如果执行的根目录有个 `.env` 文件,将会自动读取。

> 请参考 `packages/feishu-pages/.env.default` 配置环境变量。

如需在 GitHub Actions 的 CI 流程里面使用,建议添加到 Secrets 中,再通过环境变量的方式获取。

## 📥 安装与使用

### 方式一:作为 CLI 工具使用(推荐)

```bash
# 全局安装
npm install -g @pange/feishu-pages

# 或在项目中使用
pnpm add @pange/feishu-pages
```

然后在 package.json 中添加脚本:

```json
{
  "scripts": {
    "fsp": "feishu-pages"
  }
}
```

运行命令:

```bash
pnpm fsp
```

### 方式二:本地开发

```bash
# 克隆仓库
git clone https://github.com/yangzupan/feishu-pages.git
cd feishu-pages

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 运行演示
pnpm dev

# 导出文档
pnpm export
```

## ⚙️ 配置选项

我们可以通过环境变量(ENV)来配置 feishu-pages 需要的必要参数,这样你可以轻易在 GitHub Actions 之类的流程中使用 feishu-pages。

> 如果你想简单一些,也可以用 `.env` 文件来配置环境变量,注意避免 `FEISHU_APP_SECRET` 泄露到互联网。

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `FEISHU_ENDPOINT` | 飞书 API 节点,如用 LarkSuite 可以通过这个配置 API 地址 | 否 | `https://open.feishu.cn` |
| `FEISHU_APP_ID` | 飞书应用 ID | 是 | - |
| `FEISHU_APP_SECRET` | 飞书应用 Secret | 是 | - |
| `FEISHU_SPACE_ID` | 飞书知识库 ID | 是 | - |
| `FEISHU_LOG_LEVEL` | SDK 日志级别 (0-4) | 否 | `1` |
| `OUTPUT_DIR` | 输出目录 | 否 | `./dist` |
| `BASE_URL` | 自定义文档里面相关文档输出的 URL 前缀,例如:`/docs/`,默认为 `/`,建议采用完整 URL 避免相对路径的各类问题。 | 否 | `/` |
| `ROOT_NODE_TOKEN` | 从哪个节点 (node_token) 开始导出,例如:`6992046856314306562`,默认为空,走根节点开始。 | 否 | - |
| `URL_STYLE` | 导出的文档 URL 风格。<br/><br/>- `nested` - 采用层级的 URL 结构,如 `/foo/bar/dar`。<br/>- `original` - 采用一层的 URL 结构,如 `/X80QwaYvjiMWZrk399YcK4q8nCc`。 | 否 | `original` |
| `SKIP_ASSETS` | 是否跳过资源下载(true/false) | 否 | `false` |

### PicList 图床配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PICLIST_ENABLED` | 是否启用 PicList 上传 | `false` |
| `PICLIST_API_URL` | PicList API 地址 | `http://127.0.0.1:36677` |
| `PICLIST_KEY` | PicList API 密钥 | 空 |

## 📖 使用说明

### 从知识库导出 Markdown 文档

当你撰写完成文档以后,可以通过 `feishu-pages` 命令来实现导出,这个命令作用是通过飞书 API 访问你 `FEISHU_SPACE_ID` 对应的知识库,并依次将所有文档导出,并转换为 Markdown 文件。

```bash
# 确保已配置环境变量
feishu-pages
```

按上面默认的配置,最终会在 `./dist` 目录下生成 Markdown 文件以及导出的图片文件,如果你期望调整目录,可以自己设置 `OUTPUT_DIR` 环境变量。

> 💡 文档内 [Page Meta](https://longbridge.github.io/feishu-pages/zh-CN/page-meta) 标识为 `hide: true` 的文档将会被排除掉,你可以用来隐藏一些不想公开的文档。
>
> 所有的 Markdown 导出的文件名将遵循知识库的目录树,并按照 Page Meta 里面的 `slug` 来整理文件夹和文件名。

### 输出结构

运行成功后,输出目录结构如下:

```
dist/
├── docs/                 # Markdown 文档目录
│   ├── assets/          # 下载的资源文件(图片、附件等)
│   ├── SUMMARY.md       # 导航文件
│   └── ...              # 按知识库结构组织的 Markdown 文件
├── docs.json            # 文档元数据 JSON 文件
└── .cache/              # 缓存文件(加速重复执行)
```

### 高级用法

#### 部分导出

如果只想导出知识库的某个子目录,可以设置 `ROOT_NODE_TOKEN`:

```bash
ROOT_NODE_TOKEN=your_node_token feishu-pages
```

节点令牌可以从飞书文档 URL 中获取:
```
https://your-company.feishu.cn/wiki/XXXXXXXXXXXXXXXXXXXX
                                        ^^^^^^^^^^^^^^^^^^^^
                                        这就是 node_token
```

#### 自定义 Slug

在飞书文档的第一个代码块中添加 YAML frontmatter:

```yaml
---
slug: custom-path/here
sidebar_position: 1
hide: false
---
```

#### 缓存机制

Feishu Pages 内置了智能缓存机制:

- **文档内容缓存**:未变更的文档不会重新从 API 获取
- **资源文件缓存**:已下载的图片和附件会被缓存
- **增量更新**:只处理有变化的文档,大幅提高执行速度

缓存位置:`{OUTPUT_DIR}/.cache`

如需清除缓存,删除 `.cache` 目录即可。

## 🔧 与静态站点生成器集成

### VitePress

```bash
# 1. 导出文档
feishu-pages

# 2. 复制文档到 VitePress 目录
cp -r dist/docs ./docs
cp dist/docs.json ./

# 3. 构建 VitePress
npm run docs:build
```

参考示例:[apps/vitepress-demo](./apps/vitepress-demo/)

### Docusaurus

```bash
# 1. 导出文档
feishu-pages

# 2. 配置 Docusaurus 使用 docs 目录
# 在 docusaurus.config.js 中:
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

## 🔄 GitHub Actions 集成

创建一个 `.github/workflows/feishu-pages.yml` 文件,内容如下:

> NOTE: 你需要用到 VitePress 或 Docusaurus 之类的文档工具,这里假设他们在项目根目录有 `pnpm build` 命令可以将 `docs` 文件夹的 Markdown 文件生成为静态网站。
>
> 具体可以参考:https://github.com/yangzupan/feishu-pages/tree/main/apps/vitepress-demo

```yml
name: Export Feishu Docs

on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨 2 点执行
  workflow_dispatch:      # 支持手动触发
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  feishu-pages:
    name: Feishu Pages Export
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
      
      - name: Build Pages
        run: |
          cp -r dist/docs ./
          cp dist/docs.json ./
          pnpm install
          pnpm build
      
      - name: Setup Pages
        uses: actions/configure-pages@v3
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: "./website/.vitepress/dist"
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

## ❓ 常见问题

### Permission Denied 错误

**问题**:`permission denied: wiki space permission denied`

**解决方案**:
1. 确保飞书应用已发布为正式版本
2. 在知识库设置中将应用所在的群聊添加为**管理员**
3. 检查应用是否具有 `wiki:wiki:readonly` 权限

### Rate Limit 相关错误

**问题**:`Error: request trigger frequency limit`

**解决方案**:
- 飞书 API 有总每分钟 100 次请求的[总频率限制](https://open.feishu.cn/document/ukTMukTMukTM/uUzN04SN3QjL1cDN)
- 项目已内置请求频率控制(每个请求间隔 300ms),以避免超过这个频率
- 如仍遇到问题,请提交 Issue

### 画板图片导出会有空白区域

**问题**:导出的画板图片周围有空白

**解决方案**:
这个是由于飞书画板导出图片本身的问题,如果你使用 feishu-pages 提供的 GitHub Actions,这个里面会用 ImageMagick 来修复这些图片。如果你是手工导出的,可以用下面的命令来修复(请先安装 [ImageMagick](https://www.imagemagick.org)):

```bash
find ./dist -name "*-board.png" -exec mogrify -trim {} +
```

### 文档链接不正确

**问题**:导出的文档内部链接无法正确跳转

**解决方案**:
1. 确保设置了正确的 `BASE_URL`
2. 使用 `nested` URL 样式以获得更友好的链接
3. 检查是否在 frontmatter 中正确设置了 `slug`

## 📚 相关项目
- [feishu-pages](https://github.com/longbridge/feishu-pages) 参考项目
- **[@pange/feishu-docx](./packages/feishu-docx/README.md)** - 飞书文档转换核心库,支持将飞书新版文档 Docx 转换为 Markdown 格式
- **[@pange/feishu-pages](./packages/feishu-pages/README.md)** - 飞书知识库导出工具,将整个知识库导出为 Markdown 文件并组织目录结构
- **[VitePress](https://vitepress.dev/)** - 推荐的静态站点生成器
- **[Docusaurus](https://docusaurus.io/)** - Facebook 开源的文档站点生成器

## 🙏 参考项目

- [feishu-pages](https://github.com/longbridge/feishu-pages) - 原始项目,感谢 Longbridge 团队的开源贡献

## 📝 许可证

MIT
