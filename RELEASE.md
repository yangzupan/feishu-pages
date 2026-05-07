# NPM 发布指南

本指南详细说明了如何将 @pange/feishu-docx 和 @pange/feishu-pages 发布到 npm 仓库。

## 前置准备

### 1. 准备 npm 账号

- 访问 [npm官网](https://www.npmjs.com/) 注册账号（如尚未注册）
- 确保已拥有 @pange 命名空间的发布权限，或创建自己的组织
- 配置双重认证（2FA）以提高安全性（推荐）

### 2. 配置 npm 账号

```bash
# 登录 npm 账号
npm login

# 验证登录状态
npm whoami
```

### 3. 检查环境

- 确保已安装 pnpm（版本 >= 10.x）
- 确保项目使用 pnpm 作为包管理器
- 确保所有代码更改已提交到 Git

## 版本管理

### 语义化版本（Semantic Versioning）

我们遵循语义化版本规范：`MAJOR.MINOR.PATCH`

- **MAJOR**：不兼容的 API 变更
- **MINOR**：向后兼容的功能性新增
- **PATCH**：向后兼容的问题修复

### 更新版本号

#### 方式一：手动更新

直接编辑各模块的 `package.json` 文件中的 `version` 字段。

#### 方式二：使用 npm 命令

```bash
# 进入对应模块目录
cd feishu-docx

# 更新 patch 版本 (0.7.0 -> 0.7.1)
npm version patch

# 更新 minor 版本 (0.7.0 -> 0.8.0)
npm version minor

# 更新 major 版本 (0.7.0 -> 1.0.0)
npm version major
```

## 发布流程

### 发布 @pange/feishu-docx

由于 @pange/feishu-pages 依赖于 @pange/feishu-docx，必须先发布前者。

#### 1. 进入模块目录

```bash
cd feishu-docx
```

#### 2. 构建项目

```bash
pnpm build
```

#### 3. 验证构建

检查 `dist` 目录是否生成了正确的文件。

#### 4. 运行测试（可选但推荐）

```bash
pnpm test
```

#### 5. 发布到 npm

```bash
npm publish --access=public
```

注意：首次发布命名空间包时，必须使用 `--access=public` 参数。

### 发布 @pange/feishu-pages

发布完 @pange/feishu-docx 后，再发布 @pange/feishu-pages。

#### 1. 更新依赖（重要！）

在发布前，需要将 `package.json` 中的 workspace 依赖替换为实际版本：

```json
{
  "dependencies": {
    "@pange/feishu-docx": "^0.7.0"
  }
}
```

#### 2. 进入模块目录

```bash
cd feishu-pages
```

#### 3. 构建项目

```bash
pnpm build
```

#### 4. 验证构建

检查 `dist` 目录是否生成了正确的文件。

#### 5. 运行测试（可选但推荐）

```bash
pnpm test
```

#### 6. 发布到 npm

```bash
npm publish --access=public
```

## 发布前检查清单

在执行 `npm publish` 之前，请确认以下事项：

- [ ] 所有代码已提交到 Git
- [ ] 已更新正确的版本号
- [ ] 已运行 `pnpm build` 并验证构建成功
- [ ] 已运行 `pnpm test` 并确保所有测试通过
- [ ] package.json 中的描述、关键词等元信息已正确配置
- [ ] README.md 文档已更新为中文
- [ ] 对于 @pange/feishu-pages，已将 workspace 依赖替换为实际版本
- [ ] 已登录正确的 npm 账号
- [ ] 确认 npm 账号有 @pange 命名空间的发布权限

## 发布后验证

发布成功后，进行以下验证：

1. 访问 npm 页面确认包已发布：
   - https://www.npmjs.com/package/@pange/feishu-docx
   - https://www.npmjs.com/package/@pange/feishu-pages

2. 在新项目中安装并测试：

```bash
mkdir test-package
cd test-package
pnpm init -y
pnpm add @pange/feishu-docx @pange/feishu-pages
```

3. 验证导入是否正常工作。

## 常见问题

### Q: 提示 "403 Forbidden" 或权限错误

**A**: 请检查：
- 是否已登录正确的 npm 账号
- 账号是否有 @pange 组织的发布权限
- 包名是否已被占用

### Q: 提示 "404 Not Found" 或包不存在

**A**: 这是首次发布命名空间包的正常提示，使用 `--access=public` 参数即可。

### Q: 如何撤销已发布的版本？

**A**: npm 不建议撤销已发布超过 24 小时的版本，因为这可能破坏依赖该版本的项目。如确需撤销：

```bash
npm unpublish @pange/feishu-docx@0.7.0 --force
```

注意：此操作不可逆，请谨慎使用。

### Q: 如何标记为 beta 或 alpha 版本？

**A**: 使用 tag 功能：

```bash
# 发布 beta 版本
npm publish --tag beta

# 安装 beta 版本
pnpm add @pange/feishu-docx@beta
```

## 自动化发布（进阶）

可以使用 GitHub Actions 自动化发布流程。参考项目中的 `.github/workflows/` 目录下的示例文件。

## 参考资料

- [npm 官方文档 - 发布包](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [语义化版本 2.0.0](https://semver.org/lang/zh-CN/)
- [npm 命名空间和组织](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages)
