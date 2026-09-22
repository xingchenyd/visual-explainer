# Visual Explainer

可验证的知识动画网站与 Codex Skill。仓库包含确定性矩阵乘法播放器、多算子模拟退火讲解视频，以及可独立安装的 Skill。

## 打开网站

在仓库根目录运行 `node scripts/serve.mjs . 4317`，访问 `http://127.0.0.1:4317/`。网站是静态文件，不需要 API 密钥。也可直接打开矩阵课程的 standalone.html 或视频课程的 exports/index.html。

## 安装 Skill

将仓库中的 `skills/visual-explainer` 整个目录复制到个人 Codex skills 目录（通常是 `~/.codex/skills/visual-explainer`），或解压 `dist/visual-explainer-skill.zip`。目录内包含 SKILL.md、操作文档、脚本和运行时快照。

示例请求：`$visual-explainer 讲懂为什么矩阵乘法不是对应元素相乘`；`$visual-explainer 用旅行商问题制作多算子模拟退火讲解视频`。

矩阵课程需要 Node.js 22+；视频重新渲染需要 Python/Pillow、FFmpeg，以及 Windows 中文字体与本地语音。已导出的视频可直接播放，无需渲染依赖。当前网站不包含在线 AI 生成后端。

## 矩阵乘法纵切片

新增独立视频课程：`lessons/multi-operator-annealing/exports/multi-operator-annealing.mp4`。以旅行商问题演示交换、插入、2-opt、概率接受和降温，含中文合成配音。它使用 `annealing-video-0.1` 配置与 Python/FFmpeg 渲染，不与下述矩阵 IR 混用。

已实现：69 秒矩阵乘法课程、版本化 IR、6 个语义动作、真实计算绑定、任意跳转、播放/暂停/倍速/语义单步、输入修改、对象点击、带定位的预置局部解释。

直接双击 `lessons/matrix-multiplication/preview/standalone.html` 即可离线使用。开发预览：

```sh
npm ci
npm test
npm run validate
npm run build
python scripts/verify-math.py lessons/matrix-multiplication
npm run dev
# 另一个终端；默认使用本机 Microsoft Edge
npm run qa
```

打开 http://127.0.0.1:4317/apps/player/ 。浏览器 QA 会保存 18 张桌面关键帧、手机截图与质量报告。报告中的人工视觉检查必须在实际查看截图后填写。

## 架构与确定性

- `packages/core/core.mjs`：验证、计算绑定、编译、冻结课程和 `stateAt(lesson,time)` 纯函数。没有累计 DOM 状态，没有求值表达式。
- `packages/schema/`：LessonIR 和 LessonSpec JSON Schema。Schema 负责结构，内核负责维度、引用、动作顺序及输出覆盖。
- `apps/player/`：SVG 渲染器与播放控件。时间来自 rAF，画面来自绝对时间；每个场景采用左闭右开区间，终点显示最后场景的完成状态。单步包括场景边界和部分和边界。
- `scripts/scaffold-browser.mjs`：矩阵课程编排，CLI 与页面共用。`scaffold.mjs` 只负责写包。
- `scripts/build.mjs`：输出模块化网页、计算明细和零外部依赖的单文件 HTML。
- `lessons/matrix-multiplication/`：Spec、IR、来源、计算明细、预览、QA 证据。

矩阵 ID 固定为 A/B/C，行列和颜色贯穿课程。结果格在 writeResult 的起始时间写入；求和在每个乘积时间段完成后推进。修改尺寸时重新编排课程，修改数值时重新计算全部绑定。支持 1–4 维实数小矩阵，绝对值 ≤999。

## 本轮范围与后续

依据最初请求，先完成播放器与单门纵切片，验收后制作 Skill。蓝图是设计参考，本文没有宣称完成全部 Phase 1/2：矩阵播放器只有 matrix 对象和 compare/focus/pairCells/accumulate/writeResult/morphEquation 六个动作，不是通用 12–18 原语引擎。后续按用户请求新增模拟退火专用视频流程。卷积、BFS、自由课程生成、AI 问答、自定义代码沙箱及公网后端均未实现。

本轮选择零运行依赖的 ES modules + SVG，便于离线交付与纯函数回放验证。React/TypeScript/Motion Canvas 是未来可选的表现层适配，而非当前依赖。数值经 Node 测试与独立 Python Decimal 校验。公式用 SVG 排版。

## Skill

安装的 `~/.codex/skills/visual-explainer` 含同一内核的可携带快照，矩阵入口为 `scripts/create-lesson.mjs`，模拟退火视频入口见 Skill 的 `references/annealing-video.md`。`scripts/sync-skill.mjs` 将维护中的源码同步到 Skill，并记录 SHA-256，避免两套逻辑分别演进。
