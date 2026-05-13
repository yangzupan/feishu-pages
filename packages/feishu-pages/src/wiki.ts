import { Doc, WikiNode, feishuFetch, feishuFetchWithIterator } from './feishu.js';

/**
 * 获取文档节点信息
 * 
 * 从飞书 API 获取指定节点的详细信息
 * 
 * @see https://open.feishu.cn/document/server-docs/docs/wiki-v2/space-node/get_node
 * @param spaceId - 空间 ID
 * @param nodeToken - 节点令牌
 * @returns 节点信息对象
 */
export const fetchDocInfo = async (
  spaceId: string,
  nodeToken: string
): Promise<WikiNode> => {
  let data = await feishuFetch('GET', '/open-apis/wiki/v2/spaces/get_node', {
    token: nodeToken,
  });

  const node = data.node as WikiNode;
  if (!node) {
    console.error('未找到节点', nodeToken, data);
  }

  return node;
};

/**
 * 获取知识库空间下的所有文档列表
 * 
 * 递归遍历知识库树结构，获取所有文档及其子文档。
 * 自动过滤标题中包含 [hide] 或 [隐藏] 的文档。
 * 
 * @see https://open.feishu.cn/document/server-docs/docs/wiki-v2/space-node/list
 * @param spaceId - 空间 ID
 * @param depth - 当前深度层级（默认为 0）
 * @param parent_node_token - 父节点令牌（为空时获取根节点）
 * @returns 文档树数组
 */
export const fetchAllDocs = async (
  spaceId: string,
  depth?: number,
  parent_node_token?: string
) => {
  if (!depth) {
    depth = 0;
  }

  // 生成缩进前缀用于日志输出
  const prefix = '|__' + '___'.repeat(depth) + ' ';
  let docs: Doc[] = [];

  // 从根节点开始获取
  if (depth == 0 && parent_node_token) {
    let rootNode = await fetchDocInfo(spaceId, parent_node_token);
    let doc = {
      depth: depth,
      title: rootNode.title,
      node_token: rootNode.node_token,
      parent_node_token: null,
      obj_create_time: rootNode.obj_create_time,
      obj_edit_time: rootNode.obj_edit_time,
      obj_token: rootNode.obj_token,
      children: [],
      has_child: rootNode.has_child,
    };
    docs.push(doc);
  } else {
    // 获取子节点列表
    let items = await feishuFetchWithIterator(
      'GET',
      `/open-apis/wiki/v2/spaces/${spaceId}/nodes`,
      {
        parent_node_token,
        page_size: 50,
      }
    );

    // 仅保留文档类型的节点（doc 和 docx）
    items
      .filter((item) => item.obj_type == 'doc' || item.obj_type == 'docx')
      .forEach((item) => {
        const doc: Doc = {
          depth: depth,
          title: item.title,
          node_token: item.node_token,
          parent_node_token: parent_node_token,
          obj_create_time: item.obj_create_time,
          obj_edit_time: item.obj_edit_time,
          obj_token: item.obj_token,
          children: [],
          has_child: item.has_child,
        };

        docs.push(doc);
      });

    console.info(
      prefix + '节点:',
      parent_node_token || '根节点',
      docs.length > 0 ? `${docs.length} 个文档` : ''
    );
  }

  // 过滤掉标题包含 [hide] 或 [隐藏] 的文档
  docs = docs.filter((doc) => {
    let title = doc.title.toLocaleLowerCase();
    return !title.includes('[hide]') && !title.includes('[隐藏]');
  });

  // 递归获取子文档
  for (const doc of docs) {
    if (doc.has_child) {
      doc.children = await fetchAllDocs(spaceId, depth + 1, doc.node_token);
    }
  }

  return docs;
};