import path from "path";

/**
 * 应用配置管理
 * 
 * 集中管理所有环境变量和配置项
 */

// ==================== 基础配置 ====================

/** 输出目录路径 */
export const OUTPUT_DIR: string = process.env.OUTPUT_DIR || "./dist";

/** 文档目录路径 */
export const DOCS_DIR: string = path.join(OUTPUT_DIR, "docs");

/** 基础 URL */
export const BASE_URL: string = process.env.BASE_URL || "/";

/** 根节点令牌 */
export const ROOT_NODE_TOKEN: string = process.env.ROOT_NODE_TOKEN || "";

// ==================== 缓存配置 ====================

/** 缓存目录路径 */
export const CACHE_DIR = path.resolve(
  process.env.CACHE_DIR || path.join(OUTPUT_DIR, ".cache"),
);

/** 临时目录路径 */
export const TMP_DIR = path.resolve(
  process.env.TMP_DIR || path.join(OUTPUT_DIR, ".tmp"),
);

// ==================== URL 样式配置 ====================

/**
 * URL 样式配置
 * 
 * "original" - 使用原始 token 作为 URL：/G5JwdLWUkopngoxfQtIc7EFSnIg
 * "nested" - 使用嵌套 slug 作为 URL：/slug1/slug2/slug3
 * 
 * 默认值："original"
 */
export const URL_STYLE = process.env.URL_STYLE || "original";

// ==================== 资源下载配置 ====================

/**
 * 是否跳过下载资源文件
 * 
 * 用于调试时加快速度
 */
export const SKIP_ASSETS = process.env.SKIP_ASSETS === 'true' || process.env.SKIP_ASSETS === '1';

// ==================== PicList 图床配置 ====================

/**
 * PicList 图床配置
 * 
 * PICLIST_ENABLED: 是否启用 PicList 上传（true/false）
 * PICLIST_API_URL: PicList API 地址（默认 http://127.0.0.1:36677）
 * PICLIST_KEY: PicList API 密钥（可选）
 */
export const PICLIST_ENABLED = process.env.PICLIST_ENABLED === 'true' || process.env.PICLIST_ENABLED === '1';
export const PICLIST_API_URL = process.env.PICLIST_API_URL || 'http://127.0.0.1:36677';
export const PICLIST_KEY = process.env.PICLIST_KEY || '';

// ==================== 飞书 API 配置 ====================

/**
 * 飞书 API 端点
 * 
 * 国内版：https://open.feishu.cn
 * 国际版：https://open.larksuite.com
 */
export const FEISHU_ENDPOINT = process.env.FEISHU_ENDPOINT || "https://open.feishu.cn";

/** 飞书应用 ID */
export const FEISHU_APP_ID = process.env.FEISHU_APP_ID || "";

/** 飞书应用密钥 */
export const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || "";

/** 飞书知识库空间 ID */
export const FEISHU_SPACE_ID = process.env.FEISHU_SPACE_ID || "";

/** 飞书 SDK 日志级别 */
export const FEISHU_LOG_LEVEL = parseInt(process.env.FEISHU_LOG_LEVEL || "1", 10);
