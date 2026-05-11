#!/usr/bin/env node
/**
 * md-to-html — Markdown → 公众号 HTML Converter
 *
 * Converts Markdown to WeChat Official Account compatible HTML with
 * inline styles from 19 preset themes.
 *
 * Usage:
 *   echo "# Hello" | node convert.js --style wechat-default
 *   node convert.js article.md --style financial-times -o output.html
 *   node convert.js --list-styles
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { JSDOM } from 'jsdom';
import markdownit from 'markdown-it';
import hljs from 'highlight.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Load styles from references/styles.js
// ---------------------------------------------------------------------------

function loadStyles() {
  const stylesPath = join(__dirname, '..', 'references', 'styles.js');
  const raw = readFileSync(stylesPath, 'utf-8');
  const startIdx = raw.indexOf('{');
  if (startIdx === -1) throw new Error('Cannot parse styles.js');
  const objSrc = raw.slice(startIdx);
  const fn = new Function(`return ${objSrc}`);
  return fn();
}

const STYLES = loadStyles();

// ---------------------------------------------------------------------------
// Convert hljs CSS classes to inline styles (WeChat strips class attributes)
// ---------------------------------------------------------------------------

const HLJS_INLINE_MAP = {
  'hljs-keyword':      'color: #c678dd; font-weight: 600;',
  'hljs-string':       'color: #98c379;',
  'hljs-number':       'color: #d19a66;',
  'hljs-comment':      'color: #5c6370; font-style: italic;',
  'hljs-title':        'color: #61afef;',
  'hljs-function':     'color: #61afef;',
  'hljs-built_in':     'color: #e5c07b;',
  'hljs-attr':         'color: #d19a66;',
  'hljs-params':       'color: #abb2bf;',
  'hljs-literal':      'color: #56b6c2;',
  'hljs-type':         'color: #e5c07b;',
  'hljs-meta':         'color: #61afef;',
  'hljs-variable':     'color: #e06c75;',
  'hljs-operator':     'color: #56b6c2;',
  'hljs-punctuation':  'color: #abb2bf;',
  'hljs-property':     'color: #e06c75;',
  'hljs-selector':     'color: #e06c75;',
  'hljs-symbol':       'color: #56b6c2;',
  'hljs-regexp':       'color: #56b6c2;',
  'hljs-class':        'color: #e5c07b;',
  'hljs-decorator':    'color: #61afef;',
  'hljs-name':         'color: #e06c75;',
  'hljs-section':      'color: #e06c75; font-weight: 600;',
  'hljs-addition':     'color: #98c379;',
  'hljs-deletion':     'color: #e06c75;',
  'hljs-attribute':    'color: #d19a66;',
  'hljs-doctag':       'color: #c678dd;',
  'hljs-formula':      'color: #56b6c2;',
  'hljs-link':         'color: #61afef; text-decoration: underline;',
  'hljs-quote':        'color: #98c379; font-style: italic;',
  'hljs-template-tag': 'color: #c678dd;',
  'hljs-template-variable': 'color: #e06c75;',
  'hljs-selector-tag': 'color: #e06c75;',
  'hljs-selector-id':  'color: #e06c75; font-weight: 600;',
  'hljs-selector-class': 'color: #d19a66;',
  'hljs-selector-attr': 'color: #61afef;',
  'hljs-selector-pseudo': 'color: #56b6c2;',
  'hljs-code':         'color: #abb2bf;',
  'hljs-emphasis':     'font-style: italic;',
  'hljs-strong':       'font-weight: 600;',
};

function convertHljsToInline(html) {
  return html.replace(/<span class="(hljs-[^"]+)">/g, (match, className) => {
    const classes = className.split(/\s+/);
    const styles = [];
    for (const cls of classes) {
      if (HLJS_INLINE_MAP[cls]) {
        styles.push(HLJS_INLINE_MAP[cls]);
      }
    }
    if (styles.length > 0) {
      return `<span style="${styles.join(' ')}">`;
    }
    return '<span>';
  });
}

// ---------------------------------------------------------------------------
// Markdown parser setup (WeChat-safe code blocks)
// ---------------------------------------------------------------------------

function createMarkdownParser() {
  const md = markdownit({
    html: true,
    linkify: true,
    typographer: false,
    highlight: function (str, lang) {
      let codeContent = '';
      if (lang && hljs.getLanguage(lang)) {
        try {
          codeContent = hljs.highlight(str, { language: lang }).value;
        } catch (__) {
          codeContent = md.utils.escapeHtml(str);
        }
      } else {
        codeContent = md.utils.escapeHtml(str);
      }

      // Convert hljs class spans to inline styles for WeChat compatibility
      codeContent = convertHljsToInline(codeContent);

      // WeChat-safe flat structure: no nested divs, no class attributes
      return (
        `<pre style="margin: 20px 0; padding: 16px; background: #282c34; border-radius: 6px; overflow-x: auto; font-size: 14px; line-height: 1.6; border-left: 3px solid #61afef;">` +
        `<code style="color: #abb2bf; font-family: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace; font-size: 14px; line-height: 1.6; white-space: pre; background: transparent;">${codeContent}</code>` +
        `</pre>`
      );
    },
  });
  return md;
}

// ---------------------------------------------------------------------------
// Preprocess Markdown (match huasheng_editor logic)
// ---------------------------------------------------------------------------

function preprocessMarkdown(content) {
  content = content.replace(/^[ ]{0,3}(\*[ ]*\*[ ]*\*[\* ]*)[ \t]*$/gm, '***');
  content = content.replace(/^[ ]{0,3}(-[ ]*-[ ]*-[- ]*)[ \t]*$/gm, '---');
  content = content.replace(/^[ ]{0,3}(_[ ]*_[ ]*_[_ ]*)[ \t]*$/gm, '___');
  content = content.replace(/\*\*\s+\*\*/g, ' ');
  content = content.replace(/\*{4,}/g, '');
  content = content.replace(/\*\*([）」』》〉】〕〗］｝"'。，、；：？！])/g, '**\u200B$1');
  content = content.replace(/([（「『《〈【〔〖［｛"'])\*\*/g, '$1\u200B**');
  content = content.replace(/__\s+__/g, ' ');
  content = content.replace(/_{4,}/g, '');
  content = content.replace(/^(\s*(?:\d+\.|-|\*)\s+[^:\n]+)\n\s*:\s*(.+?)$/gm, '$1: $2');
  content = content.replace(/^(\s*(?:\d+\.|-|\*)\s+.+?:)\s*\n\s+(.+?)$/gm, '$1 $2');
  content = content.replace(/^(\s*(?:\d+\.|-|\*)\s+[^:\n]+)\n:\s*(.+?)$/gm, '$1: $2');
  content = content.replace(/^(\s*(?:\d+\.|-|\*)\s+.+?)\n\n\s+(.+?)$/gm, '$1 $2');
  return content;
}

// ---------------------------------------------------------------------------
// Apply inline styles (match huasheng_editor applyInlineStyles logic)
// ---------------------------------------------------------------------------

function applyInlineStyles(html, styleKey) {
  const style = STYLES[styleKey].styles;
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const headingInlineOverrides = {
    strong: 'font-weight: 700; color: inherit !important; background-color: transparent !important;',
    em: 'font-style: italic; color: inherit !important; background-color: transparent !important;',
    a: 'color: inherit !important; text-decoration: none !important; border-bottom: 1px solid currentColor !important; background-color: transparent !important;',
    code: 'color: inherit !important; background-color: transparent !important; border: none !important; padding: 0 !important;',
    span: 'color: inherit !important; background-color: transparent !important;',
    b: 'font-weight: 700; color: inherit !important; background-color: transparent !important;',
    i: 'font-style: italic; color: inherit !important; background-color: transparent !important;',
    del: 'color: inherit !important; background-color: transparent !important;',
    mark: 'color: inherit !important; background-color: transparent !important;',
    s: 'color: inherit !important; background-color: transparent !important;',
    u: 'color: inherit !important; text-decoration: underline !important; background-color: transparent !important;',
    ins: 'color: inherit !important; text-decoration: underline !important; background-color: transparent !important;',
    kbd: 'color: inherit !important; background-color: transparent !important; border: none !important; padding: 0 !important;',
    sub: 'color: inherit !important; background-color: transparent !important;',
    sup: 'color: inherit !important; background-color: transparent !important;',
  };
  const headingInlineSelectorList = Object.keys(headingInlineOverrides).join(', ');

  Object.keys(style).forEach((selector) => {
    if (selector === 'pre' || selector === 'code' || selector === 'pre code') return;
    const elements = doc.querySelectorAll(selector);
    elements.forEach((el) => {
      const currentStyle = el.getAttribute('style') || '';
      el.setAttribute('style', currentStyle + '; ' + style[selector]);
    });
  });

  // Heading inline element overrides
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach((heading) => {
    const inlineNodes = heading.querySelectorAll(headingInlineSelectorList);
    inlineNodes.forEach((node) => {
      const tag = node.tagName.toLowerCase();
      let override = headingInlineOverrides[tag];
      if (!override) return;

      const currentStyle = node.getAttribute('style') || '';
      const sanitized = currentStyle
        .replace(/color:\s*[^;]+;?/gi, '')
        .replace(/background(?:-color)?:\s*[^;]+;?/gi, '')
        .replace(/border(?:-bottom)?:\s*[^;]+;?/gi, '')
        .replace(/text-decoration:\s*[^;]+;?/gi, '')
        .replace(/box-shadow:\s*[^;]+;?/gi, '')
        .replace(/padding:\s*[^;]+;?/gi, '')
        .replace(/;\s*;/g, ';')
        .trim();
      node.setAttribute('style', sanitized + '; ' + override);
    });
  });

  // Wrap in container
  const container = doc.createElement('div');
  container.setAttribute('style', style.container);
  container.innerHTML = doc.body.innerHTML;
  return container.outerHTML;
}

// ---------------------------------------------------------------------------
// Main conversion
// ---------------------------------------------------------------------------

function convert(markdown, styleKey) {
  const md = createMarkdownParser();
  const processed = preprocessMarkdown(markdown);
  const rawHtml = md.render(processed);
  const styledHtml = applyInlineStyles(rawHtml, styleKey);
  return styledHtml;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function listStyles() {
  console.log('Available styles:\n');
  for (const [key, val] of Object.entries(STYLES)) {
    const rec = val.recommended ? ' ✨' : '';
    console.log(`  ${key.padEnd(24)} ${val.name}${rec}`);
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    style: 'wechat-default',
    input: null,
    output: null,
    listStyles: false,
    help: false,
    content: null,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--style':
      case '-s':
        opts.style = args[++i];
        break;
      case '--output':
      case '-o':
        opts.output = args[++i];
        break;
      case '--list-styles':
      case '-l':
        opts.listStyles = true;
        break;
      case '--content':
      case '-c':
        opts.content = args[++i];
        break;
      case '--help':
      case '-h':
        opts.help = true;
        break;
      default:
        if (!opts.input && !args[i].startsWith('-')) {
          opts.input = args[i];
        }
    }
  }
  return opts;
}

function showHelp() {
  console.log(`
md-to-html — Markdown → 公众号 HTML Converter

Usage:
  node convert.js [file.md] [options]
  echo "# Title" | node convert.js [options]
  node convert.js --content "## Hello" -s wechat-default

Options:
  -s, --style <key>    Style theme (default: wechat-default)
  -o, --output <file>  Output file (default: stdout)
  -c, --content <md>   Inline Markdown string
  -l, --list-styles     List all available styles
  -h, --help            Show this help
`);
}

async function main() {
  const opts = parseArgs();

  if (opts.help) {
    showHelp();
    process.exit(0);
  }

  if (opts.listStyles) {
    listStyles();
    process.exit(0);
  }

  if (!STYLES[opts.style]) {
    console.error(`Unknown style: "${opts.style}"`);
    console.error('Use --list-styles to see available styles.');
    process.exit(1);
  }

  let markdown = '';
  if (opts.content) {
    markdown = opts.content;
  } else if (opts.input) {
    markdown = readFileSync(opts.input, 'utf-8');
  } else {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    markdown = Buffer.concat(chunks).toString('utf-8');
  }

  if (!markdown.trim()) {
    console.error('No Markdown content provided.');
    process.exit(1);
  }

  const html = convert(markdown, opts.style);

  if (opts.output) {
    writeFileSync(opts.output, html, 'utf-8');
    console.error(`✅ Saved to ${opts.output} (${html.length} bytes)`);
  } else {
    console.log(html);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
