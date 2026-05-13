import { Block, FileToken } from './types.js';

/**
 * 渲染器基类
 * 
 * 提供飞书文档解析的基础功能和通用方法
 * 具体的渲染逻辑由子类实现
 */
export class Renderer {
  /** 文档 ID */
  documentId: string;
  /** 页面元数据 */
  meta?: Record<string, any>;
  /** 块映射表，key 为块 ID，value 为块对象 */
  blockMap: Record<string, Block> = {};
  /** 父块 ID */
  parentId?: string;
  /** 文件令牌映射表 */
  fileTokens: Record<string, FileToken> = {};
  /** 下一个块 */
  nextBlock?: Block | null;
  /** 当前块 */
  currentBlock?: Block | null;
  /** 当前缩进级别 */
  indent: number = 0;
  /** 是否启用调试模式 */
  debug: boolean;
  /** 是否输出不支持的块类型信息 */
  outputUnsupported: boolean = false;

  /**
   * 构造函数
   * 
   * @param doc - 飞书文档数据
   * @param options - 配置选项
   * @param options.debug - 是否启用调试模式
   * @param options.outputUnsupported - 是否输出不支持的块类型
   */
  constructor(
    doc: any,
    options: { debug?: boolean; outputUnsupported?: boolean } = {}
  ) {
    const { debug = false, outputUnsupported } = options;

    this.documentId = doc?.document?.document_id || '';
    this.fileTokens = {};
    doc?.blocks?.forEach((block: any) => {
      this.blockMap[block?.block_id] = block;
    });
    this.debug = debug;
    this.outputUnsupported = outputUnsupported ?? false;
  }

  /**
   * 解析飞书文档为新格式
   * 
   * @returns 新格式的内容文本
   */
  parse(): string {
    const entryBlock = this.blockMap[this.documentId];
    return this.parseBlock(entryBlock, 0);
  }

  /**
   * 解析块元素（抽象方法，由子类实现）
   * 
   * @param block - 要解析的块元素
   * @param indent - 缩进级别
   * @returns 解析后的字符串
   */
  parseBlock(block: Block, indent: number): string {
    throw new Error('Not implemented');
  }

  /**
   * 在子缩进上下文中执行函数
   * 
   * 执行完成后会恢复原来的缩进级别
   * 
   * @param fn - 要执行的函数
   */
  withSubIndent(fn: () => void) {
    const oldIndent = this.indent;
    fn();
    this.indent = oldIndent;
  }

  /**
   * 添加文件令牌到上下文
   * 
   * 用于跟踪文档中引用的文件、图片和画板
   * 
   * @param type - 文件类型（file/image/board）
   * @param token - 文件令牌
   */
  addFileToken(type: 'file' | 'image' | 'board', token: string) {
    this.fileTokens[token] = {
      token,
      type,
    };
  }
}

/**
 * 去掉末尾一个换行符
 * 
 * @param str - 输入字符串
 * @returns 去掉末尾换行符的字符串
 */
export const trimLastNewline = (str: string) => {
  return str.replace(/\n$/, '');
};

/**
 * 转义 HTML 标签为 HTML 实体
 * 
 * 用于避免飞书段落文本中的 `<` 或 `>` 字符破坏 HTML 结构。
 * 在某些静态站点生成器（VitePress、Docusaurus）中，使用的 JSX 和 Vue 模板会导致 HTML 结构破坏。
 * 
 * 转换规则：
 * - `>` -> `&gt;`（注意：Markdown 中 > 用于引用块）
 * - `<` -> `&lt;`
 * 
 * 此方法必须确保仅用于转义纯文本，而非 Markdown 文本。
 * 
 * @param plainText - 纯文本字符串
 * @returns 转义后的文本
 */
export const escapeHTMLTags = (plainText: string) => {
  return plainText.replace(/<|>/g, (m) => {
    switch (m) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      default:
        return m;
    }
  });
};