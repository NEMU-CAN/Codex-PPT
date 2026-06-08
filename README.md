# Codex PPT 自动化

这个项目可以把一个简单的 JSON 简报文件转换成可编辑的 `.pptx`，底层使用的是当前环境已经内置的 Codex `Presentations` 运行时。

## 你能得到什么

- 真正可编辑的 PowerPoint 文件，不是把 HTML 改后缀伪装成 `.pptx`
- 一套很轻量的 brief 输入格式，方便让 Codex 直接帮你改内容
- 一个可在 VSCode 任务或终端里直接运行的 Node 构建脚本
- 生成后的 PNG 预览图，方便快速检查版式

## 目录结构

- `briefs/brief.template.json`：简报模板
- `briefs/hello-world.json`：示例输入
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

当前支持的页面类型有：

- `cover`：封面页
- `bullets`：要点列表页
- `metrics`：指标卡片页
- `closing`：结尾页

你可以直接让 Codex 帮你改 `briefs/*.json`。推荐工作流如下：

1. 先用自然语言描述你想做的 PPT
2. 让 Codex 帮你更新 `briefs/` 目录下的某个 JSON 文件
3. 在 VSCode 里运行 `Codex PPT: Build from brief`
4. 用 PowerPoint 打开生成的 `.pptx` 做最后微调

## 说明

- 构建脚本会自动查找当前环境里已安装的 Codex `Presentations` 技能
- 这套脚手架不依赖额外的 Python 环境，也不依赖 Office 自动化
- 如果后面你想支持更复杂的布局，我们可以继续扩展 brief 结构和渲染逻辑，而不用推翻整套流程
