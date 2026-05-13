import { JSDOM } from 'jsdom';

/**
 * 创建 HTML 元素
 * 
 * 使用 JSDOM 创建 DOM 元素，配置为 XHTML 格式以获得更好的兼容性。
 * 这对于生成符合标准的 HTML/XHTML 输出非常重要，特别是在处理自闭合标签时。
 * 
 * @param type - 要创建的元素类型（如 'div', 'img', 'br' 等）
 * @returns 创建的 DOM 元素对象
 */
export const createElement = (type: string) => {
  // 配置 JSDOM 输出 XHTML 格式以提高兼容性
  // 使用 XML 内容类型确保标签正确闭合（如 <br /> 而非 <br>）
  const dom = new JSDOM(
    "<?xml version='1.0' encoding='utf-8'?><html xmlns='http://www.w3.org/1999/xhtml'> <head><title>T</title></head><body> <br /><img src='test.png' /> </body></html>",
    { contentType: 'text/xml' }
  );
  return dom.window.document.createElement(type);
};