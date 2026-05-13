/**
 * 块类型枚举
 * 
 * 定义飞书文档中支持的所有块类型
 */
export enum BlockType {
  /** 文档根节点 */
  Page = 1,
  /** 段落 */
  Text = 2,
  /** 一级标题 */
  Heading1 = 3,
  /** 二级标题 */
  Heading2 = 4,
  /** 三级标题 */
  Heading3 = 5,
  /** 四级标题 */
  Heading4 = 6,
  /** 五级标题 */
  Heading5 = 7,
  /** 六级标题 */
  Heading6 = 8,
  /** 七级标题 */
  Heading7 = 9,
  /** 八级标题 */
  Heading8 = 10,
  /** 九级标题 */
  Heading9 = 11,
  /** 无序列表 */
  Bullet = 12,
  /** 有序列表 */
  Ordered = 13,
  /** 代码块 */
  Code = 14,
  /** 引用 */
  Quote = 15,
  /** 引用文档 */
  MentionDoc = 16,
  /** 待办事项 */
  TodoList = 17,
  /** 多维表格 */
  Bitable = 18,
  /** 高亮块 */
  Callout = 19,
  /** 群聊卡片 */
  ChatCard = 20,
  /** 流程图/UML */
  Diagram = 21,
  /** 分割线 */
  Divider = 22,
  /** 文件 */
  File = 23,
  /** 分栏 */
  Grid = 24,
  /** 分栏列 */
  GridColumn = 25,
  /** iframe 嵌入 */
  Iframe = 26,
  /** 图片 */
  Image = 27,
  /** 小组件 */
  Widget = 28,
  /** 思维导图 */
  MindNote = 29,
  /** 电子表格 */
  Sheet = 30,
  /** 表格 */
  Table = 31,
  /** 表格单元格 */
  TableCell = 32,
  /** 视图 */
  View = 33,
  /** 引用容器 */
  QuoteContainer = 34,
  /** 画板 */
  Board = 43,
  /** 同步块 */
  SyncedBlock = 999,
}

/**
 * 对齐方式枚举
 */
export enum StyleAlign {
  /** 左对齐 */
  Left = 1,
  /** 居中对齐 */
  Center = 2,
  /** 右对齐 */
  Right = 3,
}

/**
 * 代码语言枚举
 * 
 * 定义支持的编程语言和标记语言
 */
export enum CodeLanguage {
  /** 纯文本 */
  PlainText = 1,
  ABAP,
  Ada,
  Apache,
  Apex,
  AssemblyLanguage,
  Bash,
  CSharp,
  CPlusPlus,
  C,
  COBOL,
  CSS,
  CoffeeScript,
  D,
  Dart,
  Delphi,
  Django,
  Dockerfile,
  Erlang,
  Fortran,
  FoxPro,
  Go,
  Groovy,
  HTML,
  HTMLBars,
  HTTP,
  Haskell,
  JSON,
  Java,
  JavaScript,
  Julia,
  Kotlin,
  LateX,
  Lisp,
  Logo,
  Lua,
  MATLAB,
  Makefile,
  Markdown,
  Nginx,
  ObjectiveC,
  OpenEdgeABL,
  PHP,
  Perl,
  PostScript,
  PowerShell,
  Prolog,
  ProtoBuf,
  Python,
  R,
  RPG,
  Ruby,
  Rust,
  SAS,
  SCSS,
  SQL,
  Scala,
  Scheme,
  Scratch,
  Shell,
  Swift,
  Thrift,
  TypeScript,
  VBScript,
  VisualBasic,
  XML,
  YAML,
  CMake,
  Diff,
  Gherkin,
  GraphQL,
  OpenGLShadingLanguage,
  Properties,
  Solidity,
  TOML,
}

/**
 * 获取代码语言的字符串表示
 * 
 * 将飞书 API 返回的代码语言枚举值转换为 Markdown 代码块使用的语言标识符
 * 
 * @param code - 代码语言枚举值
 * @returns 语言标识符字符串（如 'js', 'py', 'cpp' 等）
 */
export const getCodeLanguage = (code: CodeLanguage) => {
  switch (code) {
    case CodeLanguage.PlainText:
      return 'text';
    case CodeLanguage.AssemblyLanguage:
      return 'assembly';
    case CodeLanguage.CPlusPlus:
      return 'cpp';
    case CodeLanguage.CoffeeScript:
      return 'coffee';
    case CodeLanguage.Dockerfile:
      return 'docker';
    case CodeLanguage.FoxPro:
      return 'foxpro';
    case CodeLanguage.TypeScript:
      return 'ts';
    case CodeLanguage.JavaScript:
      return 'js';
    case CodeLanguage.Rust:
      return 'rs';
    case CodeLanguage.Python:
      return 'py';
    case CodeLanguage.Ruby:
      return 'rb';
    case CodeLanguage.Markdown:
      return 'md';
    default:
      return CodeLanguage[code]?.toLowerCase() || '';
  }
};

/**
 * 颜色枚举
 * 
 * 定义飞书文档中支持的颜色选项
 */
export enum Color {
  LightPink = 1,
  LightOrange,
  LightYellow,
  LightGreen,
  LightBlue,
  LightPurple,
  LightGray,
  DarkPink,
  DarkOrange,
  DarkYellow,
  DarkGreen,
  DarkBlue,
  DarkPurple,
  DarkGray,
  DarkSilverGray,
}

/**
 * iframe 类型枚举
 * 
 * 定义支持的第三方嵌入内容类型
 */
export enum IframeType {
  Bilibili = 1,
  Xigua = 2,
  Youku = 3,
  Airtable = 4,
  BaiduMap = 5,
  GaodeMap = 6,
  Figma = 8,
  Modao = 9,
  Canva = 10,
  CodePen = 11,
  FeishuWenjuan = 12,
  Jinshuju = 13,
}

/**
 * 文本样式接口
 */
export interface TextStyle {
  /** 对齐方式 */
  align: StyleAlign;
  /** 是否完成（用于待办事项） */
  done: boolean;
  /** 是否折叠 */
  folded: boolean;
  /** 代码语言 */
  language: CodeLanguage;
  /** 是否自动换行 */
  wrap: boolean;
}

/**
 * 对象类型枚举
 * 
 * 定义飞书中不同类型的文档对象
 */
export enum ObjType {
  Doc = 1,
  Sheet = 3,
  Bitable = 8,
  MindNote = 11,
  File = 12,
  Slide = 15,
  Wiki = 16,
  Docx = 22,
}

/**
 * 文本链接接口
 */
export interface TextLink {
  /** 链接 URL */
  url: string;
}

/**
 * 文本元素样式接口
 * 
 * 定义文本的富文本样式属性
 */
export interface TextElementStyle {
  /** 粗体 */
  bold: boolean;
  /** 斜体 */
  italic: boolean;
  /** 删除线 */
  strikethrough: boolean;
  /** 下划线 */
  underline: boolean;
  /** 行内代码 */
  inline_code: boolean;
  /** 背景色 */
  background_color: Color;
  /** 文字颜色 */
  text_color: Color;
  /** 链接 */
  link: TextLink;
}

/**
 * 文本元素接口
 * 
 * 表示文档中的一个文本片段或其他内联元素
 */
export interface TextElement {
  /** 文本运行 */
  text_run?: TextRun;
  /** 内联文件 */
  file?: InlineFile;
  /** 内联块 */
  inline_block?: InlineBlock;
  /** 公式 */
  equation?: TextRun;
  /** 文档引用 */
  mention_doc?: MentionDoc;
}

/**
 * 文档引用接口
 * 
 * 表示对另一个飞书文档的引用
 */
export interface MentionDoc {
  /** 文档令牌 */
  token: string;
  /** 对象类型 */
  obj_type: ObjType;
  /** 文档 URL */
  url: string;
  /** 文档标题 */
  title: string;
  /** 文本样式 */
  text_element_style: TextElementStyle;
}

/**
 * 内联文件接口
 */
export interface InlineFile {
  /** 文件令牌 */
  file_token: string;
  /** 源块 ID */
  source_block_id: string;
  /** 文本样式 */
  text_element_style: TextElementStyle;
  /** 内联块 */
  inline_block: InlineBlock;
}

/**
 * 文本运行接口
 * 
 * 表示一段具有相同样式的连续文本
 */
export interface TextRun {
  /** 文本内容 */
  content: string;
  /** 文本样式 */
  text_element_style?: TextElementStyle;
}

/**
 * 内联块接口
 * 
 * 表示嵌入在文本中的块元素
 */
export interface InlineBlock {
  /** 块 ID */
  block_id: string;
  /** 文本样式 */
  text_element_style: TextElementStyle;
}

/**
 * 文本块接口
 * 
 * 表示包含文本内容的块元素
 */
export interface TextBlock {
  /** 样式 */
  style: TextStyle;
  /** 文本元素数组 */
  elements: TextElement[];
  /** 子块 ID 数组 */
  children: string[];
}

/**
 * 图片块接口
 */
export interface ImageBlock {
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 图片令牌 */
  token: string;
  /** 对齐方式 */
  align: StyleAlign;
}

/**
 * 表格块接口
 */
export interface TableBlock {
  /** 单元格 ID 数组 */
  cells: string[];
  /** 表格属性 */
  property: {
    /** 行数 */
    row_size: number;
    /** 列数 */
    column_size: number;
    /** 列宽数组 */
    column_width: number[];
    /** 是否有标题列 */
    header_column: boolean;
    /** 是否有标题行 */
    header_row: boolean;
    /** 
     * 合并信息数组
     * 每个元素对应一个单元格的合并信息
     * 例如 4x6 的表格，数组长度为 24
     */
    merge_info: TableMergeInfo[];
  };
}

/**
 * 表格合并信息接口
 */
export interface TableMergeInfo {
  /** 行跨度 */
  row_span: number;
  /** 列跨度 */
  col_span: number;
}

/**
 * 高亮块背景色枚举
 * 
 * @see https://open.feishu.cn/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/document-docx/docx-v1/data-structure/block#28d02e32
 */
export enum CalloutBackgroundColor {
  LightRed = 1,
  LightOrange = 2,
  LightYellow = 3,
  LightGreen = 4,
  LightBlue = 5,
  LightPurple = 6,
  LightGray = 7,
  DarkRed = 8,
  DarkOrange = 9,
  DarkYellow = 10,
  DarkGreen = 11,
  DarkBlue = 12,
  DarkPurple = 13,
  DarkGray = 14,
}

/**
 * 高亮块背景色映射表
 * 
 * 将背景色枚举值映射为十六进制颜色值
 */
export const CalloutBackgroundColorMap = {
  1: '#fef2f2',
  2: '#fff7ed',
  3: '#fefce8',
  4: '#f0fdf4',
  5: '#eff6ff',
  6: '#faf5ff',
  7: '#f9fafb',
  8: '#fecaca',
  9: '#fed7aa',
  10: '#fef08a',
  11: '#bbf7d0',
  12: '#bfdbfe',
  13: '#e9d5ff',
  14: '#e5e7eb',
};

/** 字体背景色类型别名 */
export type FontBackgroundColor = CalloutBackgroundColor;

/**
 * 高亮块边框色枚举
 */
export enum CalloutBorderColor {
  Red = 1,
  Orange = 2,
  Yellow = 3,
  Green = 4,
  Blue = 5,
  Purple = 6,
  Gray = 7,
}

/** 字体颜色类型别名 */
export type FontColor = CalloutBorderColor;

/**
 * 高亮块边框色映射表
 * 
 * 将边框色枚举值映射为十六进制颜色值
 */
export const CalloutBorderColorMap = {
  1: '#fecaca',
  2: '#fed7aa',
  3: '#fef08a',
  4: '#bbf7d0',
  5: '#bfdbfe',
  6: '#e9d5ff',
  7: '#e5e7eb',
};

/**
 * 字体颜色映射表
 * 
 * 将颜色枚举值映射为十六进制颜色值
 */
export const FontColorMap = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#22c55e',
  5: '#3b82f6',
  6: '#a855f7',
  7: '#6b7280',
};

/**
 * 高亮块接口
 */
export interface CalloutBlock {
  /** 背景色 */
  background_color: CalloutBackgroundColor;
  /** 边框色 */
  border_color: CalloutBorderColor;
  /** 文字颜色 */
  text_color: FontColor;
  /** emoji ID */
  emoji_id: String;
}

/**
 * 块接口
 * 
 * 表示飞书文档中的一个块元素
 * 根据 block_type 的不同，不同的属性会被使用
 */
export interface Block {
  /** 块 ID */
  block_id: string;
  /** 父块 ID */
  parent_id: string;
  /** 子块 ID 数组 */
  children: string[];
  /** 块类型 */
  block_type: BlockType;
  /** 页面块数据 */
  page: TextBlock;
  /** 文本块数据 */
  text: TextBlock;
  /** 一级标题数据 */
  heading1: TextBlock;
  /** 二级标题数据 */
  heading2: TextBlock;
  /** 三级标题数据 */
  heading3: TextBlock;
  /** 四级标题数据 */
  heading4: TextBlock;
  /** 五级标题数据 */
  heading5: TextBlock;
  /** 六级标题数据 */
  heading6: TextBlock;
  /** 七级标题数据 */
  heading7: TextBlock;
  /** 八级标题数据 */
  heading8: TextBlock;
  /** 九级标题数据 */
  heading9: TextBlock;
  /** 无序列表数据 */
  bullet: TextBlock;
  /** 有序列表数据 */
  ordered: TextBlock;
  /** 代码块数据 */
  code: TextBlock;
  /** 引用数据 */
  quote: TextBlock;
  /** 待办事项数据 */
  todo: TextBlock;
  /** 多维表格数据 */
  bitable: TextBlock;
  /** 高亮块数据 */
  callout: CalloutBlock;
  /** 群聊卡片数据 */
  chat_card: TextBlock;
  /** 流程图/UML 数据 */
  diagram: TextBlock;
  /** 分割线数据 */
  divider: TextBlock;
  /** 文件数据 */
  file: {
    /** 文件名 */
    name: string;
    /** 文件令牌 */
    token: string;
  };
  /** 分栏数据 */
  grid: {
    /** 分栏列数量 */
    column_size: number;
  };
  /** 分栏列数据 */
  grid_column: {
    /** 当前分栏列占整个分栏的比例 */
    width_ratio: number;
  };
  /** iframe 数据 */
  iframe: {
    /** 组件信息 */
    component: {
      /** iframe 类型 */
      iframe_type: IframeType;
      /** URL（URL 编码格式） */
      url: string;
    };
  };
  /** 图片数据 */
  image: ImageBlock;
  /** 表格数据 */
  table: TableBlock;
  /** 表格单元格数据 */
  table_cell: TextBlock;
  /** 画板数据 */
  board: ImageBlock;
}

/**
 * 获取对齐方式的字符串表示
 * 
 * @param align - 对齐方式枚举值
 * @returns 对齐方式字符串（'left' | 'center' | 'right'）
 */
export function getAlignStyle(align: StyleAlign) {
  switch (align) {
    case StyleAlign.Left:
      return 'left';
    case StyleAlign.Center:
      return 'center';
    case StyleAlign.Right:
      return 'right';
    default:
      return 'left';
  }
}

/**
 * 文件令牌接口
 * 
 * 用于跟踪文档中引用的文件、图片和画板
 */
export interface FileToken {
  /** 文件令牌 */
  token: string;
  /** 文件类型 */
  type: 'file' | 'image' | 'board';
}