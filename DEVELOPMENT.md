# Development

## 环境与准备
- 使用当前 LTS 版本的 `Node.js` 与 `npm`
- 全局不需要安装 `lerna`，本仓库已作为 devDependency 提供
- NPM 仓库发布目标见 `.npmrc`（`registry` 指向 `https://registry.npmjs.org`）

## 获取代码
- 克隆仓库：`git clone <repo-url>`，进入根目录：`cd anys`
- 安装工作区依赖并链接包：`npm run install`

## 项目初始化与常用脚本
- `npm run install`：清理并重新引导 Lerna 工作区，完成依赖安装与包间软链接
- `npm run build`：为所有子包执行构建（调用各包的 `build` 脚本）
- `npm run dist`：顺序执行 `build` → `license` → `version` → `prepublishOnly`
  - `license`：将根目录 `LICENSE` 同步到各包（见 `scripts/copy-license.js`）
  - `version`：按 Conventional Commits 规则进行版本号管理（`lerna version`）
  - `prepublishOnly`：发布已打包的包（`lerna publish from-package`）

## 代码结构
- 根目录
  - `packages/*`：所有工作区包
  - `webpack.config.js`：统一打包配置，供各包调用
  - `babel.config.js`：统一 Babel 配置（ES5 目标、`@babel/preset-env`）
  - `lerna.json`：工作区定义，`packages/*`（`lerna.json:2-5`）
  - `package.json`：根级脚本与开发依赖
  - `assets/`：架构与时序示意图等资源
  - `README.md`、`DEVELOPMENT.md`：项目说明与开发者指南
- 主要包（示例）
  - 核心：`packages/anys`
  - 工具：`packages/anys-utils`
  - Web 封装：`packages/anys-web`
  - 存储/发送/监控插件：`packages/anys-web-plugin-*`、`packages/anys-plugin-store-memory`

## 构建体系
- 各包的 `build` 统一使用：`rimraf dist && webpack --config ../../webpack.config.js`
- 统一 Webpack 配置关键点：
  - 产物目标：`target: ['web', 'es5']`
  - 入口：当前包 `src/index.js`
  - 输出：`dist/index.js` 且以 `assign-properties` 方式挂载到 `window.anys`（`webpack.config.js:19-23`）
  - Babel：`babel-loader` + `@babel/preset-env`（`webpack.config.js:51-56`，`babel.config.js:10-18`）

## 核心模块
- `Anys`（核心 SDK）
  - 位置：`packages/anys/src/index.js:9`
  - 职责：插件生命周期调度、日志管线（`write`/`report`/`send`）、事件总线（`on`/`emit`）
  - 关键方法参考：
    - `start()`（`packages/anys/src/index.js:233-236`）
    - `write(log)`（`packages/anys/src/index.js:238-266`）
    - `report(message)`（`packages/anys/src/index.js:268-491`）
    - `send(logs)`（`packages/anys/src/index.js:493-498`）
    - `stop()`（`packages/anys/src/index.js:500-503`）
  - 默认选项：`autoStart: true`（`packages/anys/src/index.js:505-510`）
- `AnysPlugin`（插件基类）
  - 位置：`packages/anys-utils/src/plugin.js:1`
  - 约定：
    - 插件可声明 `options()` 返回特性开关，如 `{ ajax: true }`
    - 基类会在 `start()` 时按 `options()` 中的键调用 `register{Key}`，并缓存其撤销函数（`packages/anys-utils/src/plugin.js:11-23`）
    - `stop()` 会撤销对应 effect（`packages/anys-utils/src/plugin.js:31-50`）

## Web 端封装
- `anys-web`（简化创建 Tracer）
- `anys-web-async-plugin` 异步加载插件，减小打包体积

## 插件一览（选摘）
- 存储与发送
  - `anys-web-plugin-store-offline`：离线存储
  - `anys-web-plugin-send-by-[ajax|beacon|img]`：不同发送策略（依赖 `anys-utils` 的工具方法）
- 固定身份识别
  - `anys-web-plugin-identify`: 通过localStorage、sessionStorage给当前页面固定身份
- 行为与环境监控
  - `anys-web-plugin-monitor-url`：路由变化
  - `anys-web-plugin-monitor-window-size`：窗口尺寸
  - `anys-web-plugin-monitor-dom-mutation`：DOM 变更
  - `anys-web-plugin-monitor-input-event`：输入事件
  - `anys-web-plugin-monitor-[mouse|touch]-event`：鼠标与触控事件
  - `anys-web-plugin-monitor-performance`：性能指标与首帧组件
  - 其他：滚动、窗口活动、错误监控等

## 工具库
- `anys-utils`

## 代码规范
- ESLint：Airbnb Base 规则，缩进 4、必须分号等（`/.eslintrc.js:13-22`）
- VS Code 建议：保存时自动修复（`/.vscode/settings.json:3-5`）
- JS 配置：`jsconfig.json` 开启 `checkJs`，排除打包目录（`/jsconfig.json:2-14`）

## 提交规范（Conventional Commits）
- 本仓库使用 `@commitlint/config-conventional`（`/commitlint.config.js:2`）
- 格式：`<type>(<scope>): <subject>`，如 `feat(web): add tracer`
- 常用类型：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`、`revert`
- 版本管理：`npm run version` 依据提交类型计算版本（配合 Lerna）

## 开发流程建议
- 拉取与初始化：`git pull` → `npm run install`
- 本地开发：在目标包内修改 `src/*`，执行根级 `npm run build` 
- 调试：构建后从 `dist/index.js` 引入，或使用包的 UMD 形式（见各包 README）
- 集成：在 Web 项目中使用 `anys` + 各监控插件或 `anys-web/createTracer`
- 发布：确保构建通过后执行 `npm run dist`
