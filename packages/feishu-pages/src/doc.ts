import { MarkdownRenderer } from '@pange/feishu-docx';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { CACHE_DIR, Doc, feishuFetchWithIterator } from './feishu.js';
import { printMemoryUsage, writeTemplfile } from './utils.js';

/**
 * 获取文档内容
 * 
 * 从飞书 API 获取文档块数据，使用缓存机制避免重复请求。
 * 将文档内容渲染为 Markdown 格式，并提取元数据和文件令牌。
 * 
 * @see https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document/list
 * @param fileDoc - 文档对象，包含 obj_token 和 obj_edit_time
 * @returns 包含内容文件路径、元数据、文件令牌和缓存状态的對象
 */
export const fetchDocBody = async (fileDoc: Doc): Promise<{ contentFile: string; meta: Record<string, any>; fileTokens: Record<string, any>; hasCache: boolean }> => {
  let document_id = fileDoc.obj_token;

  const doc: {
    document: {
      document_id: string;
    };
    blocks: any[];
  } = {
    document: {
      document_id: document_id!,
    },
    blocks: [],
  };

  /**
   * 获取文档块数据
   * 
   * 首先检查缓存，如果缓存命中且编辑时间未变则直接返回缓存数据。
   * 否则从飞书 API 获取最新数据并更新缓存。
   * 
   * @param document_id - 文档 ID
   * @returns 包含缓存状态和块数据的对象
   */
  const fetchDocBlocks = async (document_id: string): Promise<{ hasCache: boolean; blocks: any[] }> => {
    // 检查缓存文件 .cache/blocks/${document_id}.json
    let hasCache = false;
    let cacheBlocks = path.join(CACHE_DIR, 'blocks', document_id + '.json');
    fs.mkdirSync(path.dirname(cacheBlocks), { recursive: true });
    if (fs.existsSync(cacheBlocks)) {
      const doc = JSON.parse(fs.readFileSync(cacheBlocks, 'utf-8'));
      if (doc?.obj_edit_time === fileDoc.obj_edit_time) {
        hasCache = true;
        console.info('缓存命中文档: ', document_id, '...');
        return {
          hasCache,
          blocks: doc.blocks,
        };
      }
    }

    console.info('正在获取文档: ', document_id, '...');
    const blocks = await feishuFetchWithIterator(
      'GET',
      `/open-apis/docx/v1/documents/${document_id}/blocks`,
      {
        page_size: 500,
        document_revision_id: -1,
      }
    );
    fs.writeFileSync(
      cacheBlocks,
      JSON.stringify({
        obj_edit_time: fileDoc.obj_edit_time,
        blocks,
      })
    );
    return { hasCache, blocks };
  };


  let { blocks, hasCache } = await fetchDocBlocks(document_id!);

  doc.blocks = blocks;
  printMemoryUsage('已加载文档块');

  const render = new MarkdownRenderer(doc as any);
  const content = render.parse();
  printMemoryUsage('MarkdownRenderer 解析完成');
  const fileTokens = render.fileTokens;
  const meta = render.meta;

  let tmp_filename = writeTemplfile(content);

  return {
    contentFile: tmp_filename,
    meta: meta || {},
    fileTokens,
    hasCache,
  };
};

/**
 * 生成 Markdown Frontmatter
 * 
 * 根据文档信息和 URL 路径生成 YAML 格式的 frontmatter。
 * Frontmatter 包含标题、slug、侧边栏位置、创建时间和编辑时间等元数据。
 * 
 * @param doc - 文档对象
 * @param urlPath - URL 路径（slug）
 * @param position - 侧边栏位置
 * @param createTime - 文档创建时间（可选）
 * @param editTime - 文档编辑时间（可选）
 * @returns YAML 格式的 frontmatter 字符串（包含 --- 分隔符）
 */
export const generateFrontmatter = (
  doc: Doc,
  urlPath: string,
  position: number,
  createTime?: string,
  editTime?: string
) => {
  const meta = Object.assign(
    {
      title: doc.title,
      slug: urlPath,
      sidebar_position: position,
      createTime: createTime,
      lastUpdated: editTime,
    },
    doc.meta || {}
  );

  // 移除 null 或 undefined 的键
  for (const key in meta) {
    if (meta[key] === undefined || meta[key] === null) {
      delete meta[key];
    }
  }

  let meta_yaml = yaml.dump(meta, {
    skipInvalid: true,
  });

  let output = `---\n`;
  output += meta_yaml;
  output += `---\n`;

  return output;
};