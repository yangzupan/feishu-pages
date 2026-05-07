#!/usr/bin/env node
import { FileToken } from '@pange/feishu-docx';
import fs from 'fs';
import path from 'path';
import { fetchDocBody, generateFrontmatter } from './doc';
import {
  BASE_URL,
  DOCS_DIR,
  OUTPUT_DIR,
  ROOT_NODE_TOKEN,
  SKIP_ASSETS,
  feishuConfig,
  feishuDownload,
  fetchTenantAccessToken,
} from './feishu';
import { FileDoc, generateSummary, prepareDocSlugs } from './summary';
import {
  cleanupDocsForJSON,
  cleanupTmpFiles,
  humanizeFileSize,
  replaceLinks,
} from './utils';
import { fetchAllDocs } from './wiki';

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

const downloadFiles = async (
  content: string,
  fileTokens: Record<string, FileToken>,
  hasDocCache: boolean,
) => {
  if (SKIP_ASSETS) {
    console.info('skip assets download.');
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

    content = replaceLinks(content, fileToken, assetURL);
  }

  return content;
};

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

    if (doc.meta?.hide) {
      continue;
    }

    let filename = path.join(outputDir, doc.filename);
    const folder = path.dirname(filename);
    fs.mkdirSync(folder, { recursive: true });

    let { contentFile, fileTokens } = doc;

    let content = fs.readFileSync(contentFile, 'utf-8');

    for (const node_token in slugMap) {
      if (slugMap[node_token]) {
        content = replaceLinks(
          content,
          node_token,
          `${BASE_URL}${slugMap[node_token]}`
        );
      }
    }

    const metaInfo = generateFrontmatter(doc, doc.slug, doc.position);

    let out = '';
    out += metaInfo + '\n\n';

    content = await downloadFiles(content, fileTokens, doc.hasCache);

    out += content;

    console.info(
      'Writing doc',
      doc.filename,
      humanizeFileSize(content.length),
      '...'
    );
    fs.writeFileSync(filename, out);

    await fetchDocAndWriteFile(outputDir, doc.children, slugMap);
  }
};

// App entry
(async () => {
  await fetchTenantAccessToken();

  console.info('OUTPUT_DIR:', OUTPUT_DIR);
  console.info('FEISHU_APP_ID:', feishuConfig.appId);
  console.info('FEISHU_SPACE_ID:', feishuConfig.spaceId);
  console.info('ROOT_NODE_TOKEN:', ROOT_NODE_TOKEN);
  console.info('-------------------------------------------\n');

  fs.mkdirSync(DOCS_DIR, { recursive: true });

  let slugMap = {};

  const docs = await fetchAllDocs(feishuConfig.spaceId, 0, ROOT_NODE_TOKEN);

  await fetchDocBodies(docs as FileDoc[]);

  prepareDocSlugs(docs as FileDoc[], slugMap);

  await fetchDocAndWriteFile(DOCS_DIR, docs as FileDoc[], slugMap);

  const summary = generateSummary(docs as FileDoc[]);
  fs.writeFileSync(path.join(DOCS_DIR, 'SUMMARY.md'), summary);

  cleanupDocsForJSON(docs as FileDoc[]);

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'docs.json'),
    JSON.stringify(docs, null, 2)
  );

  cleanupTmpFiles();
})();
