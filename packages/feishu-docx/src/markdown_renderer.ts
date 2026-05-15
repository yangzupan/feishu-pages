// @ts-ignore
import YAML from 'js-yaml';
import { marked } from 'marked';
import { markedXhtml } from 'marked-xhtml';
import { createElement } from './dom.js';
import { getEmojiChar } from './emoji.js';
import { Buffer } from './string_buffer.js';

import { Renderer, escapeHTMLTags, trimLastNewline } from './renderer.js';
import {
  Block,
  BlockType,
  CalloutBackgroundColorMap,
  CalloutBorderColorMap,
  CodeLanguage,
  FontColorMap,
  ImageBlock,
  TableBlock,
  TableMergeInfo,
  TextBlock,
  TextElement,
  TextRun,
  getAlignStyle,
  getCodeLanguage,
} from './types.js';

// 使用类型断言解决 marked-xhtml 与 marked 18.x 的类型兼容性问题
marked.use(markedXhtml() as any);

/**
 * Markdown 渲染器
 * 
 * 将飞书文档转换为 Markdown GFM 格式
 * 灵感来源于 feishu2md (Go 版本)
 * @see https://github.com/Wsine/feishu2md/blob/cb906109235b07b82b5a6348bdf1103c9fa1e62c/core/parser.go
 */
export class MarkdownRenderer extends Renderer {
  /**
   * 解析块元素
   * 
   * 根据块类型调用相应的解析方法，将飞书文档块转换为 Markdown 格式
   * 
   * @param block - 要解析的块元素
   * @param indent - 缩进级别
   * @returns 解析后的 Markdown 字符串
   */
  parseBlock(block: Block, indent: number) {
    this.indent = indent;

    if (!block) {
      return '';
    }

    const buf = new Buffer();
    buf.writeIndent(this.indent);

    this.currentBlock = block;
    switch (block.block_type) {
      case BlockType.Page:
        buf.write(this.parsePageBlock(block));
        break;
      case BlockType.Text:
        buf.write(this.parseTextBlock(block, block.text));
        break;
      case BlockType.Heading1:
        buf.write('# ');
        buf.write(String(this.parseTextBlock(block, block.heading1)).trimStart());
        break;
      case BlockType.Heading2:
        buf.write('## ');
        buf.write(String(this.parseTextBlock(block, block.heading2)).trimStart());
        break;
      case BlockType.Heading3:
        buf.write('### ');
        buf.write(String(this.parseTextBlock(block, block.heading3)).trimStart());
        break;
      case BlockType.Heading4:
        buf.write('#### ');
        buf.write(String(this.parseTextBlock(block, block.heading4)).trimStart());
        break;
      case BlockType.Heading5:
        buf.write('##### ');
        buf.write(String(this.parseTextBlock(block, block.heading5)).trimStart());
        break;
      case BlockType.Heading6:
        buf.write('###### ');
        buf.write(String(this.parseTextBlock(block, block.heading6)).trimStart());
        break;
      case BlockType.Heading7:
        buf.write('####### ');
        buf.write(String(this.parseTextBlock(block, block.heading7)).trimStart());
        break;
      case BlockType.Heading8:
        buf.write('######## ');
        buf.write(String(this.parseTextBlock(block, block.heading8)).trimStart());
        break;
      case BlockType.Heading9:
        buf.write('######### ');
        buf.write(String(this.parseTextBlock(block, block.heading9)).trimStart());
        break;
      case BlockType.Bullet:
        buf.write(String(this.parseBulletBlock(block, indent)).trimStart());
        break;
      case BlockType.Ordered:
        buf.write(this.parseOrderedBlock(block, indent));
        break;
      case BlockType.Code:
        buf.write('```');
        buf.write(getCodeLanguage(block.code.style.language));
        buf.write('\n');
        buf.write(this.parseTextBlock(block, block.code).toString().trim());
        buf.write('\n```\n');
        break;
      case BlockType.Quote:
        buf.write('> ');
        buf.write(this.parseTextBlock(block, block.quote));
        break;
      case BlockType.TodoList:
        buf.write('- [');
        buf.write(block.todo.style.done ? 'x' : ' ');
        buf.write('] ');
        buf.write(this.parseTextBlock(block, block.todo));
        break;
      case BlockType.Divider:
        buf.write('---\n');
        break;
      case BlockType.Image:
        buf.write(this.parseImage(block.image));
        break;
      case BlockType.TableCell:
        buf.write(this.parseTableCell(block));
        break;
      case BlockType.Table:
        buf.write(this.parseTable(block.table));
        break;
      case BlockType.QuoteContainer:
        buf.write(this.parseQuoteContainer(block));
        break;
      case BlockType.View:
        buf.write(this.parseView(block));
        break;
      case BlockType.File:
        buf.write(this.parseFile(block));
        break;
      case BlockType.Grid:
        buf.write(this.parseGrid(block));
        break;
      case BlockType.GridColumn:
        break;
      case BlockType.Callout:
        buf.write(this.parseCallout(block));
        break;
      case BlockType.Iframe:
        buf.write(this.parseIframe(block));
        break;
      case BlockType.Board:
        buf.write(this.parseBoard(block.board));
        break;
      case BlockType.SyncedBlock:
        buf.write(this.parseSyncedBlock(block));
        break;
      default:
        buf.write(this.parseUnsupport(block));
        break;
    }

    return buf.toString();
  }

  /**
   * 解析页面元数据
   * 
   * 从第一个代码块中提取页面元数据（YAML 或 JSON 格式）
   * 
   * @param block - 要解析的块元素
   * @returns 如果找到并成功解析元数据则返回 true，否则返回 false
   * @see https://longbridge.github.io/feishu-pages/zh-CN/page-meta
   */
  parsePageMeta(block: Block): any {
    if (block?.block_type !== BlockType.Code) {
      if (block.children?.length > 0) {
        return this.parsePageMeta(this.blockMap[block.children[0]]);
      } else {
        return false;
      }
    }

    // 仅支持 YAML 和 JSON 格式
    if (block?.code?.style?.language !== CodeLanguage.YAML && 
        block?.code?.style?.language !== CodeLanguage.JSON) {
      return false;
    }
    let code = this.parseTextBlock(block, block.code).toString().trim();

    if (!code) {
      return false;
    }

    const language = block?.code?.style?.language;
    try {
      if (language === CodeLanguage.YAML) {
        this.meta = YAML.load(code);
      } else if (language === CodeLanguage.JSON) {
        this.meta = JSON.parse(code);
      }
    } catch {
      console.error(`无效的 ${language} 内容，已忽略。\n\n` + code);
    }

    return true;
  }

  /**
   * 解析页面块
   * 
   * 处理页面级别的块元素，包括标题和子元素
   * 
   * @param block - 页面块元素
   * @returns 解析后的 Markdown 字符串
   */
  parsePageBlock(block: Block): Buffer | string {
    const buf = new Buffer();

    buf.write('# ');
    buf.write(this.parseTextBlock(block, block.page));
    buf.write('\n');

    block.children?.forEach((childId, idx) => {
      const child = this.blockMap[childId];
      this.nextBlock = this.blockMap[block.children[idx + 1]];

      // 从第一个代码块提取页面元数据
      if (idx == 0) {
        if (this.parsePageMeta(child)) {
          return;
        }
      }

      this.withSubIndent(() => {
        let childText = this.parseBlock(child, 0);
        if (childText.length > 0) {
          buf.write(childText);
          buf.write('\n');
        }
      });
    });

    return buf;
  }

  /**
   * 解析文本块
   * 
   * 处理包含文本内容的块元素，如普通文本、标题等
   * 
   * @param block - 文本块元素
   * @param textBlock - 文本块数据结构
   * @returns 解析后的 Markdown 字符串
   */
  parseTextBlock(block: Block, textBlock: TextBlock): Buffer | string {
    const buf = new Buffer();
    const inline = textBlock.elements.length > 1;

    textBlock.elements?.forEach((el) => {
      this.parseTextElement(buf, el, inline);
    });

    if (buf.length > 0) {
      buf.write('\n');
    }

    // 对于有子元素的块：渲染子元素
    const childrenBlockList = [
      BlockType.Text,
      BlockType.Heading1,
      BlockType.Heading2,
      BlockType.Heading3,
      BlockType.Heading4,
      BlockType.Heading5,
      BlockType.Heading6,
      BlockType.Heading7,
      BlockType.Heading8,
      BlockType.Heading9
    ]
    if (childrenBlockList.find(type => type === block.block_type)) {
      block.children?.forEach((childId, _) => {
        const child = this.blockMap[childId];
        buf.write(this.parseBlock(child, this.indent));
      });
    }

    return buf;
  }

  /**
   * 解析无序列表块
   * 
   * 处理无序列表项及其嵌套子项
   * 
   * @param block - 列表块元素
   * @param indent - 缩进级别
   * @returns 解析后的 Markdown 字符串
   */
  parseBulletBlock(block: Block, indent: number = 0): Buffer | string {
    const buf = new Buffer();

    buf.write('- ');
    let itemText = this.parseTextBlock(block, block.bullet).toString();
    if (
      this.nextBlock?.block_type == block.block_type &&
      this.nextBlock?.parent_id == block.parent_id &&
      !block.children?.length
    ) {
      itemText = trimLastNewline(itemText);
    }

    buf.write(itemText);

    this.withSubIndent(() => {
      block.children?.forEach((childId, idx) => {
        const child = this.blockMap[childId];
        this.nextBlock = null;
        buf.write(this.parseBlock(child, indent + 1));
      });
    });

    return buf;
  }

  /**
   * 解析有序列表块
   * 
   * 处理有序列表项，计算正确的序号并处理嵌套子项
   * 
   * @param block - 列表块元素
   * @param indent - 缩进级别
   * @returns 解析后的 Markdown 字符串
   */
  parseOrderedBlock(block: Block, indent: number = 0): Buffer | string {
    const buf = new Buffer();

    const parent = this.blockMap[block.parent_id];
    let order = 1;

    // 计算序号
    parent?.children?.forEach((childId, idx) => {
      if (childId == block.block_id) {
        for (let i = idx - 1; i >= 0; i--) {
          if (
            this.blockMap[parent.children[i]].block_type == BlockType.Ordered
          ) {
            order++;
          } else {
            break;
          }
        }
      }
    });

    buf.write(`${order}. `);
    let itemText = this.parseTextBlock(block, block.ordered).toString();
    if (
      this.nextBlock?.block_type == block.block_type &&
      this.nextBlock?.parent_id == block.parent_id &&
      !block.children?.length
    ) {
      itemText = trimLastNewline(itemText);
    }
    buf.write(itemText);

    // 子项
    this.withSubIndent(() => {
      block.children?.forEach((childId, idx) => {
        const child = this.blockMap[childId];
        // 查看下一个块
        this.nextBlock = null;
        buf.write(this.parseBlock(child, indent + 1));
      });
    });

    return buf;
  }

  /**
   * 解析文本元素
   * 
   * 处理文本运行、公式和文档引用等内联元素
   * 
   * @param buf - 输出缓冲区
   * @param el - 文本元素
   * @param inline - 是否为内联元素
   */
  parseTextElement(buf: Buffer, el: TextElement, inline: boolean) {
    if (el.text_run) {
      this.parseTextRun(buf, el.text_run);
    } else if (el.equation) {
      let symbol = inline ? '$' : '$$';
      buf.write(symbol);
      buf.write(String(el.equation.content).trimEnd());
      buf.write(symbol);
    } else if (el.mention_doc) {
      const node_token = decodeURIComponent(el.mention_doc.token);
      buf.write(`[${el.mention_doc.title}](${node_token})`);
    }
  }

  /**
   * 解析文本运行
   * 
   * 处理带有样式（粗体、斜体、链接等）的文本片段
   * 
   * @param buf - 输出缓冲区
   * @param textRun - 文本运行对象
   */
  parseTextRun(buf: Buffer, textRun: TextRun) {
    let preWrite = '';
    let postWrite = '';

    let style = textRun.text_element_style;
    let escape = true;
    if (style) {
      if (style.bold) {
        preWrite = '<b>';
        postWrite = '</b>';
      } else if (style.italic) {
        preWrite = '<em>';
        postWrite = '</em>';
      } else if (style.strikethrough) {
        preWrite = '<del>';
        postWrite = '</del>';
      } else if (style.underline) {
        preWrite = '<u>';
        postWrite = '</u>';
      } else if (style.inline_code) {
        preWrite = '`';
        postWrite = '`';
        escape = false;
      } else if (style.link) {
        const unescapeURL = decodeURIComponent(style.link.url);
        preWrite = `[`;
        postWrite = `](${unescapeURL})`;
      }
    }

    let plainText = textRun.content || '';
    // 仅在无样式时转义 HTML 标签
    // 例如：`<div>` 将保持原样
    // 代码块中忽略转义
    if (escape && this.currentBlock?.block_type != BlockType.Code) {
      plainText = escapeHTMLTags(plainText);
    }

    // 如果纯文本以标点符号（: 或 ：）结尾，则使用 HTML 标签
    if (plainText.match(/[:：]$/)) {
      if (style?.bold) {
        preWrite = '<b>';
        postWrite = '</b>';
      } else if (style?.italic) {
        preWrite = '<i>';
        postWrite = '</i>';
      } else if (style?.strikethrough) {
        preWrite = '<del>';
        postWrite = '</del>';
      }
    }

    // 如果前一个样式与当前相同，则可以合并
    // 例如：
    // 前一个是：**He**
    // 当前是：**llo**
    // 则可以合并为 **Hello**
    if (!buf.trimLastIfEndsWith(preWrite)) {
      buf.write(preWrite);
    }
    buf.write(plainText);
    buf.write(postWrite);
  }

  /**
   * 解析图片块
   * 
   * 处理图片元素，包括对齐方式和尺寸属性
   * 
   * @param image - 图片块数据
   * @returns 解析后的 HTML img 标签
   */
  parseImage(image: ImageBlock): Buffer | string {
    const buf = new Buffer();

    const align = getAlignStyle(image.align);
    let alignAttr = '';
    if (align != 'left') {
      alignAttr = ` align="${align}"`;
    }

    const el = createElement('img');
    el.setAttribute('src', image.token);
    if (image.width) {
      el.setAttribute('src-width', image.width.toString());
    }
    // 仅在未提供宽度时提供高度
    if (image.height) {
      el.setAttribute('src-height', image.height.toString());
    }
    if (align && align != 'left') {
      el.setAttribute('align', align);
    }

    buf.write(el.outerHTML);
    buf.write('\n');

    this.addFileToken('image', image.token);

    return buf;
  }

  /**
   * 解析表格单元格
   * 
   * 递归处理单元格内的子元素
   * 
   * @param block - 表格单元格块
   * @returns 解析后的内容
   */
  parseTableCell(block: Block): Buffer | string {
    const buf = new Buffer();

    this.withSubIndent(() => {
      block.children?.forEach((childId) => {
        const child = this.blockMap[childId];
        buf.write(this.parseBlock(child, 0));
      });
    });

    return buf;
  }

  /**
   * 解析表格
   * 
   * 将飞书表格转换为 Markdown 表格格式
   * 对于复杂表格（含合并单元格或自定义列宽）则转换为 HTML
   * 
   * @param table - 表格块数据
   * @returns 解析后的 Markdown 或 HTML 表格
   */
  parseTable(table: TableBlock): Buffer | string {
    if (this.isComplexTable(table)) {
      return this.parseTableAsHTML(table);
    }

    let rows: string[][] = [[]];

    this.withSubIndent(() => {
      table.cells.forEach((blockId, idx) => {
        const block = this.blockMap[blockId];
        let cellText = this.parseBlock(block, 0);
        cellText = trimLastNewline(cellText).replace(/\n/gm, '<br/>');
        const row = Math.floor(idx / table.property.column_size);

        if (rows.length < row + 1) {
          rows.push([]);
        }

        rows[row].push(cellText);
      });
    });

    const buf = new Buffer();

    // 写入表头
    let headRow: string[] = [];
    if (table.property?.header_row) {
      const shifted = rows.shift();
      if (shifted) {
        headRow = shifted;
      }
    }
    buf.write('|');
    for (let i = 0; i < table.property?.column_size; i++) {
      buf.write(headRow[i] || '   ');
      buf.write('|');
    }
    buf.write('\n');

    // 渲染表头分隔线
    buf.write('|');
    for (let i = 0; i < table.property?.column_size; i++) {
      buf.write('---|');
    }
    buf.write('\n');

    // 渲染表体
    for (const row of rows) {
      buf.write('|');
      row.forEach((cell) => {
        buf.write(cell);
        buf.write('|');
      });
      buf.write('\n');
    }

    return buf;
  }

  /**
   * 将表格解析为 HTML
   * 
   * 处理复杂表格（含合并单元格或自定义列宽），生成 HTML 表格
   * 
   * @param table - 表格块数据
   * @returns HTML 表格字符串
   */
  parseTableAsHTML(table: TableBlock): Buffer | string {
    let rows: string[][] = [[]];

    this.withSubIndent(() => {
      table.cells.forEach((blockId, idx) => {
        const block = this.blockMap[blockId];
        let cellHTML = this.markdownToHTML(this.parseBlock(block, 0));
        const row = Math.floor(idx / table.property.column_size);
        if (rows.length < row + 1) {
          rows.push([]);
        }

        rows[row].push(cellHTML.trim());
      });
    });

    // 构建表格属性
    let attrs: any = {};
    if (table.property.header_column) {
      attrs.header_column = 1;
    }
    if (table.property.header_row) {
      attrs.header_row = 1;
    }

    let attrHTML = Object.keys(attrs)
      .map((key) => `${key}="${attrs[key]}"`)
      .join(' ');
    if (attrHTML.length > 0) {
      attrHTML = ` ${attrHTML}`;
    }

    const buf = new Buffer();
    buf.writeln(`<table${attrHTML}>`);

    // 写入 colgroup 用于列宽
    buf.writeln('<colgroup>');

    for (let i = 0; i < table.property?.column_size; i++) {
      let width = table.property?.column_width[i];
      let widthAttr = width ? ` width="${width}"` : '';
      buf.writeln(`<col${widthAttr}/>`);
    }
    buf.writeln('</colgroup>');

    let cellIdx = 0;

    /*
      合并单元格示例

      | 0 | 1 | 2 | 3 |
      --------|   |----
      | 4   5 | 6 | 7 |
      -----------------
      | 8 | 9 | 10| 11|
    */
    let columnSize = table.property?.column_size;
    let mergeInfos = table.property?.merge_info;

    // cellInfos 用来存储每个单元格是否要生成，1 生成，0 跳过
    let cellInfos = mergeInfos.map((info) => {
      return 1;
    });

    // 遍历 mergeInfos，将需要合并的单元格标记为 0
    for (let i = 0; i < mergeInfos.length; i++) {
      let info = mergeInfos[i];
      let rowSpan = info.row_span;
      let colSpan = info.col_span;

      if (rowSpan > 1) {
        for (let j = 1; j < rowSpan; j++) {
          cellInfos[i + j * columnSize] = 0;
        }
      }

      if (colSpan > 1) {
        for (let j = 1; j < colSpan; j++) {
          cellInfos[i + j] = 0;
        }
      }
    }

    const writeCell = (buf: Buffer, cell: string, tag: 'th' | 'td') => {
      let attr = this.tableCellAttrHTML(mergeInfos, cellIdx);
      if (cellInfos?.[cellIdx] == 1) {
        buf.write(`<${tag}${attr}>${cell || ''}</${tag}>`);
      }

      cellIdx += 1;
    };

    // 写入表头
    if (table.property?.header_row) {
      let headRow: string[] = [];
      const shifted = rows.shift();
      if (shifted) {
        headRow = shifted;
      }

      buf.writeln('<thead>');
      buf.write('<tr>');
      for (let i = 0; i < columnSize; i++) {
        writeCell(buf, headRow[i], 'th');
      }
      buf.writeln('</tr>');
      buf.writeln('</thead>');
    }

    // 渲染表体
    buf.writeln('<tbody>');
    for (const row of rows) {
      buf.write('<tr>');
      row.forEach((cell) => {
        writeCell(buf, cell, 'td');
      });
      buf.writeln('</tr>');
    }
    buf.writeln('</tbody>');
    buf.writeln('</table>');

    return buf.toString({ indent: this.indent });
  }

  /**
   * 引用容器解析
   * 
   * 处理引用块及其子元素，添加 > 前缀
   * 
   * @param block - 引用容器块
   * @returns 解析后的 Markdown 引用字符串
   */
  parseQuoteContainer(block: Block): Buffer | string {
    const buf = new Buffer();

    this.withSubIndent(() => {
      block.children?.forEach((childId) => {
        const child = this.blockMap[childId];
        buf.write('> ');
        buf.write(this.parseBlock(child, 0));
      });
    });

    return buf;
  }

  /**
   * 视图块解析
   * 
   * 处理视图容器及其子元素
   * 
   * @param block - 视图块
   * @returns 解析后的内容
   */
  parseView(block: Block): Buffer | string {
    const buf = new Buffer();

    this.withSubIndent(() => {
      block.children?.forEach((childId) => {
        const child = this.blockMap[childId];
        buf.write(this.parseBlock(child, 0));
      });
    });

    return buf;
  }

  /**
   * 文件块解析
   * 
   * 将文件附件转换为 Markdown 链接格式
   * 
   * @param block - 文件块
   * @returns Markdown 链接字符串
   */
  parseFile(block: Block): Buffer | string {
    const buf = new Buffer();
    const file = block.file;

    this.addFileToken('file', file.token);

    buf.write(`[${file.name}](${file.token})`);
    buf.write('\n');

    return buf.toString();
  }

  /**
   * 网格布局解析
   * 
   * 将飞书网格布局转换为 HTML div 结构
   * 
   * @param block - 网格块
   * @returns HTML 网格结构字符串
   */
  parseGrid(block: Block) {
    const buf = new Buffer();
    const { column_size } = block.grid;

    buf.writeln(
      `<div class="flex gap-3 columns-${column_size}" column-size="${column_size}">`
    );

    block.children?.forEach((childId) => {
      const child = this.blockMap[childId];
      buf.write(this.parseGridColumn(child));
    });
    buf.writeln('</div>');

    return buf.toString({ indent: this.indent });
  }

  /**
   * 网格列解析
   * 
   * 处理网格中的单个列及其内容
   * 
   * @param block - 网格列块
   * @returns HTML 列结构字符串
   */
  parseGridColumn(block: Block): Buffer | string {
    const buf = new Buffer();

    let { width_ratio } = block.grid_column;

    buf.writeln(
      `<div class="w-[${width_ratio}%]" width-ratio="${width_ratio}">`
    );

    let inner = '';

    this.withSubIndent(() => {
      inner = (block.children ?? [])
        .map((childId) => {
          const child = this.blockMap[childId];
          return this.parseBlock(child, 0);
        })
        .join('\n');
    });

    buf.write(this.markdownToHTML(inner));
    buf.writeln('</div>');

    return buf.toString({ indent: this.indent });
  }

  /**
   * 高亮块解析
   * 
   * 处理带背景色、边框和 emoji 的高亮提示块
   * 
   * @param block - 高亮块
   * @returns HTML 高亮块结构字符串
   */
  parseCallout(block: Block): Buffer | string {
    const buf = new Buffer();

    const style: Record<string, string> = {};
    const classNames = ['callout'];

    if (block.callout.background_color) {
      const backgroundColor =
        CalloutBackgroundColorMap[block.callout.background_color];
      style['background'] = backgroundColor;
      classNames.push(`callout-bg-${block.callout.background_color}`);
    }

    if (block.callout.border_color) {
      const borderColor = CalloutBorderColorMap[block.callout.border_color];
      style['border'] = `1px solid ${borderColor}`;
      classNames.push(`callout-border-${block.callout.border_color}`);
    }
    if (block.callout.text_color) {
      const textColor = FontColorMap[block.callout.text_color] || '#2222';
      style['color'] = textColor;
      classNames.push(`callout-color-${block.callout.text_color}`);
    }

    const styleAttr = Object.keys(style)
      .map((key) => {
        return `${key}: ${style[key]}`;
      })
      .join('; ');

    buf.writeln(`<div class="${classNames.join(' ')}">`);
    if (block.callout.emoji_id) {
      buf.write("<div class='callout-emoji'>");
      buf.write(getEmojiChar(block.callout.emoji_id));
      buf.writeln('</div>');
    }

    // 高亮块内部内容需要输出为 HTML
    let markdownBuf = new Buffer();

    this.withSubIndent(() => {
      markdownBuf.write(
        block.children
          ?.map((childId) => {
            const child = this.blockMap[childId];
            return this.parseBlock(child, 0);
          })
          .join('\n')
      );
    });

    let html = this.markdownToHTML(markdownBuf.toString());
    buf.write(html);
    buf.writeln('</div>');

    return buf.toString({ indent: this.indent });
  }

  /**
   * iframe 嵌入解析
   * 
   * 将 iframe 组件转换为 HTML iframe 标签
   * 
   * @param block - iframe 块
   * @returns HTML iframe 标签字符串
   */
  parseIframe(block: Block): Buffer | string {
    let buf = new Buffer();

    let url = block.iframe?.component?.url;
    if (!url) return '';

    const el = createElement('iframe');
    el.setAttribute('src', decodeURIComponent(block.iframe.component.url));
    buf.write(el.outerHTML);
    buf.write('\n');
    return buf;
  }

  /**
   * 画板解析
   * 
   * 处理飞书画板，转换为图片标签
   * 
   * @param board - 画板数据
   * @returns HTML img 标签字符串
   */
  parseBoard(board: ImageBlock): Buffer | string {
    const buf = new Buffer();

    const align = getAlignStyle(board.align);
    let alignAttr = '';
    if (align != 'left') {
      alignAttr = ` align="${align}"`;
    }

    const el = createElement('img');
    el.setAttribute('src', board.token);
    if (board.width) {
      el.setAttribute('src-width', board.width.toString());
    }
    // 仅在未提供宽度时提供高度
    if (board.height) {
      el.setAttribute('src-height', board.height.toString());
    }
    if (align && align != 'left') {
      el.setAttribute('align', align);
    }

    buf.write(el.outerHTML);
    buf.write('\n');

    this.addFileToken('board', board.token);
    console.info("新增画板: " + board.token)

    return buf;
  }

  /**
   * 同步块解析
   * 
   * 处理同步块及其子元素
   * 
   * @param block - 同步块
   * @returns 解析后的内容
   */
  parseSyncedBlock(block: Block): Buffer {
    const buf = new Buffer();

    this.withSubIndent(() => {
      block.children?.forEach((childId) => {
        const child = this.blockMap[childId];
        buf.write(this.parseBlock(child, 0));
      });
    });

    return buf;
  }

  /**
   * 不支持的块类型处理
   * 
   * 当遇到不支持的块类型时，输出调试信息
   * 
   * @param block - 不支持的块
   * @returns 包含块信息的代码块字符串
   */
  parseUnsupport(block: Block) {
    if (!this.outputUnsupported) {
      return '';
    }

    const buf = new Buffer();

    buf.write('```\n');
    buf.write(`// [不支持] ${BlockType[block.block_type]}\n`);
    buf.write(JSON.stringify(block, null, 2));
    buf.write('\n```\n');
    return buf.toString();
  }

  /**
   * Markdown 转 HTML
   * 
   * 使用 marked 库将 Markdown 转换为 HTML
   * 
   * @param markdown - Markdown 字符串
   * @returns HTML 字符串
   */
  markdownToHTML(markdown: string): string {
    const html = marked.parse(markdown, { gfm: true, breaks: true });
    return String(html);
  }

  /**
   * 生成表格单元格属性 HTML
   * 
   * 根据合并信息生成 rowspan 和 colspan 属性
   * 
   * @param mergeInfos - 合并信息数组
   * @param idx - 单元格索引
   * @returns 属性 HTML 字符串
   */
  tableCellAttrHTML(mergeInfos: TableMergeInfo[], idx: number): string {
    let mergeInfo = mergeInfos[idx];
    if (!mergeInfo) return '';

    let attr: any = {};
    if (mergeInfo.row_span > 1) {
      attr.rowspan = mergeInfo.row_span;
    }
    if (mergeInfo.col_span > 1) {
      attr.colspan = mergeInfo.col_span;
    }

    let html = Object.keys(attr)
      .map((key) => `${key}="${attr[key]}"`)
      .join(' ');

    if (html.length > 0) {
      html = ` ${html}`;
    }
    return html;
  }

  /**
   * 判断是否为复杂表格
   * 
   * 检查表格是否包含合并单元格或自定义列宽
   * 
   * @param table - 表格数据
   * @returns 如果是复杂表格则返回 true
   */
  isComplexTable(table: TableBlock): boolean {
    let mergeInfos = table.property?.merge_info;
    let hasMerge = mergeInfos.some((info) => {
      return info.row_span > 1 || info.col_span > 1;
    });
    let hasColWidth = table.property?.column_width?.some((width) => {
      return width > 100;
    });

    return hasMerge || hasColWidth;
  }
}