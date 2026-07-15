# Flash Words

Flash Words 是一个完全在浏览器本地运行的动态文字生成器。输入中文或英文，选择动态结构，即可导出循环 GIF 或 H.264 MP4。浏览器不上传文字、项目文件或生成内容。

## 功能

- 11 套 Kinetic Typography 模板，包含飞入、推进、闪烁、平铺、波浪、打字与快门等结构
- 中文、英文、数字、标点和 Emoji 分段
- 1:1 与 9:16 画布
- 4 至 12 秒时长、0.5× 至 2× 速度和可调动效强度
- 固定 seed 的可复现随机结果
- 模板、配色和排版锁定
- MP4 1080p/30fps，无法使用 H.264 时自动尝试 WebM
- GIF 720p/15fps，由 Web Worker 编码
- 项目 JSON 导入导出与浏览器本地保存
- 减少动态效果支持和键盘可操作界面

## 本地开发

要求 Node.js 24 或更高版本。

```bash
npm install
npx playwright install chromium webkit firefox
npm run dev
```

生产构建：

```bash
npm run build
npm run preview
```

## 验证

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

端到端测试会实际生成 GIF 和视频文件，并在 Chromium、WebKit 与 Firefox 中验证编辑器、导出、取消、本地项目往返、响应式布局和无障碍基线。

## 架构

- `src/engine`：项目模型、分词、确定性随机数和自动导演时间轴
- `src/renderer`：所有模板共用的 Canvas 逐帧渲染器
- `src/exporters`：Mediabunny 视频编码、GIF Worker、下载与能力检测
- `src/app`：编辑器界面、项目状态和实时预览
- `src/tests`：单元测试与 Playwright 浏览器测试

预览和导出都调用同一个 `renderFrame` 入口，因此相同项目和 seed 会得到相同画面。

## 浏览器支持

- Chrome、Edge：完整编辑和导出
- Safari：完整编辑和导出，已使用对应 WebKit 引擎验证
- Firefox：编辑与 GIF；视频格式由浏览器编码能力决定
- 手机浏览器：支持编辑和预览，高分辨率导出建议在桌面完成

## 隐私

Flash Words 没有后端、账号、Cookie 或行为追踪。项目默认写入当前浏览器的 `localStorage`。清除站点数据会移除本地项目，因此重要作品应下载项目 JSON。

## 字体与依赖

内置字体通过 Fontsource 分发：Noto Sans SC、Noto Serif SC 与 Archivo Black。字体遵循各自的 SIL Open Font License。视频由 Mediabunny 编码，GIF 由 gifenc 编码。
