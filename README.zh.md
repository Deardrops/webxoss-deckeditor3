# WEBXOSS 卡组编辑器 3

基于 TypeScript 和 Pixi.js 构建的 [WIXOSS](https://zh.wikipedia.org/wiki/Wixoss) 集换式卡牌游戏现代卡组构筑工具。这是 WEBXOSS 卡组编辑器的第三代重写版本，具备 GPU 加速渲染、响应式布局、多语言卡牌搜索和简洁的事件驱动架构。

[English Documentation](./README.md)

---

## 功能特性

- **GPU 加速界面** — 使用 Pixi.js v8 渲染，卡牌列表流畅无卡顿
- **响应式布局** — 桌面端三栏、平板双栏、移动端标签页切换
- **高级卡牌搜索** — 支持按颜色、卡牌类型、稀有度及多语言文本（日/英/中/韩/俄/意/西）自由搜索
- **卡组合法性验证** — 检查主卡组（40张）、露格卡组（最多10张）、重复限制（同名最多4张）及真由之间的限制规则
- **导入 / 导出** — 以 `.webxoss` JSON 文件或分享代码形式保存和读取卡组
- **本地存储** — 卡组自动保存在浏览器的 localStorage 中
- **卡牌详情面板** — 展示卡牌图片、数值、费用、等级、力量和效果文本

## 技术栈

| 层 | 技术 |
|---|---|
| 语言 | TypeScript 5.7（严格模式） |
| 渲染 | Pixi.js 8 + @pixi/ui |
| 构建工具 | Vite 6 |
| 运行时目标 | ES2020，现代浏览器 |

## 项目结构

```
src/
├── main.ts                 # 入口 — 加载外部脚本，初始化 Pixi 应用
├── data/
│   ├── types.ts            # 核心接口：CardInfo、Deck、CardType
│   ├── CardDatabase.ts     # 全局卡牌数据库封装
│   ├── DeckManager.ts      # 卡组增删改查、合法性验证、localStorage 持久化
│   └── Searcher.ts         # 基于规则的多语言卡牌搜索引擎
└── ui/
    ├── App.ts              # 根组件，布局管理，导入/导出弹窗
    ├── DeckEditorState.ts  # 集中式状态管理 + 事件发布
    ├── EventBus.ts         # 轻量级发布/订阅事件系统
    ├── components/
    │   ├── Button.ts
    │   ├── FilterChip.ts
    │   ├── ScrollContainer.ts
    │   └── CardThumbnail.ts
    └── panels/
        ├── SearchPanel.ts
        ├── DeckPanel.ts
        └── DetailPanel.ts
```

## 环境要求

- Node.js 18+
- npm 9+
- 运行中的 WEBXOSS 服务端（或本地卡牌数据库脚本）以提供卡牌数据

## 快速开始

```bash
# 克隆仓库
git clone git@github.com:Deardrops/webxoss-deckeditor3.git
cd webxoss-deckeditor3

# 安装依赖
npm install

# 启动开发服务器（http://localhost:3000）
npm run dev
```

## 构建

```bash
npm run build
```

输出写入 `dist/` 目录。构建产物使用相对路径（`base: './'`），可部署到任意子目录下。

## 与 WEBXOSS 的集成

DeckEditor3 设计为嵌入在 WEBXOSS 客户端页面中运行，在启动时从父目录动态加载以下脚本：

| 脚本 | 用途 |
|---|---|
| `../lib/util.js` | 通用工具函数（`toArr` 等） |
| `../CardInfo.js` | 卡牌数据库 — 挂载到 `window.CardInfo`（约 3.8 MB） |
| `../Localize.min.js` | 多语言本地化（日/英/中/韩/俄/意/西） |
| `../ImageFileCache.js` | 可选的图片缓存层（存在时自动加载） |

在独立开发时，可选择：
- 通过 Vite 开发服务器从父目录提供上述文件，或
- 提供本地 mock 实现用于测试。

卡牌图片从 WEBXOSS 媒体服务器按以下 URL 模式加载：
```
http://<服务器地址>/images/<deckid>/<wxid>.jpg
```

## 卡组格式

卡组以 JSON 格式存储，结构如下：

```json
{
  "format": "WEBXOSS Deck",
  "version": "1",
  "content": {
    "mainDeck": ["WX01-001", "..."],
    "lrigDeck": ["WX01-T01", "..."]
  }
}
```

导出的 `.webxoss` 文件与此格式相同。

## 卡组规则

| 规则 | 限制条件 |
|---|---|
| 主卡组 | 恰好 40 张 |
| LRIG 卡组 | 必须包含1级露格；最多 10 张 |
| 重复限制 | 同名卡最多 4 张 |
| 茧的房间 | 禁止特定卡牌组合 |

## 开源许可

[MIT](./LICENSE)
