#!/usr/bin/env node
import { FileToken } from '@pange/feishu-docx';
import fs from 'fs';
import path from 'path';
import { fetchDocBody, generateFrontmatter } from './doc.js';
import {
  BASE_URL,
  DOCS_DIR,
  OUTPUT_DIR,
  PICLIST_API_URL,
  PICLIST_ENABLED,
  PICLIST_KEY,
  ROOT_NODE_TOKEN,
  SKIP_ASSETS,
  feishuConfig,
  feishuDownload,
  fetchTenantAccessToken,
} from './feishu.js';
import { FileDoc, generateSummary, prepareDocSlugs } from './summary.js';
import {
  cleanupDocsForJSON,
  cleanupTmpFiles,
  humanizeFileSize,
  replaceLinks,
  uploadToPicList,
} from './utils.js';
import { fetchAllDocs } from './wiki.js';

/**
 * 递归获取所有文档的内容
 * 
 * 遍历文档树，获取每个文档的 Markdown 内容、元数据和文件令牌
 * 
 * @param docs - 文档数组
 */
const fetchDocBodies = async (docs: FileDoc[]) => {
  for (let idx = 0; idx < docs.length; idx++) {
    const doc = docs[idx];
    const { contentFile, fileTokens, meta, hasCache } = await fetchDocBody(doc);

    doc.contentFile = contentFile;
    doc.meta = meta;
    doc.fileTokens = fileTokens;
    doc.hasCache = hasCache;

    await fetchDocBodies(doc.children);
  }
};

/**
 * 下载文档中的资源文件
 * 
 * 遍历文档中的文件令牌，下载图片、文件和画板等资源，
 * 并根据配置决定是否上传到 PicList 图床。
 * 最后将文档内容中的引用链接替换为本地路径或图床 URL。
 * 
 * @param content - 文档 Markdown 内容
 * @param fileTokens - 文件令牌映射表
 * @param hasDocCache - 文档是否有缓存
 * @returns 替换链接后的文档内容
 */
const downloadFiles = async (
  content: string,
  fileTokens: Record<string, FileToken>,
  hasDocCache: boolean,
) => {
  if (SKIP_ASSETS) {
    console.info('跳过资源文件下载。');
    return content;
  }

  for (const fileToken in fileTokens) {
    let base_filename = fileToken;
   if (fileTokens[fileToken].type == 'board') {
     base_filename = base_filename + '-board';
   }

    const filePath = await feishuDownload(
      fileToken,
      path.join(path.join(DOCS_DIR, 'assets'), base_filename),
      fileTokens[fileToken].type,
      hasDocCache,
    );
    if (!filePath) {
      continue;
    }

    const extension = path.extname(filePath);
    let assetURL = `/assets/${base_filename}${extension}`;

    // 如果启用了 PicList 且是图片类型，则上传到图床
    if (PICLIST_ENABLED && fileTokens[fileToken].type === 'image') {
      const picListUrl = await uploadToPicList(filePath, PICLIST_API_URL, PICLIST_KEY);
      if (picListUrl) {
        assetURL = picListUrl;
        console.info(' -> 使用图床 URL:', assetURL);
      } else {
        console.warn(' -> PicList 上传失败，使用本地路径');
      }
    }

    content = replaceLinks(content, fileToken, assetURL);
  }

  return content;
};

/**
 * 获取文档内容并写入文件
 * 
 * 递归处理文档树，生成包含 frontmatter 的完整 Markdown 文件，
 * 并处理内部链接和资源文件。
 * 
 * @param outputDir - 输出目录路径
 * @param docs - 文档数组
 * @param slugMap - 节点令牌到 URL slug 的映射表
 */
const fetchDocAndWriteFile = async (
  outputDir: string,
  docs: FileDoc[],
  slugMap: Record<string, string>
) => {
  if (docs.length === 0) {
    return;
  }

  for (let idx = 0; idx < docs.length; idx++) {
    const doc = docs[idx];

    // 如果文档标记为隐藏，则跳过
    if (doc.meta?.hide) {
      continue;
    }

    let filename = path.join(outputDir, doc.filename);
    const folder = path.dirname(filename);
    fs.mkdirSync(folder, { recursive: true });

    let { contentFile, fileTokens } = doc;

    let content = fs.readFileSync(contentFile, 'utf-8');

    // 替换内部文档链接为正确的 URL
    for (const node_token in slugMap) {
      if (slugMap[node_token]) {
        content = replaceLinks(
          content,
          node_token,
          `${BASE_URL}${slugMap[node_token]}`
        );
      }
    }

    const metaInfo = generateFrontmatter(doc, doc.slug, doc.position, doc.obj_create_time, doc.obj_edit_time);

    let out = '';
    out += metaInfo + '\n\n';

    content = await downloadFiles(content, fileTokens, doc.hasCache);

    out += content;

    console.info(
      '正在写入文档',
      doc.filename,
      humanizeFileSize(content.length),
      '...'
    );
    fs.writeFileSync(filename, out);

    await fetchDocAndWriteFile(outputDir, doc.children, slugMap);
  }
};

// 应用入口
(async () => {
  // 获取访问令牌
  await fetchTenantAccessToken();

  console.info('输出目录:', OUTPUT_DIR);
  console.info('飞书应用 ID:', feishuConfig.appId);
  console.info('飞书空间 ID:', feishuConfig.spaceId);
  console.info('根节点令牌:', ROOT_NODE_TOKEN);
  console.info('-------------------------------------------\n');

  // 创建文档输出目录
  fs.mkdirSync(DOCS_DIR, { recursive: true });

  let slugMap = {};

  // 获取所有文档
  const docs = await fetchAllDocs(feishuConfig.spaceId, 0, ROOT_NODE_TOKEN);

  // 获取所有文档的内容
  await fetchDocBodies(docs as FileDoc[]);

  // 准备文档 slug 映射
  prepareDocSlugs(docs as FileDoc[], slugMap);

  // 写入文档文件
  await fetchDocAndWriteFile(DOCS_DIR, docs as FileDoc[], slugMap);

  // 生成 SUMMARY.md
  const summary = generateSummary(docs as FileDoc[]);
  fs.writeFileSync(path.join(DOCS_DIR, 'SUMMARY.md'), summary);

  // 清理文档对象，准备 JSON 输出
  cleanupDocsForJSON(docs as FileDoc[]);

  // 写入 docs.json
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'docs.json'),
    JSON.stringify(docs, null, 2)
  );

  // 清理临时文件
  cleanupTmpFiles();
})();