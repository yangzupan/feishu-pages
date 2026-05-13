/**
 * 字符串缓冲区
 * 
 * 用于高效地构建字符串，避免频繁的字符串拼接操作。
 * 支持写入字符串、换行、缩进等操作，并提供格式化输出功能。
 */
export class Buffer {
  /** 内部字符串数组 */
  buffer: string[] = [];
  /** 总长度 */
  length: number;

  constructor() {
    this.buffer = [];
    this.length = 0;
  }

  /**
   * 写入字符串或另一个缓冲区
   * 
   * @param s - 要写入的字符串或缓冲区对象
   */
  write(s: string | Buffer) {
    if (typeof s === 'string') {
      this.buffer.push(s);
      this.length += s.length;
    } else {
      for (let part of s.buffer) {
        this.buffer.push(part);
        this.length += part.length;
      }
    }
  }

  /**
   * 写入字符串并追加换行符
   * 
   * @param s - 要写入的字符串或缓冲区对象
   */
  writeln(s: string | Buffer) {
    this.write(s);
    this.write('\n');
  }

  /**
   * 写入指定级别的缩进
   * 
   * 每个缩进级别为 4 个空格
   * 
   * @param indent - 缩进级别
   */
  writeIndent(indent: number) {
    this.write(' '.repeat(indent * 4));
  }

  /**
   * 如果最后一个字符串以指定部分结尾，则移除该部分
   * 
   * 用于合并相邻的相同样式标记，避免重复
   * 
   * @param part - 要检查并移除的后缀
   * @returns 如果成功移除则返回 true，否则返回 false
   */
  trimLastIfEndsWith(part: string): boolean {
    if (part.length == 0) {
      return false;
    }

    const lastIdx = this.buffer.length - 1;
    const lastStr = this.buffer[lastIdx];
    if (!lastStr) {
      return false;
    }
    if (lastStr.endsWith(part)) {
      this.buffer[lastIdx] = lastStr.slice(0, -part.length);
      this.length -= part.length;
      return true;
    }

    return false;
  }

  /**
   * 去除开头空白字符
   * 
   * @returns 去除开头空白后的字符串
   */
  trimStart(): string {
    return this.toString().trimStart();
  }

  /**
   * 转换为字符串
   * 
   * 可选地对非首行的内容进行缩进处理
   * 
   * @param opts - 配置选项
   * @param opts.indent - 缩进级别（仅对非首行生效）
   * @returns 拼接后的字符串
   */
  toString(opts?: { indent?: number }) {
    const { indent = 0 } = opts || {};
    let out = this.buffer.join('');
    if (indent > 0) {
      out = out
        .split('\n')
        .map((line, idx) => {
          if (idx === 0 || line.length == 0) {
            return line;
          }
          if (line.trim() == '') {
            return '';
          }

          return ' '.repeat(indent * 4) + line;
        })
        .join('\n');
    }
    return out;
  }
}