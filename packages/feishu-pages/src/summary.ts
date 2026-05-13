import path from 'path';
import { Doc, URL_STYLE } from './feishu.js';
import { normalizeSlug } from './utils.js';

/**
 * 文件文档接口
 * 
 * 扩展自 Doc 接口，添加了用于文件生成的额外属性
 */
export interface FileDoc extends Doc {
  /** URL slug */
  slug: string;
  /** 位置索引 */
  position: number;
  /** 文件名 */
  filename: string;
  /** 内容文件路径（临时文件路径） */
  contentFile?: string;
  /** 元数据 */
  meta?: Record<string, any>;
  /** 文件令牌映射表 */
  fileTokens?: any;
  /** 子文档数组 */
  children: FileDoc[];
  /** 是否有缓存 */
  hasCache?: boolean;
}

/**
 * 为文档树生成 slug、位置和文件名
 * 
 * 递归遍历文档树，为每个文档分配唯一的 URL slug、在父级中的位置索引和文件名。
 * 支持两种 URL 样式：original（使用 node_token）和 nested（使用嵌套路径）。
 * 
 * @param docs - 文档数组
 * @param slugMap - 节点令牌到 slug 的映射表（用于内部链接替换）
 * @param parentSlug - 父级 slug 路径
 */
export const prepareDocSlugs = (
  docs: FileDoc[],
  slugMap: Record<string, string>,
  parentSlug: string = ''
) => {
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    // 使用 meta 中的 slug 或 node_token 作为文件键
    const fileKey = normalizeSlug(doc.meta?.slug || doc.node_token);
    let fileSlug = path.join(parentSlug, fileKey);

    // 使用飞书原始 URL 样式，将 node_token 作为 URL slug
    // 例如：https://your-host.com/Rd52wbrZ1ifWmXkEUQpcXnf4ntT
    if (URL_STYLE === 'original') {
      fileSlug = doc.node_token;
    }

    doc.slug = fileSlug;
    doc.position = i;
    doc.filename = `${fileSlug}.md`;

    // 记录节点令牌到 slug 的映射
    slugMap[doc.node_token] = doc.slug;

    if (doc.children.length > 0) {
      prepareDocSlugs(doc.children as any, slugMap, fileSlug);
    }
  }
};

/**
 * 生成 SUMMARY.md 文件内容
 * 
 * 根据文档树结构生成 Markdown 格式的目录列表，
 * 用于静态站点生成器的侧边栏导航。
 * 
 * @param docs - 文档数组
 * @returns Markdown 格式的目录字符串
 */
export const generateSummary = (docs: FileDoc[]): string => {
  let output = '';
  for (const doc of docs) {
    // 根据深度计算缩进
    let indent = '  '.repeat(doc.depth);
    output += `${indent}- [${doc.title}](${doc.filename})\n`;

    if (doc.children.length > 0) {
      output += generateSummary(doc.children);
    }
  }

  return output;
};