---
title: 微信
slug: >-
  D2XIwsGW9i9FYVkF4ZLcFVgznKP\DIXMwwd3SiiexLkZ6PWcP0U7ncf\PFdhwqNJSi6yP0kJP9WcnSSyngb
sidebar_position: 0
---


# 微信

## 使用指南

### 下载安装微信

从微信官方网站进行下载安装包。

官方网站：[微信官网](https://weixin.qq.com/)

根据自己的电脑操作系统选择下载对应安装包程序。

::: tip

1. 在 Windows 电脑上安装微信时，强烈建议把微信安装到非 C 盘。
2. 或者把微信的存储路径更改在非 C 盘上。具体参考：[更改微信存储路径](#更改微信存储路径)

:::

### 更改微信存储路径

### 备份聊天数据

### 恢复聊天数据

### 清理微信缓存数据

#### Windows

##### 第 1 步：找到微信数据缓存目录

微信默认将数据保存在 文档 文件夹下的 `xwechat_files` 目录中。

快速访问路径：

```text
C:\Users\你的Windows用户名\Documents\xwechat_files
```

> 如果没有更改过微信存储路径的话，也可在文件资源管理器地址栏输入 `%USERPROFILE%\Documents\xwechat_files` 直接跳转。

##### 第 2 步：进入当前登录账号的文件夹

在 `xwechat_files` 目录下，你会看到类似下面的结构：

```text
├─all_users
├─Backup
├─wxid_xxxxxxxxxxx
├─wxid_xxxxxxxxxxx
├─wxid_xxxxxxxxxxx
├─...
```

- 以 `wxid_` 开头的文件夹 对应已登录（或曾经登录）的微信账号。
- 如需清理当前登录账号的缓存，请找到 与你现在使用微信对应的 `wxid_xxxxxx` 文件夹（可通过修改日期判断）。

##### 第 3 步：定位到 `msg` 缓存目录

1. 双击进入你的 `wxid_xxxxxxxxxxx` 文件夹，内部通常包含：
    ```text
wxid_xxxxxxxxxxx/
├─ apm_record
├─ business
├─ cache          ← 通用缓存
├─ config
├─ db_storage     ← 数据库（勿删）
├─ msg            ← 聊天记录相关（重点操作区）
├─ resource
└─ temp
```

2. 进入 `msg` 文件夹，继续进入 `video` 文件夹：
    ```text
msg/
├─ attach
├─ file
├─ migrate
└─ video          ← 这里存放聊天中的视频缓存
```

##### 第 4 步：安全删除视频缓存

- 直接删除 `video` 文件夹内的所有内容
选中 `video` 文件夹，按下 `Shift + Delete` 永久删除（不经过回收站），或先删除到回收站再清空。

::: tip

以上此操作只会删掉聊天中的已缓存视频文件，不会删除文字聊天记录。

:::

::: warning 

请不要删除 `msg` 文件夹本身或其中的数据库文件（如 `db_storage`、`attach` 等），以免影响聊天记录完整性。

:::

##### 第 5 步：额外建议（可选）

- 清理 `cache` 和 `temp` 文件夹：
在账号文件夹（`wxid_...`）下，同样可以删除 `cache` 和 `temp` 文件夹内的全部内容，释放更多空间。
- 关闭自动下载（从源头减少缓存）：
打开微信 → 设置（左下角三条杠） → 账号与存储→ 取消勾选“自动下载小于 XX MB 的文文件”。

#### Mac OS

## 常见问题

