# md-to-html 🎨

> Markdown → 微信公众号 HTML 一键转换，19 种精美排版样式

一键将 Markdown 转换为微信公众号兼容的 HTML，内置 19 种专业排版样式。

## ✨ 特性

- 🎨 **19 种预设样式**：默认公众号、金融时报、Claude、纽约时报、Apple 极简、晚点风格等
- 📝 **精准渲染**：基于 `markdown-it` + `highlight.js` 渲染引擎
- 🖥️ **代码高亮**：自动语法高亮，支持 macOS 风格窗口装饰
- 📱 **公号兼容**：所有 CSS 转为内联样式，兼容微信公众号编辑器
- 🎯 **无需部署**：单个 Node.js 脚本，即装即用

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 转换 Markdown 文件
node scripts/convert.js article.md -s wechat-ft -o output.html

# 从 stdin 转换
echo "# Hello" | node scripts/convert.js -s wechat-default

# 直接传内容
node scripts/convert.js --content "## Title\nContent..." -s wechat-apple

# 查看所有样式
node scripts/convert.js --list-styles
```

## 🎭 所有样式

| Key | 名称 | 说明 |
|-----|------|------|
| `wechat-default` | 默认公众号 | 蓝色主题，通用清新 |
| `latepost-depth` | 晚点风格 | 红色主题，深度报道 |
| `wechat-ft` | 金融时报 | FT 粉色系，专业财经 |
| `wechat-anthropic` | Claude | 极简科技文档 |
| `wechat-tech` | 技术风格 | 暗色代码风格 |
| `wechat-elegant` | 优雅简约 | 浅灰极简 |
| `wechat-deepread` | 深度阅读 | 舒适阅读体验 |
| `wechat-nyt` | 纽约时报 | 经典新闻排版 |
| `wechat-jonyive` | Jony Ive | Apple 设计感 |
| `wechat-medium` | Medium | 长文阅读风格 |
| `wechat-apple` | Apple 极简 | 苹果官网风格 |
| `kenya-emptiness` | 原研哉·空 | 日式留白美学 |
| `hische-editorial` | Hische·编辑部 | 杂志编辑风格 |
| `ando-concrete` | 安藤·清水 | 建筑质感 |
| `gaudi-organic` | 高迪·有机 | 自然曲线 |
| `guardian` | Guardian | 卫报风格 |
| `nikkei` | Nikkei | 日経风格 |
| `warm-docs` | 焦橙文档 | 温暖技术文档 |
| `lemonde` | Le Monde | 世界报风格 |

## 🛠️ 技术栈

- **markdown-it** — Markdown 解析引擎
- **highlight.js** — 代码语法高亮
- **jsdom** — Node.js 中模拟浏览器 DOM
- 所有 CSS 转为内联样式，兼容微信编辑器

## 📦 配合发布流程

```bash
# 1. Markdown → 公众号 HTML
node scripts/convert.js article.md -s wechat-ft -o /tmp/body.html

# 2. 复制到公众号编辑器或通过 API 创建草稿
```

## 📄 License

MIT
