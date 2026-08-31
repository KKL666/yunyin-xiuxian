# 云隐修仙录

水墨国风、竖版文字风格的放置修仙游戏。

## 运行

需要 Node 20.19+ 或 22.12+。

```
npm install
npm run dev      # 开发运行
npm run build    # 类型检查 + 生产构建
npm run preview  # 预览构建产物
npm test         # 全量测试（数值/战斗/流派/曲线/经济/终局）
npm run test:report  # 按系统分类的测试摘要
npm run lint     # ESLint
```

## 技术栈

Vite 6 · Vue 3.5（script setup + TS）· TypeScript strict · Tailwind CSS 4 · Pinia 3 · Vue Router（hash）· lucide-vue-next · Vitest。

## 架构

```
src/
  types/        领域模型
  utils/        GameNumber 大数（m×10^e）/ 格式化 / 随机 / 存档底层
  data/         全部内容数据
  core/         纯逻辑（公式 / 战斗 / 装备 / 灵根）+ 服务编排（离线 / 探索 / 突破等）
  stores/       Pinia 状态，自动持久化
  views/        页面
  components/   组件
  composables/  useNow 等
```

## 许可证

本项目采用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hans) 许可协议。

允许自由共享和演绎，但 **未经作者书面授权，禁止用于任何商业目的**。详见 [LICENSE](LICENSE) 文件。
