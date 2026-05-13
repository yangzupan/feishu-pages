import axios from "axios";
import fs from "fs";
import { marked } from "marked";
import { markedXhtml } from "marked-xhtml";
import os from "os";
import path from "path";
import { FileDoc } from "./summary";

marked.use(markedXhtml());


/**
 * 通过 PicList 上传图片到图床
 * 
 * 调用 PicList API 将本地图片上传到配置的图床服务
 * 
 * @param filePath - 本地图片文件路径
 * @param apiUrl - PicList API 地址
 * @param key - PicList API 密钥（可选）
 * @returns 上传后的图片 URL，如果失败则返回 null
 */
export async function uploadToPicList(
  filePath: string,
  apiUrl: string = 'http://127.0.0.1:36677',
  key?: string
): Promise<string | null> {
  try {
    console.info(' -> 正在通过 PicList 上传图片:', filePath);
    
    // 构建请求 URL，如果有 key 则添加到查询参数
    let uploadUrl = `${apiUrl}/upload`;
    if (key) {
      uploadUrl += `?key=${encodeURIComponent(key)}`;
    }
    
    // 使用 axios 直接上传文件，axios 会自动处理 multipart/form-data
    const response = await axios.post(
      uploadUrl,
      {
        file: fs.createReadStream(filePath),
      },
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );
    
    if (response.data && response.data.success) {
      // PicList 返回的 result 是 URL 数组
      const imageUrl = response.data.result?.[0] || 
                      response.data.url || 
                      response.data.images?.[0]?.url ||
                      response.data.fullResult?.[0]?.imgUrl ||
                      response.data.fullResult?.[0]?.shortUrl;
      if (imageUrl) {
        console.info(' -> 上传成功:', imageUrl);
        return imageUrl;
      }
    }
    
    console.error(' -> 上传失败:', response.data);
    return null;
  } catch (error: any) {
    console.error(' -> PicList 上传错误:', error.message);
    if (error.response) {
      console.error(' -> 响应状态:', error.response.status);
      console.error(' -> 响应数据:', error.response.data);
    }
    return null;
  }
}

/**
 * 标准化 slug
 * 
 * 移除 slug 中的 wik(cn|en) 前缀，并确保返回字符串类型
 * 
 * @param slug - 原始 slug（可能是字符串或数字）
 * @returns 标准化后的 slug 字符串
 */
export const normalizeSlug = (slug: string | number) => {
  // 强制将 slug 转换为字符串
  slug = String(slug);
  return slug.replace(/^wik(cn|en)/, "");
};

/**
 * 将字节数格式化为人类可读的文本
 * 
 * 例如：1024 -> "1.0 kB", 1048576 -> "1.0 MB"
 * 
 * @param bytes - 字节数
 * @param dp - 小数位数（默认为 1）
 * @returns 格式化后的文件大小字符串
 */
export const humanizeFileSize = (bytes: string | number, dp = 1) => {
  if (typeof bytes === "string") {
    bytes = parseInt(bytes);
  }

  const thresh = 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }

  const units = ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + " " + units[u];
};

/**
 * 允许保留在 JSON 输出中的字段列表
 * 
 * 用于清理文档对象，移除不必要的内部字段
 */
const allowKeys = [
  "depth",
  "title",
  "slug",
  "filename",
  "node_token",
  "parent_node_token",
  "children",
  "obj_create_time",
  "obj_edit_time",
  "obj_token",
  "has_child",
  "meta",
  "position",
];

/**
 * 清理文档对象以用于 JSON 输出
 * 
 * 递归遍历文档树，移除不允许的字段，并删除标记为隐藏的文档。
 * 这样可以减小生成的 docs.json 文件大小。
 * 
 * @param docs - 文档数组
 */
export function cleanupDocsForJSON(docs: FileDoc[]) {
  const nodesToDelete = [];

  for (let idx = 0; idx < docs.length; idx++) {
    const doc = docs[idx];

    // 移除不在允许列表中的字段
    Object.keys(doc).forEach((key) => {
      if (!allowKeys.includes(key)) {
        delete (doc as any)[key];
      }
    });

    // 标记隐藏的文档以便后续删除
    if (doc.meta?.hide) {
      nodesToDelete.push(idx);
    }

    if (doc.children) {
      cleanupDocsForJSON(doc.children);
    }
  }

  // 逆序删除节点以避免索引问题
  for (let i = nodesToDelete.length - 1; i >= 0; i--) {
    docs.splice(nodesToDelete[i], 1);
  }
}

/**
 * 替换内容中的链接
 * 
 * 将文档内容中指向飞书文档的链接替换为新的链接（通常是本地生成的 URL）。
 * 支持 HTML 格式（src/href 属性）和 Markdown 格式的链接。
 * 
 * @param content - 文档内容字符串
 * @param node_token - 要替换的节点令牌
 * @param newLink - 新的链接地址
 * @returns 替换后的内容字符串
 */
export function replaceLinks(
  content: string,
  node_token: string,
  newLink?: string,
): string {
  if (!newLink) {
    return content;
  }

  /*
    匹配 HTML 中的链接（src="" 或 href=""）

    捕获组：
    1 - src=" 或 href=" 或 src=' 或 href='
    2 - https://ywh1bkansf.feishu.cn/wiki/aabbdd（可选的域名部分）
    3 - node_token
    4 - ' 或 "
  */
  const htmlRe = new RegExp(
    `((src|href)=["|'])(http[s]?:\\\/\\\/[\\w]+\\.(feishu\\.cn|larksuite\.com)\\\/.*)?(${node_token}[^"']*)("|')`,
    "gm",
  );
  content = content.replace(htmlRe, `$1${newLink}$6`);

  /*
    匹配 Markdown 中的链接和图片

    捕获组：
    1 - ](
    2 - https://ywh1bkansf.feishu.cn/wiki/aabbdd（可选的域名部分）
    3 - node_token
    4 - )
   */
  const mdRe = new RegExp(
    `(\\]\\()(http[s]?:\\\/\\\/[\\w]+\\.(feishu\\.cn|larksuite\.com)\\\/.*)?(${node_token}[^\\)]*)(\\))`,
    "gm",
  );
  content = content.replace(mdRe, `$1${newLink}$5`);

  return content;
}

/**
 * 将内容写入临时文件
 * 
 * 在系统临时目录中创建随机命名的文件，用于存储文档内容。
 * 
 * @param content - 要写入的内容
 * @returns 临时文件的路径
 */
export function writeTemplfile(content: string): string {
  let filename = path.join(
    os.tmpdir(),
    "feishi-pages",
    Math.random().toString(36),
  );
  if (!fs.existsSync(path.dirname(filename))) {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }
  fs.writeFileSync(filename, content);

  return filename;
}

/**
 * 清理临时文件
 * 
 * 删除 /tmp/feishi-pages 目录及其所有内容
 */
export function cleanupTmpFiles() {
  const tmpDir = path.join(os.tmpdir(), "feishi-pages");
  console.log("清理临时文件:", tmpDir);

  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

/**
 * 打印内存使用情况
 * 
 * 仅在 DEBUG 环境变量设置为 "1" 或 "true" 时输出
 * 
 * @param prefix - 输出前缀（可选）
 */
export function printMemoryUsage(prefix?: string) {
  if (process.env.DEBUG !== "1" && process.env.DEBUG !== "true") {
    return;
  }

  const used = process.memoryUsage();
  if (prefix) {
    prefix = prefix + " ";
  }

  console.log(
    `${prefix}${humanizeFileSize(used.rss)} RSS, ${humanizeFileSize(
      used.heapTotal,
    )} heapTotal, ${humanizeFileSize(
      used.heapUsed,
    )} heapUsed, ${humanizeFileSize(used.external)} external`,
  );
}