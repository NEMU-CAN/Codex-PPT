# Codex PPT 自动化

这个项目可以把一个简单的 JSON 简报文件转换成可编辑的 `.pptx`，底层使用的是当前环境内置的 Codex `Presentations` 运行时。

## 你能得到什么

- 真正可编辑的 PowerPoint 文件，不是把 HTML 改后缀伪装成 `.pptx`
- 一套很轻量的 brief 输入格式，方便让 Codex 直接帮你改内容
- 一个可在 VSCode 任务或终端里直接运行的 Node 构建脚本
- 生成后的 PNG 预览图，方便快速检查版式
- **文本自动防溢出**：长文本会自动缩小字号以适配文本框，不会撑破版面
- **主题可配置**：内置 10 套主题，也可以在 brief 里直接自定义颜色和字体

## 目录结构

- `briefs/brief.template.json`：简报模板
- `briefs/showcase.json`：展示全部版式类型的示例（含自定义主题）
- `briefs/hello-world.json`：最小示例输入
- `scripts/build-deck.mjs`：PPTX 生成脚本
- `dist/`：生成出的 `.pptx` 和预览 PNG

## 构建示例 PPT

在工作区根目录执行：

```powershell
node codex-ppt-automation/scripts/build-deck.mjs
```

执行后会生成：

- `codex-ppt-automation/dist/hello-world-codex.pptx`
- `codex-ppt-automation/dist/previews/slide-01.png` 以及后续页面预览

构建全部版式示例：

```powershell
node codex-ppt-automation/scripts/build-deck.mjs `
  --brief codex-ppt-automation/briefs/showcase.json `
  --out codex-ppt-automation/dist/showcase.pptx
```

## 构建你自己的 PPT

1. 复制一份 `briefs/brief.template.json`
2. 把标题、摘要和每页内容改成你自己的
3. 执行：

```powershell
node codex-ppt-automation/scripts/build-deck.mjs `
  --brief codex-ppt-automation/briefs/your-deck.json `
  --out codex-ppt-automation/dist/your-deck.pptx
```

## Brief 格式说明

### 支持的页面类型

| 类型 | 说明 | 关键字段 |
|---|---|---|
| `cover` | 封面页 | `tag`、`title`、`subtitle`、`note`、`imagePath`、`brandTitle`、`brandSubtitle` |
| `bullets` | 要点列表页 | `kicker`、`title`、`bullets[]`、`asideTitle`、`asideText`、`imagePath` |
| `metrics` | 指标卡片页 | `kicker`、`title`、`metrics[]`、`takeaway` |
| `closing` | 结尾页 | `kicker`、`title`、`message`、`cta` |
| `agenda` | 目录页（两栏编号列表） | `items[]`：`{ title, detail? }` 或字符串 |
| `section` | 分节页 | `number`、`title`、`subtitle` |
| `twoColumn` | 双栏文本页 | `leftHeading`、`leftBullets[]`、`rightHeading`、`rightBullets[]` |
| `comparison` | 左右对比页 | `leftHeading`、`leftPoints[]`、`rightHeading`、`rightPoints[]` |
| `quote` | 引言页 | `quote`、`attribution`、可选 `title`/`kicker` |
| `table` | 数据表格页 | `headers[]`、`rows[][]` |
| `timeline` | 横向时间线页 | `items[]`：`{ title, detail? }` 或字符串 |

> 封面页右下角的品牌文字（`brandTitle` / `brandSubtitle`）从 brief 读取，不再写死。不填则默认使用 `deck.title` / `deck.subtitle`。

### 主题

`deck.theme` 可以是：

- **预设主题名**：`corporate`（默认，深藏青+青+橙商务配色）、`ocean`、`forest`、`cathedral`、`slate`、`sunset`、`midnight`（深色）、`paper`、`spring`、`royal`
- **中文字体**：默认使用微软雅黑（Microsoft YaHei），中文显示清晰
- **自定义主题对象**（可选 `base` 指定从某预设继承，其余字段覆盖）：

```json
{
  "deck": {
    "theme": {
      "base": "ocean",
      "accent": "#0E7C86",
      "accentSoft": "#7FC8D1",
      "deep": "#0B3B42"
    }
  }
}
```

可覆盖的字段：`bg`（背景）、`panel`（卡片底色）、`ink`（正文色）、`muted`（次要文字）、`accent`（强调色）、`accentSoft`（浅强调色）、`border`（边框）、`inverse`（深底上的浅色文字）、`deep`（深色面板）、`deepSoft`、`highlight`（辅助强调色）、`titleFont`、`bodyFont`、`monoFont`。

### 文本防溢出

所有文本块默认自动适配：脚本会估算文本在给定宽度下的换行行数，若超出文本框高度则逐步缩小字号（最小 10pt），保证内容不溢出。短标签（如页脚、编号）可通过 `fit: false` 保持固定字号（脚本内部使用，brief 无需关心）。

## 推荐工作流

1. 先用自然语言描述你想做的 PPT
2. 让 Codex 帮你更新 `briefs/` 目录下的某个 JSON 文件
3. 在 VSCode 里运行 `Codex PPT: Build from brief`
4. 用 PowerPoint 打开生成的 `.pptx` 做最后微调

## 说明

- 构建脚本会自动查找当前环境里已安装的 Codex `Presentations` 技能，并兼容 `scripts/` 与 `container_tools/` 两种运行时布局
- 这套脚手架不依赖额外的 Python 环境，也不依赖 Office 自动化
- 如果后面你想支持更复杂的布局，我们可以继续扩展 brief 结构和渲染逻辑，而不用推翻整套流程
