---
name: md-to-html
description: >
  Convert Markdown to WeChat Official Account (公众号) compatible HTML with 16 preset
  visual styles including default, 金融时报, Claude, 纽约时报, Apple 极简, 晚点风格, etc.
  Use when the user wants to format Markdown for 公众号 publishing, convert md to
  WeChat-compatible HTML, or apply professional typography styles to articles.
  From the huasheng_editor project by alchaincyf.
---

# md-to-html — Markdown → 公众号 HTML

将 Markdown 转换为微信公众号兼容的 HTML，支持 16 种精美排版样式。

## 快速使用

```bash
# 从文件转换
node scripts/convert.js article.md -s wechat-ft -o output.html

# 从 stdin 转换
echo "# Hello" | node scripts/convert.js -s wechat-default

# 直接传内容
node scripts/convert.js --content "## Title\nContent..." -s wechat-apple

# 查看所有样式
node scripts/convert.js --list-styles
```

## 可用样式（16 种）

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

## 与 wechat-mp-publish 配合

生成公众号 HTML 后，可直接作为草稿内容发布：

```bash
# 1. Markdown → 公众号 HTML
node scripts/convert.js article.md -s wechat-ft -o /tmp/body.html
CONTENT=$(cat /tmp/body.html)

# 2. AI 生成配图
python3 wechat-mp-publish/scripts/gen_image.py full "标题+内容" -o /tmp/imgs

# 3. 上传图片
CONTENT_IMG=$(*** wechat-mp-publish/scripts/wechat_mp.py upload-img /tmp/imgs/article_img_1.png)
THUMB_ID=$(*** wechat-mp-publish/scripts/wechat_mp.py upload-thumb /tmp/imgs/cover_thumb.jpg)

# 4. 创建草稿（嵌入公众号 HTML）
*** wechat-mp-publish/scripts/wechat_mp.py add-draft "{
  \"articles\": [{
    \"title\": \"文章标题\",
    \"content\": $(python3 -c "import json; print(json.dumps(open('/tmp/body.html').read()))"),
    \"thumb_media_id\": \"$THUMB_ID\"
  }]
}"
```

## 技术细节

- 基于 `markdown-it` + `highlight.js`，与 huasheng_editor 同款渲染引擎
- 使用 `jsdom` 在 Node.js 中模拟浏览器 DOM 操作
- 所有 CSS 转为内联样式，兼容微信公众号编辑器
- 代码块带 macOS 风格窗口装饰
- 标题内行内元素自动继承标题颜色

## 注意事项

- 首次使用需 `cd` 到 skill 目录执行 `npm install`
- 依赖：`markdown-it`, `highlight.js`, `jsdom`
- 输出为纯 HTML 片段（`<div>` 包裹），不含 `<html>/<body>` 标签
