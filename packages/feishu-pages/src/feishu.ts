// node-sdk 使用说明：https://github.com/larksuite/node-sdk/blob/main/README.zh.md
import { Client } from "@larksuiteoapi/node-sdk";
import axios, { AxiosResponse } from "axios";
import "dotenv/config";
import fs from "fs";
import mime from "mime-types";
import path from "path";
import { humanizeFileSize } from "./utils.js";

/** 输出目录路径 */
export const OUTPUT_DIR: string = path.resolve(
  process.env.OUTPUT_DIR || "./dist",
);
/** 文档输出目录路径 */
export const DOCS_DIR: string = path.join(OUTPUT_DIR, "docs");

let baseUrl = process.env.BASE_URL || process.env.URL_PREFIX || "/";
if (!baseUrl.endsWith("/")) {
  baseUrl += "/";
}
/** 基础 URL */
export const BASE_URL: string = baseUrl;
/** 根节点令牌 */
export const ROOT_NODE_TOKEN: string = process.env.ROOT_NODE_TOKEN || "";
/** 缓存目录路径 */
export const CACHE_DIR = path.resolve(
  process.env.CACHE_DIR || path.join(OUTPUT_DIR, ".cache"),
);
/** 临时目录路径 */
export const TMP_DIR = path.resolve(
  process.env.TMP_DIR || path.join(OUTPUT_DIR, ".tmp"),
);

/**
 * URL 样式配置
 * 
 * "original" - 使用原始 token 作为 URL：/G5JwdLWUkopngoxfQtIc7EFSnIg
 * "nested" - 使用嵌套 slug 作为 URL：/slug1/slug2/slug3
 * 
 * 默认值："nested"
 */
export const URL_STYLE = process.env.URL_STYLE || "nested";
/**
 * 是否跳过下载资源文件
 * 
 * 用于调试时加快速度
 */
export const SKIP_ASSETS = process.env.SKIP_ASSETS || false;

/** 飞书配置对象 */
const feishuConfig = {
  /** 飞书 API 端点 */
  endpoint: process.env.FEISHU_ENDPOINT || "https://open.feishu.cn",
  /**
   * 飞书应用 App ID
   * 
   * 环境变量：`FEISHU_APP_ID`
   */
  appId: process.env.FEISHU_APP_ID,
  /**
   * 飞书应用 App Secret
   * 
   * 环境变量：`FEISHU_APP_SECRET`
   */
  appSecret: process.env.FEISHU_APP_SECRET,

  /**
   * 飞书应用 Tenant Access Token
   * 
   * 环境变量：`FEISHU_TENANT_ACCESS_TOKEN`
   * 
   * @see https://open.feishu.cn/document/faq/trouble-shooting/how-to-choose-which-type-of-token-to-use
   */
  tenantAccessToken: null,

  /**
   * 飞书知识库空间 ID
   * 
   * 环境变量：`FEISHU_SPACE_ID`
   */
  spaceId: process.env.FEISHU_SPACE_ID,
  /** 日志级别 */
  logLevel: process.env.FEISHU_LOG_LEVEL || "2",
};

/**
 * 检查必需的环境变量
 * 
 * 验证 FEISHU_APP_ID、FEISHU_APP_SECRET 和 FEISHU_SPACE_ID 是否已设置
 */
const checkEnv = () => {
  if (!feishuConfig.appId) {
    throw new Error("FEISHU_APP_ID is required");
  }

  if (!feishuConfig.appSecret) {
    throw new Error("FEISHU_APP_SECRET is required");
  }

  if (!feishuConfig.spaceId) {
    throw new Error("FEISHU_SPACE_ID is required");
  }
};

checkEnv();

/** 飞书客户端实例 */
const feishuClient = new Client({
  appId: feishuConfig.appId,
  appSecret: feishuConfig.appSecret,
  loggerLevel: feishuConfig.logLevel as any,
  disableTokenCache: true,
});

/**
 * 获取 tenantAccessToken
 * 
 * Token 有效期：2 小时
 * 
 * @see https://open.feishu.cn/document/server-docs/authentication-management/access-token/tenant_access_token
 * @returns Promise<void>
 */
export const fetchTenantAccessToken = async () => {
  console.log("正在获取 tenantAccessToken...");
  const res: Record<string, any> =
    await feishuClient.auth.tenantAccessToken.internal({
      data: {
        app_id: feishuConfig.appId,
        app_secret: feishuConfig.appSecret,
      },
    });
  const access_token = res?.tenant_access_token || "";
  console.info("TENANT_ACCESS_TOKEN:", maskToken(access_token));
  feishuConfig.tenantAccessToken = access_token;
};

/**
 * 将 Token 部分字符掩码为 ****
 * 
 * 用于安全地显示 Token，避免泄露完整 Token
 * 
 * @param token - 要掩码的 Token 字符串
 * @returns 掩码后的 Token 字符串
 */
export const maskToken = (token) => {
  const len = token.length;
  const mashLen = len * 0.6;
  return (
    token.substring(0, len - mashLen + 5) +
    "*".repeat(mashLen) +
    token.substring(len - 5)
  );
};

/** 速率限制计数器 */
const RATE_LIMITS = {};

/**
 * 请求等待函数
 * 
 * 实现飞书 API 的速率限制控制：
 * - 每分钟最多 100 次请求
 * - 每秒最多 5 次请求
 * 
 * @param ms - 等待毫秒数
 */
export const requestWait = async (ms?: number) => {
  ms = ms || 0;

  const minuteLockKey = new Date().getMinutes();
  if (!RATE_LIMITS[minuteLockKey]) {
    RATE_LIMITS[minuteLockKey] = 0;
  }

  // 如果超过每分钟 100 次限制，等待 1 分钟
  if (RATE_LIMITS[minuteLockKey] >= 100) {
    console.warn(
      "[速率限制] 超过每分钟 100 次请求限制，等待 1 分钟...",
    );
    await await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
    RATE_LIMITS[minuteLockKey] = 0;
  }

  await new Promise((resolve) => setTimeout(resolve, ms));
  RATE_LIMITS[minuteLockKey] += 1;
};

/**
 * Axios 响应拦截器
 * 
 * 处理飞书 API 的速率限制错误（错误码 99991400），自动重试
 */
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const { headers, data, status } = error.response;

    // 速率限制错误码：99991400，延迟后重试
    if (data?.code === 99991400) {
      const rateLimitResetSeconds = headers["x-ogw-ratelimit-reset"];
      console.warn(
        "[速率限制]",
        data.code,
        data.msg,
        `延迟 ${rateLimitResetSeconds}s 后重试...`,
      );

      // 延迟后重试
      await requestWait(rateLimitResetSeconds * 1000);
      return await axios.request(error.config);
    }

    throw error;
  },
);

/**
 * 带有全局速率限制的飞书网络请求函数
 * 
 * @param method - HTTP 方法（GET、POST 等）
 * @param path - 请求路径
 * @param payload - 请求参数
 * @returns 响应数据
 */
export const feishuFetch = async (method, path, payload): Promise<any> => {
  const authorization = `Bearer ${feishuConfig.tenantAccessToken}`;
  const headers = {
    Authorization: authorization,
    "Content-Type": "application/json; charset=utf-8",
    "User-Agent": "feishu-pages",
  };

  const url = `${feishuConfig.endpoint}${path}`;

  const { code, data, msg } = await axios
    .request({
      method,
      url,
      params: payload,
      headers,
    })
    .then((res) => res.data);

  if (code !== 0) {
    console.warn("feishuFetch 错误码:", code, "消息:", msg);
    return null;
  }

  return data;
};

/**
 * 检查缓存文件是否有效
 * 
 * 验证缓存文件是否存在且大小大于 0
 * 
 * @param cacheFilePath - 缓存文件路径
 * @returns 如果缓存有效则返回 true
 */
const isValidCacheExist = (cacheFilePath: string) => {
  if (fs.existsSync(cacheFilePath)) {
    const stats = fs.statSync(cacheFilePath);
    if (stats.size > 0) {
      return true;
    } else {
      console.warn("文件", cacheFilePath, "大小为 0");
    }
  }
  return false;
};

/**
 * 下载飞书文件到本地路径
 * 
 * 支持缓存机制，避免重复下载。如果下载失败则返回 null。
 * 
 * @param fileToken - 文件令牌
 * @param localPath - 本地保存路径
 * @param type - 文件类型（file/image/board）
 * @param hasDocCache - 文档是否有缓存
 * @returns 保存后的文件路径，如果下载失败则返回 null
 */
export const feishuDownload = async (
  fileToken: string,
  localPath: string,
  type: 'file' | 'image' | 'board',
  hasDocCache: boolean,
) => {
  const cacheFilePath = path.join(CACHE_DIR, fileToken);
  const cacheFileMetaPath = path.join(CACHE_DIR, `${fileToken}.headers.json`);
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  let res: { data?: fs.ReadStream; headers?: Record<string, any> } = {};
  let hasCache = false;
  // 画板文件无法缓存，因为无法获取 content-length
  let canCache = type != 'board' || hasDocCache;

  let cacheFileHeaders = {};
  try {
    cacheFileHeaders = JSON.parse(fs.readFileSync(cacheFileMetaPath, "utf-8"));
  } catch {}
  let cacheContentLength = cacheFileHeaders["content-length"] || null;

  if (
    isValidCacheExist(cacheFilePath) &&
    isValidCacheExist(cacheFileMetaPath) &&
    canCache
  ) {
    hasCache = true;
    res.headers = cacheFileHeaders;
    console.info(" -> 缓存命中:", fileToken);
  } else {
    console.info("正在下载文件", fileToken, "...");
    console.info("文件类型为", type, "...");
    res = await axios
      .get(
        type === "board" ?
          `${feishuConfig.endpoint}/open-apis/board/v1/whiteboards/${fileToken}/download_as_image` :
          `${feishuConfig.endpoint}/open-apis/drive/v1/medias/${fileToken}/download`,
        {
          responseType: "stream",
          headers: {
            Authorization: `Bearer ${feishuConfig.tenantAccessToken}`,
            "User-Agent": "feishu-pages",
          },
        },
      )
      .then((res: AxiosResponse) => {
        if (res.status !== 200) {
          console.error(
            " -> 错误: 下载文件失败:",
            fileToken,
            res.status,
          );
          return null;
        }

        if (res.headers["Content-Length"] && res.headers["Content-Length"] == cacheContentLength) {
          console.info(" -> 缓存命中", fileToken);
          hasCache = true;
        } else {
          // 写入缓存信息
          fs.writeFileSync(cacheFileMetaPath, JSON.stringify(res.headers));

          return new Promise((resolve: any, reject: any) => {
            const writer = fs.createWriteStream(cacheFilePath);
            res.data.pipe(writer);
            writer.on("finish", () => {
              resolve({
                headers: res.headers,
              });
            });
            writer.on("error", (e) => {
              reject(e);
            });
          });
        }
      })
      .catch((err) => {
        const { message } = err;
        console.error(
          " -> 错误: 下载文件失败:",
          fileToken,
          message,
        );
        // 如果状态码是 403
        // @see https://open.feishu.cn/document/server-docs/docs/drive-v1/faq#6e38a6de
        if (message.includes("403")) {
          console.error(
            `无文件下载权限时接口将返回 403 的 HTTP 状态码。\nhttps://open.feishu.cn/document/server-docs/docs/drive-v1/faq#6e38a6de\nhttps://open.feishu.cn/document/server-docs/docs/drive-v1/download/download`,
          );
          return null;
        }
      });
  }

  if (!res) {
    return null;
  }

  let extension = mime.extension(res.headers["content-type"]);
  let fileSize = res.headers["content-length"];
  if (!hasCache) {
    console.info(
      " =>",
      res.headers["content-type"],
      humanizeFileSize(fileSize),
    );
  }

  if (extension) {
    localPath = localPath + "." + extension;
  }
  const dir = path.dirname(localPath);
  fs.mkdirSync(dir, { recursive: true });
  if (!hasCache) {
    console.info(" -> 写入文件:", localPath);
  }
  if (!isValidCacheExist(cacheFilePath)) {
    console.warn("文件未找到,", cacheFilePath, "可能是下载 404");
    return null;
  }

  fs.copyFileSync(cacheFilePath, localPath);
  return localPath;
};

/**
 * 使用迭代器请求飞书列表 API
 * 
 * 自动处理分页，获取所有数据
 * 
 * @param method - HTTP 方法
 * @param path - 请求路径
 * @param payload - 请求参数
 * @returns 所有结果的数组
 */
export const feishuFetchWithIterator = async (
  method: string,
  path: string,
  payload: Record<string, any> = {},
): Promise<WikiNode[]> => {
  let pageToken = "";
  let hasMore = true;
  let results: any[] = [];

  while (hasMore) {
    const data = await feishuFetch(method, path, {
      ...payload,
      page_token: pageToken,
    });

    if (data.items) {
      results = results.concat(data.items);
    }
    hasMore = data.has_more;
    pageToken = data.page_token;
  }

  return results;
};

/**
 * 文档接口
 * 
 * 表示一个飞书文档的结构
 */
export interface Doc {
  /** 文档标题 */
  title: string;
  /** 元数据 */
  meta?: Record<string, any>;
  /** 节点令牌 */
  node_token: string;
  /** 父节点令牌 */
  parent_node_token?: string;
  /** 深度层级 */
  depth: number;
  /** 对象创建时间 */
  obj_create_time?: string;
  /** 对象编辑时间 */
  obj_edit_time?: string;
  /** 对象令牌 */
  obj_token?: string;
  /** 子文档数组 */
  children: Doc[];
  /** 是否有子节点 */
  has_child?: boolean;
}

/**
 * 节点信息接口
 * 
 * 表示飞书知识库中的一个节点
 * 
 * @see https://open.feishu.cn/document/server-docs/docs/wiki-v2/space-node/get_node
 * @see https://open.feishu.cn/document/server-docs/docs/wiki-v2/space-node/list
 */
export interface WikiNode {
  /** 知识空间 ID */
  space_id: string;
  /** 节点令牌 */
  node_token: string;
  /** 对象令牌 */
  obj_token: string;
  /** 对象类型 */
  obj_type: "doc" | "docx" | "sheet" | "file";
  /** 
   * 父节点令牌
   * 
   * 若当前节点为一级节点，父节点令牌为空
   */
  parent_node_token?: string;
  /** 
   * 节点类型
   * 
   * origin：实体
   * shortcut：快捷方式
   */
  node_type: "origin" | "shortcut";
  /** 原始节点令牌 */
  origin_node_token: string;
  /** 原始空间 ID */
  origin_space_id: string;
  /** 是否有子节点 */
  has_child: boolean;
  /** 节点标题 */
  title: string;
  /** 对象创建时间 */
  obj_create_time: string;
  /** 对象编辑时间 */
  obj_edit_time: string;
  /** 节点创建时间 */
  node_create_time: string;
  /** 创建者 */
  creator: string;
  /** 所有者 */
  owner: string;
}

export { checkEnv, feishuConfig };