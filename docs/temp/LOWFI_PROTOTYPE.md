# 低保真原型说明 — AI小说转剧本工具

> 基于 DesignGenerator + AsciiLayoutGenerator 输出自动生成
> 目标工具：Figma / Excalidraw / Whimsical
> 技术栈：Vue 3 + Element Plus + TypeScript

---

# 原型: P0 登录注册页

## 页面目标

提供统一的用户认证入口，支持登录、注册、密码重置三种模式的无刷新切换。

## 页面结构（从上到下）

1. 品牌区 — Logo + 产品名
2. Tab 切换 — 登录 | 注册 | 重置密码
3. 表单卡片 — 居中白色卡片，根据 Tab 切换内容
4. 底部链接 — 辅助跳转文案

---

## 组件清单

### 品牌区

| 组件   | 类型       | 属性                |
| ------ | ---------- | ------------------- |
| Logo   | Icon/Image | 待设计              |
| 产品名 | Text       | "NovelToScript"     |
| 副标题 | Text       | "AI 小说转剧本工具" |

### 登录表单

| 组件         | 类型   | 属性                                    |
| ------------ | ------ | --------------------------------------- |
| 账号输入框   | Input  | placeholder="请输入账号"                |
| 密码输入框   | Input  | type=password, placeholder="请输入密码" |
| 登录按钮     | Button | type=primary, block, :disabled=!valid   |
| 忘记密码链接 | Link   | 切换到重置密码 Tab                      |

### 注册表单

| 组件         | 类型   | 属性                                 |
| ------------ | ------ | ------------------------------------ |
| 用户名输入框 | Input  | placeholder="请输入用户名(2-20字)"   |
| 账号输入框   | Input  | placeholder="字母数字下划线"         |
| 密码输入框   | Input  | type=password, placeholder="至少6位" |
| 注册按钮     | Button | type=primary, block                  |
| 返回登录链接 | Link   | 切换到登录 Tab                       |

### 重置密码表单

| 组件         | 类型   | 属性                                       |
| ------------ | ------ | ------------------------------------------ |
| 用户名输入框 | Input  | placeholder="请输入用户名"                 |
| 新密码输入框 | Input  | type=password, placeholder="新密码至少6位" |
| 提交按钮     | Button | type=primary, block                        |
| 返回登录链接 | Link   | 切换到登录 Tab                             |

---

## 交互流程

### 登录

```
用户输入账号 + 密码
        ↓
点击 [登录] 或按 Enter
        ↓
POST /api/auth/login {account, password}
        ↓
   ┌─ 200 → 存储 JWT → 跳转首页 /
   ├─ 401 → 表单顶部红色提示 "账号或密码错误"
   └─ 网络异常 → Toast "请检查网络连接"
```

### 注册

```
Tab 切换到注册
        ↓
用户依次输入用户名(失焦校验)、账号(失焦校验唯一性)、密码
        ↓
账号失焦 → POST /api/auth/register?check=account
        ↓
   ┌─ 409 → 账号输入框下方红色 "账号已存在"
   └─ 200 → 绿色 ✓ 可用
        ↓
点击 [注册] → POST /api/auth/register
        ↓
   ┌─ 201 → Toast "注册成功" → 切换到登录 Tab
   └─ 400 → 各字段标红提示
```

### 密码重置

```
点击 "忘记密码" 或 Tab 切换到重置密码
        ↓
输入用户名 → 点击 [验证]
        ↓
POST /api/auth/reset-password?check=username
        ↓
   ┌─ 200 → 解锁新密码输入框
   │         输入新密码 → 点击 [提交]
   │         POST /api/auth/reset-password {username, newPassword}
   │               ├─ 200 → Toast "密码重置成功" → 切回登录
   │               └─ 400 → 提示错误
   └─ 404 → "该用户名未注册"
```

---

## 页面状态矩阵

| 状态            | 触发条件     | 品牌区 | Tab      | 表单       | 按钮            |
| --------------- | ------------ | ------ | -------- | ---------- | --------------- |
| 初始            | 页面加载     | 显示   | 默认登录 | 空         | 禁用            |
| 登录-填写中     | 输入账号密码 | 显示   | 登录     | 部分填写   | 启用            |
| 登录-提交中     | 点击登录     | 显示   | 登录     | 只读       | loading         |
| 登录-失败       | 401          | 显示   | 登录     | 保留输入   | 启用 + 错误提示 |
| 注册-校验中     | 账号失焦     | 显示   | 注册     | 账号校验中 | 禁用            |
| 注册-账号已存在 | 409          | 显示   | 注册     | 账号标红   | 启用            |
| 重置-验证中     | 点击验证     | 显示   | 重置     | 新密码禁用 | loading         |
| 重置-验证通过   | 200          | 显示   | 重置     | 新密码启用 | 启用            |

---

## 组件树

```
AuthPage
├── BrandSection
│   ├── Logo
│   ├── Text[NovelToScript]
│   └── Text[AI 小说转剧本工具]
├── AuthTabs
│   ├── Tab[登录]
│   ├── Tab[注册]
│   └── Tab[重置密码]
├── LoginForm (v-if=tab==='login')
│   ├── Input[账号] (required)
│   ├── Input[密码] (required, password)
│   ├── Link[忘记密码?]
│   └── Button[登录] (primary, block)
├── RegisterForm (v-if=tab==='register')
│   ├── Input[用户名] (required, 2-20字)
│   ├── Input[账号] (required, 实时唯一校验)
│   ├── Input[密码] (required, ≥6位)
│   ├── Link[已有账号? 去登录]
│   └── Button[注册] (primary, block)
└── ResetPwdForm (v-if=tab==='reset')
    ├── Input[用户名] (required)
    ├── Button[验证] → 解锁下一步
    ├── Input[新密码] (required, disabled initially)
    ├── Link[返回登录]
    └── Button[提交] (primary, block)
```

---

# 原型: P1 项目首页

## 页面目标

作为登录后的着陆页，提供项目概览、快速操作入口和最近任务摘要。

## 页面结构（从上到下）

1. 项目概览卡片 — 产品介绍 + 使用指引
2. 快速操作区 — 两个主要操作按钮
3. 最近任务表格 — 最近 5 条任务摘要
4. 查看全部链接

---

## 组件清单

### 项目概览

| 组件         | 类型 | 属性               |
| ------------ | ---- | ------------------ |
| 概览标题     | Text | "📊 项目概览"      |
| 描述文字     | Text | NovelToScript 简介 |
| 新手引导链接 | Link | 可折叠的引导面板   |

### 快速操作

| 组件         | 类型   | 属性                                      |
| ------------ | ------ | ----------------------------------------- |
| 导入小说按钮 | Button | type=primary, icon=Upload, @click→/import |
| 查看任务按钮 | Button | type=default, icon=List, @click→/tasks    |

### 最近任务表格

| 列名   | 数据类型                               | 宽度占比 |
| ------ | -------------------------------------- | -------- |
| 任务名 | text + link                            | 30%      |
| 状态   | tag(完成=绿/进行中=蓝/失败=红/排队=灰) | 15%      |
| 进度   | progress-bar（进行中时）               | 20%      |
| 时间   | relative-time                          | 20%      |
| 操作   | link[查看]                             | 15%      |

---

## 交互流程

### 加载最近任务

```
页面挂载 → GET /api/tasks?pageSize=5
        ↓
   ┌─ 200 + 有数据 → 渲染表格
   ├─ 200 + 空数组 → 显示空状态 "📭 暂无任务，[去导入小说 →]"
   └─ 网络错误 → 显示 "加载失败，[重试]"
```

### 快速跳转

```
点击 [📥 导入小说] → router.push('/import')
点击 [📋 查看任务] → router.push('/tasks')
点击表格行/查看链接 → router.push('/tasks/:id')
点击 "查看全部 →" → router.push('/tasks')
```

---

## 页面状态矩阵

| 状态     | 触发条件 | 概览卡片 | 快速操作 | 表格区            | 分页/底栏 |
| -------- | -------- | -------- | -------- | ----------------- | --------- |
| 加载中   | 首次进入 | 显示     | 可点击   | Skeleton 骨架屏   | —         |
| 有数据   | 请求成功 | 显示     | 可点击   | 数据行            | 共N条     |
| 空数据   | 0 条任务 | 显示     | 可点击   | 空状态+引导链接   | —         |
| 网络错误 | 请求失败 | 显示     | 可点击   | "加载失败 [重试]" | —         |

---

## 组件树

```
HomePage
├── ProjectIntro
│   ├── Text[项目概览标题]
│   └── Text[简介描述]
├── QuickActions
│   ├── Button[📥 导入小说] (primary)
│   └── Button[📋 查看任务] (default)
├── RecentTaskList
│   ├── ElTable
│   │   ├── Column[任务名] → Link
│   │   ├── Column[状态] → TaskStatusTag
│   │   ├── Column[进度] → Progress (conditional)
│   │   ├── Column[时间] → RelativeTime
│   │   └── Column[操作] → Link[查看]
│   ├── EmptyState (v-if=noData)
│   │   └── Link[去导入小说 →]
│   └── ErrorState (v-if=error)
│       └── Button[重试]
└── BottomLink[查看全部 →]
```

---

# 原型: P2 小说导入页

## 页面目标

引导用户完成"上传→识别→元数据→提交"四步导入流程，将小说文本转化为待分析任务。

## 页面结构（从上到下）

1. 步骤条 — 四步进度指示
2. Step 1 — 文件上传/文本粘贴区
3. Step 2 — 章节识别结果 + 自定义正则
4. Step 3 — 书名/作者表单
5. 底部 — 创建按钮 + 字数统计

---

## 组件清单

### Step 1 — 上传

| 组件       | 类型         | 属性                                                   |
| ---------- | ------------ | ------------------------------------------------------ |
| 拖拽上传区 | Upload(drag) | accept=".txt,.docx,.md", :maxSize=20MB                 |
| 格式提示   | Text         | "支持 .txt .docx .md 单文件 ≤ 20MB"                    |
| 粘贴文本框 | Input        | type=textarea, rows=8, placeholder="或粘贴小说文本..." |

### Step 2 — 章节识别

| 组件         | 类型           | 属性                                                |
| ------------ | -------------- | --------------------------------------------------- |
| 策略指示     | Tag            | 当前策略高亮                                        |
| 命中率       | Progress       | :percentage=92                                      |
| 章节数       | Text           | "识别到 24 章"                                      |
| 内置规则     | Collapse       | 默认折叠，展开显示内置正则清单                      |
| 自定义正则   | Input + Button | placeholder="^\【.\*\】$", 回车添加, 实时预览命中行 |
| 章节预览按钮 | Button         | @click→打开 ChapterPreview Dialog                   |

### ChapterPreview Dialog (弹窗)

| 组件     | 类型           | 属性             |
| -------- | -------------- | ---------------- |
| 章节列表 | Draggable List | 拖拽调整顺序     |
| 合并按钮 | Button         | 选中两章合并     |
| 拆分输入 | InputNumber    | 在指定位置拆分   |
| 标题编辑 | InlineEdit     | 双击编辑章节标题 |
| 确认按钮 | Button         | type=primary     |

### Step 3 — 元数据

| 组件     | 类型  | 属性                               |
| -------- | ----- | ---------------------------------- |
| 书名输入 | Input | required, placeholder="请输入书名" |
| 作者输入 | Input | placeholder="请输入作者（选填）"   |

### 底部操作

| 组件     | 类型   | 属性                     |
| -------- | ------ | ------------------------ |
| 创建按钮 | Button | type=primary, size=large |
| 字数统计 | Text   | "总字数: 12.5 万字"      |

---

## 交互流程

### 文件上传

```
拖拽/点击选择文件
        ↓
前端校验
   ├─ 格式不支持 → Toast "仅支持 .txt .docx .md"
   ├─ 超过 20MB → Toast "文件过大，最大 20MB"
   └─ 通过 → 读取文本内容 → 进入 Step 2
```

### 章节识别

```
文本内容就绪
        ↓
自动运行内置正则 + 自定义正则 → 统计命中率
        ↓
   ┌─ 命中率 ≥ 70% → 展示结果，策略=规则匹配 ✓
   └─ 命中率 < 70% → Dialog "是否使用AI辅助？"
                         ├─ 确认 → POST /api/ai/detect-chapters → 展示AI结果
                         └─ 取消 → 降级到切片策略
        ↓
用户点击 [📋 章节预览] → 弹窗中手动调整
        ↓
确认章节 → 进入 Step 3
```

### 创建任务

```
点击 [创建分析任务]
        ↓
POST /api/novels/import (multipart/form-data)
        ↓
   ┌─ 201 → novelId
   │          ↓
   │        POST /api/tasks {novelId}
   │          ↓
   │        ┌─ 201 → taskId → router.push('/tasks/' + taskId)
   │        └─ 400 → Toast "创建任务失败"
   ├─ 413 → Toast "文件过大"
   └─ 网络错误 → Toast "网络异常，请重试"
```

---

## 页面状态矩阵

| 状态       | 触发条件     | 步骤条     | Step1      | Step2          | Step3  | 底部按钮        |
| ---------- | ------------ | ---------- | ---------- | -------------- | ------ | --------------- |
| 初始       | 页面加载     | Step1 高亮 | 空         | 隐藏           | 隐藏   | 禁用            |
| 上传完成   | 文件校验通过 | Step2 高亮 | 显示文件名 | 识别中 loading | 隐藏   | 禁用            |
| 识别完成   | 策略执行完毕 | Step2 高亮 | ✓          | 显示结果       | 隐藏   | —               |
| 章节已确认 | 用户确认章节 | Step3 高亮 | ✓          | ✓              | 显示   | 启用            |
| 提交中     | 点击创建     | Step4 闪烁 | ✓          | ✓              | 只读   | loading         |
| 提交成功   | 201          | 全部 ✓     | ✓          | ✓              | ✓      | 跳转中...       |
| 提交失败   | 4xx/5xx      | 当前保持   | ✓          | ✓              | 可编辑 | 启用 + 错误提示 |
| 格式错误   | 校验不通过   | Step1 保持 | 红色提示   | 隐藏           | 隐藏   | 禁用            |

---

## 组件树

```
ImportPage
├── ImportStepper
│   ├── Step[①上传]
│   ├── Step[②章节识别]
│   ├── Step[③元数据]
│   └── Step[④确认]
├── StepContent (v-if=step===1)
│   ├── FileDropZone
│   └── TextPasteArea
├── StepContent (v-if=step===2)
│   ├── StrategyTag[当前策略]
│   ├── Progress[命中率]
│   ├── Text[识别章节数]
│   ├── Collapse[内置规则]
│   │   └── CheckboxList[6条正则]
│   ├── RegexRuleEditor
│   │   ├── Input[自定义正则]
│   │   ├── Button[+ 添加]
│   │   └── TagList[已添加规则]
│   └── Button[📋 章节预览]
├── StepContent (v-if=step===3)
│   └── NovelMetaForm
│       ├── Input[书名*]
│       └── Input[作者]
├── BottomBar
│   ├── Button[创建分析任务] (primary)
│   └── Text[字数统计]
├── ChapterPreview (Dialog)
│   ├── DraggableList[章节]
│   ├── Button[合并]
│   ├── Button[拆分]
│   └── Button[确认]
└── AIDetectDialog (Dialog, conditional)
    ├── Text[是否使用AI辅助识别?]
    ├── Button[确定]
    └── Button[取消]
```

---

# 原型: P3 分析任务页

## 页面目标

管理所有 AI 分析任务：查看列表、按状态筛选、重试失败任务、删除已完成任务。

## 页面结构（从上到下）

1. 标题栏 — 队列状态 + 新建按钮
2. 状态筛选栏 — 可多选的筛选标签
3. 任务表格 — 分页列表
4. 分页器

---

## 组件清单

### 标题栏

| 组件     | 类型           | 属性                                           |
| -------- | -------------- | ---------------------------------------------- |
| 页面标题 | Text           | "📋 分析任务"                                  |
| 队列指示 | QueueIndicator | 运行数/排队数/上限                             |
| 新建按钮 | Button         | type=primary, @click→/import, 排队满时disabled |

### 状态筛选

| 组件     | 类型 | 属性                               |
| -------- | ---- | ---------------------------------- |
| 全部标签 | Tag  | clickable, active=!selected.length |
| 排队中   | Tag  | clickable, :type=warning           |
| 进行中   | Tag  | clickable, :type=primary           |
| 已完成   | Tag  | clickable, :type=success           |
| 失败     | Tag  | clickable, :type=danger            |

### 任务表格

| 列名      | 数据类型                   | 可排序 | 宽度占比 |
| --------- | -------------------------- | ------ | -------- |
| 任务名    | text (小说标题)            | —      | 25%      |
| 状态      | tag(完成/进行中/失败/排队) | ✅     | 10%      |
| 进度      | progress-bar/百分比/—      | ✅     | 15%      |
| 当前Agent | text                       | —      | 15%      |
| 创建时间  | datetime                   | ✅     | 20%      |
| 操作      | actions(查看/重试/删除)    | —      | 15%      |

### RetryDialog (弹窗)

| 组件         | 类型   | 属性                 |
| ------------ | ------ | -------------------- |
| 断点重试选项 | Radio  | value="resume", 推荐 |
| 从头开始选项 | Radio  | value="restart"      |
| 确认按钮     | Button | type=primary         |
| 取消按钮     | Button | type=default         |

---

## 交互流程

### 筛选

```
点击状态标签(可多选)
        ↓
GET /api/tasks?status=processing,failed&page=1
        ↓
   ┌─ 200 → 刷新表格
   └─ 网络错误 → 保留旧数据，Toast 提示
```

### 重试（失败任务）

```
点击行 [重试]
        ↓
弹出 RetryDialog
   ├─ 选择 "断点重试" → POST /api/tasks/:id/retry {mode:"resume"}
   └─ 选择 "从头开始" → POST /api/tasks/:id/retry {mode:"restart"}
        ↓
   ┌─ 202 → Toast "任务已重新入队" → 刷新列表
   └─ 409 → Toast "任务正在运行中，无法重试"
```

### 删除

```
点击行 [删除]（仅 completed/failed）
        ↓
弹出 ElMessageBox.confirm "确定删除该任务？"
        ↓
   ├─ 确认 → DELETE /api/tasks/:id → Toast "已删除" → 刷新列表
   └─ 取消 → 关闭
```

---

## 页面状态矩阵

| 状态       | 触发条件         | 标题栏      | 筛选     | 表格区                   | 分页 |
| ---------- | ---------------- | ----------- | -------- | ------------------------ | ---- |
| 加载中     | 首次/切换筛选    | 显示        | 可交互   | Skeleton × 5 行          | 隐藏 |
| 有数据     | 返回数据         | 显示        | 可交互   | 数据行                   | 正常 |
| 空数据     | 0 条             | 显示        | 可交互   | "📭 暂无任务" + 创建链接 | 隐藏 |
| 筛选无结果 | status筛选无匹配 | 显示        | 保留筛选 | "未找到匹配的任务"       | 隐藏 |
| 网络错误   | 请求失败         | 显示        | 可交互   | "加载失败 [重试]"        | 隐藏 |
| 排队已满   | 排队=3           | "队列: 1/3" | 可交互   | 正常                     | 正常 |
| 删除确认   | 点击删除         | —           | —        | —                        | —    |
| 重试弹窗   | 点击重试         | —           | —        | —                        | —    |

---

## 组件树

```
TaskListPage
├── PageHeader
│   ├── Text[📋 分析任务]
│   ├── QueueIndicator[运行:1/1 排队:2/3]
│   └── Button[+ 新建任务] (primary, :disabled=queueFull)
├── TaskStatusFilter
│   ├── Tag[全部]
│   ├── Tag[排队中]
│   ├── Tag[进行中]
│   ├── Tag[已完成]
│   └── Tag[失败]
├── TaskTable
│   ├── Column[任务名]
│   ├── Column[状态] → TaskStatusTag
│   ├── Column[进度] → Progress / Text
│   ├── Column[当前Agent]
│   ├── Column[创建时间]
│   └── Column[操作] → TaskRowActions
│       ├── Link[查看] (always)
│       ├── Link[重试] (v-if=failed)
│       └── Link[删除] (v-if=completed|failed)
├── EmptyState (v-if=noData)
│   └── Link[创建第一个 →]
├── ErrorState (v-if=error)
│   └── Button[重试]
├── Pagination
└── RetryDialog (Dialog)
    ├── Radio[断点重试 (推荐)]
    ├── Radio[从头开始]
    ├── Button[确认]
    └── Button[取消]
```

---

# 原型: P4 任务详情页

## 页面目标

实时展示 AI 分析流水线的 7 阶段执行状态，查看中间结果，完成后跳转剧本编辑。

## 页面结构（从上到下）

1. 面包屑 + 标题 — 返回导航 + 任务名
2. 状态摘要 — 当前状态 + 总耗时
3. Agent 流水线 — 7 阶段状态（SSE 推送）
4. 中间结果 — 折叠面板
5. 底部操作 — 完成后激活的跳转按钮

---

## 组件清单

### 标题栏

| 组件     | 类型       | 属性                            |
| -------- | ---------- | ------------------------------- |
| 面包屑   | Breadcrumb | "← 返回任务列表", @click→/tasks |
| 任务名   | Text       | 小说标题 + "分析"               |
| 状态标签 | Tag        | :type 随状态变化                |
| 耗时     | Text       | "耗时: 3分24秒"                 |

### Agent 流水线

| 组件       | 类型         | 属性                            |
| ---------- | ------------ | ------------------------------- |
| 流水线容器 | Timeline     | 纵向                            |
| 每阶段行   | TimelineItem | :type=阶段状态                  |
| 阶段名称   | Text         | Agent 显示名                    |
| 状态图标   | Icon         | ✅/🔄/⏳/❌                     |
| 耗时       | Text         | 完成后显示                      |
| 进度条     | Progress     | 仅 running 阶段显示 :percentage |

### 中间结果

| 组件       | 类型         | 属性                            |
| ---------- | ------------ | ------------------------------- |
| 结果面板   | Collapse     | accordion                       |
| 每阶段面板 | CollapseItem | title=Agent名, 仅done状态可展开 |
| JSON查看器 | CodeBlock    | 格式化 JSON                     |

---

## 交互流程

### SSE 连接生命周期

```
页面挂载 → new EventSource('/api/tasks/:id/stream')
        ↓
   ┌─ onmessage: progress → 更新对应 Agent 状态 + 耗时
   ├─ onmessage: agent-complete → 标记 done + 显示中间结果摘要
   ├─ onmessage: task-complete → 激活 [进入剧本编辑]
   ├─ onerror (断线) → 自动重连 (2s→4s→8s, 最多3次)
   │                      └─ 3次失败 → 显示 "连接已断开 [手动重连]"
   └─ beforeUnmount → eventSource.close()
```

### 查看中间结果

```
点击已完成阶段的折叠面板
        ↓
展开显示格式化 JSON
        ↓
再次点击关闭
```

### 完成后跳转

```
SSE: task-complete 事件
        ↓
流水线全部 ✅
        ↓
底部按钮激活 → 点击 [进入剧本编辑]
        ↓
router.push('/script/' + scriptId)
```

---

## 页面状态矩阵

| 状态        | 触发条件      | 标题栏           | 流水线       | 中间结果     | 底部       |
| ----------- | ------------- | ---------------- | ------------ | ------------ | ---------- |
| 初始加载    | 进入页面      | 显示             | 7×⏳         | 空           | 按钮禁用   |
| 进行中      | SSE推送       | 状态=进行中 计时 | 混合✅🔄⏳   | 已完成可展开 | 按钮禁用   |
| 全部完成    | task-complete | 状态=✅完成      | 7×✅         | 全部可展开   | 按钮激活   |
| 失败        | agent-error   | 状态=❌失败      | 部分✅+ ❌   | 已完成可展开 | 重试按钮   |
| SSE断开     | 网络闪断      | 显示             | 冻结上一状态 | 可展开       | —          |
| SSE重连中   | 重试中        | "重连中..."      | 冻结         | 可展开       | —          |
| SSE彻底断开 | 重试3次失败   | "连接已断开"     | 冻结         | 可展开       | [手动重连] |
| 加载中      | GET请求       | skeleton         | skeleton     | —            | —          |

---

## 组件树

```
TaskDetailPage
├── Breadcrumb[← 返回任务列表]
├── TaskInfoHeader
│   ├── Text[任务名]
│   ├── Tag[状态]
│   └── Text[耗时]
├── AgentPipeline
│   └── Timeline
│       ├── TimelineItem[Novel Analysis]
│       │   └── StatusIcon + Text[耗时]
│       ├── TimelineItem[Character Extract]
│       ├── TimelineItem[Plot Extraction]
│       ├── TimelineItem[Scene Planning]
│       │   └── Progress (:percentage)
│       ├── TimelineItem[Script Generation]
│       ├── TimelineItem[YAML Validation]
│       └── TimelineItem[Script Polish]
├── AgentResultPanel
│   └── Collapse
│       ├── CollapseItem[Novel Analysis]
│       │   └── CodeBlock[JSON]
│       ├── CollapseItem[Character Extract]
│       └── CollapseItem[Plot Extraction]
├── TaskCompleteAction (v-if=done)
│   └── Button[进入剧本编辑] (primary)
└── RetryActions (v-if=failed)
    ├── Button[断点重试]
    └── Button[从头开始]
```

---

# 原型: P5 剧本编辑页

## 页面目标

提供 YAML 剧本核心编辑能力，支持实时预览、导出、Schema 校验、AI 润色、版本管理和离线缓存。

## 页面结构（从上到下）

1. 标题栏 — 剧本名 + 保存状态 + 版本号
2. 视图切换 — 分屏/仅编辑/仅预览
3. 工具栏 — 保存/导出/润色/更多
4. 主编辑区 — 左右分屏（Monaco Editor + Markdown 预览）
5. 底部栏 — 校验结果 + 缓存状态

---

## 组件清单

### 标题栏

| 组件     | 类型  | 属性                        |
| -------- | ----- | --------------------------- |
| 剧本名   | Text  | "✏️ 剧本编辑: {书名}"       |
| 保存状态 | Tag   | 💾已保存(绿) / 🟡未保存(黄) |
| 版本号   | Badge | "v3"                        |

### 视图切换

| 组件     | 类型   | 属性               |
| -------- | ------ | ------------------ |
| 分屏按钮 | Button | icon=Split, active |
| 仅编辑   | Button | icon=Code          |
| 仅预览   | Button | icon=View          |

### 工具栏

| 组件     | 类型     | 属性                                    |
| -------- | -------- | --------------------------------------- |
| 保存按钮 | Button   | type=primary, shortcut=Ctrl+S           |
| 导出下拉 | Dropdown | items: yaml/json/md/pdf(正式)/pdf(快速) |
| 润色下拉 | Dropdown | items: 7种风格                          |
| 更多菜单 | Dropdown | items: [校验] [版本历史]                |

### 编辑区

| 组件          | 类型             | 属性                            |
| ------------- | ---------------- | ------------------------------- |
| Monaco Editor | CodeEditor       | language=yaml, schemaCompletion |
| Markdown 预览 | MarkdownRenderer | :source=yamlToMd(content)       |

### 底部栏

| 组件     | 类型  | 属性                           |
| -------- | ----- | ------------------------------ |
| 校验结果 | Alert | :type=校验结果?success:warning |
| 错误列表 | List  | clickable, @click→跳转编辑器行 |
| 缓存状态 | Tag   | 🔒已开启 / 🔓未开启            |

### 弹窗/抽屉

| 组件           | 类型     | 属性                         |
| -------------- | -------- | ---------------------------- |
| PolishDialog   | Dialog   | 风格 RadioGroup + 范围 Input |
| VersionHistory | Drawer   | 右侧滑出                     |
| ExportMenu     | Dropdown | 5种格式                      |

---

## 交互流程

### 保存

```
内容变更 (3s防抖)
        ↓
保存至 IndexedDB (一级缓存)
        ↓
内容变更 (30s防抖)
        ↓
PUT /api/scripts/:id {content}
        ↓
   ┌─ 200 → 版本号自增 → 状态→💾已保存
   └─ 网络错误 → 状态保持🟡 → 队列待重试
```

### AI 润色

```
点击 [✨润色▼] → 选择风格
        ↓
弹出 PolishDialog
   ├─ 选择风格 (7选1)
   └─ 选择范围: 全部 / 指定场景编号
        ↓
点击 [开始润色]
        ↓
POST /api/scripts/:id/polish {style, targetSection}
        ↓
   ┌─ 202 → 返回 taskId → SSE跟踪
   │          SSE: complete → 自动替换编辑器内容 → 版本号自增
   └─ 400 → Toast提示错误
```

### 版本回滚

```
点击 [📜历史] → 右侧抽屉打开
        ↓
GET /api/scripts/:id/versions
        ↓
展示版本列表 → 点击 [回滚]
        ↓
确认弹窗 → POST /api/scripts/:id/rollback {version}
        ↓
   ┌─ 200 → 刷新编辑器内容 → 版本号自增
   └─ 400 → Toast提示错误
```

### 导出 PDF

```
点击 [📤导出▼] → 选择导出类型
        ↓
   ┌─ yaml/json/md/txt → 前端直接下载
   ├─ 导出 PDF (正式) → GET /api/scripts/:id/export?format=pdf
   │                     后端 Puppeteer 渲染 → 下载
   └─ 快速下载 PDF → 前端 jsPDF 生成 → 下载
```

---

## 页面状态矩阵

| 状态     | 触发条件 | 标题栏       | 工具栏        | 编辑器           | 预览     | 底部栏   |
| -------- | -------- | ------------ | ------------- | ---------------- | -------- | -------- |
| 加载中   | 进入页面 | skeleton     | 禁用          | 加载中           | —        | —        |
| 编辑中   | 加载完成 | 💾已保存 vN  | 可操作        | 编辑             | 同步更新 | 校验结果 |
| 未保存   | 内容变更 | 🟡未保存 vN  | 可操作        | 编辑             | 同步     | —        |
| 保存中   | 自动保存 | 保存中...    | 可操作        | 编辑             | 同步     | —        |
| 校验失败 | 校验触发 | 不变         | 可操作        | 编辑(错误行高亮) | 同步     | ⚠N个错误 |
| 润色中   | 点击润色 | 润色中...    | 部分禁用      | 只读             | 只读     | 进度     |
| 离线     | 断网     | "当前离线"   | 导出/润色禁用 | 编辑             | 同步     | 🔒缓存   |
| 恢复在线 | 网络恢复 | "内容已同步" | 可操作        | 编辑             | 同步     | 🔒缓存   |

---

## 组件树

```
ScriptEditorPage
├── ScriptToolbar
│   ├── Text[剧本名]
│   ├── Tag[保存状态]
│   ├── Badge[版本号]
│   ├── ViewToggle
│   │   ├── Button[◐分屏]
│   │   ├── Button[📝仅编辑]
│   │   └── Button[📖仅预览]
│   ├── Button[💾保存] (primary)
│   ├── ExportMenu (Dropdown)
│   ├── PolishDropdown (Dropdown)
│   └── MoreMenu (Dropdown)
│       ├── Item[✅校验]
│       └── Item[📜版本历史]
├── EditorSplitPane
│   ├── YamlEditor (v-if=view!=='preview')
│   │   └── MonacoEditor[yaml mode + Schema completion]
│   └── MarkdownPreview (v-if=view!=='editor')
├── SchemaValidation
│   ├── Alert[校验结果]
│   └── List[错误列表]
├── CacheIndicator
│   └── Tag[缓存状态]
├── PolishDialog (Dialog)
│   ├── RadioGroup[润色风格 7选1]
│   ├── Input[场景范围]
│   ├── Button[开始润色]
│   └── Button[取消]
├── VersionHistory (Drawer)
│   ├── List[版本列表]
│   │   └── ListItem → Button[预览] + Button[回滚]
│   └── VersionPreview (只读展示)
└── ExportMenu (Dropdown)
    ├── Item[yaml]
    ├── Item[json]
    ├── Item[md]
    ├── Item[pdf (正式)]
    └── Item[pdf (快速)]
```

---

# 原型: P6 YAML Schema 文档页

## 页面目标

展示剧本 YAML Schema 定义文档，供作者参考。包含结构树、字段说明表、设计原因、示例剧本。

## 页面结构（从上到下）

1. 标题 — Schema 版本号
2. Schema 树形结构
3. 字段说明表格
4. 设计原因（可折叠）
5. 示例剧本（可折叠）

---

## 组件清单

### Schema 树

| 组件     | 类型  | 属性                                                 |
| -------- | ----- | ---------------------------------------------------- |
| 搜索框   | Input | placeholder="搜索字段名..."                          |
| 树形控件 | Tree  | :data=schemaTree, highlight-current, expand-on-click |

### 字段说明表格

| 列名     | 数据类型  | 宽度 |
| -------- | --------- | ---- |
| 字段路径 | text      | 30%  |
| 类型     | text      | 15%  |
| 必填     | tag(✅/—) | 8%   |
| 说明     | text      | 30%  |
| 示例     | code      | 17%  |

### 设计原因

| 组件         | 类型     | 属性         |
| ------------ | -------- | ------------ |
| 设计原因面板 | Collapse | 默认展开     |
| 内容         | Markdown | 渲染设计文档 |

### 示例剧本

| 组件         | 类型      | 属性                              |
| ------------ | --------- | --------------------------------- |
| 示例剧本面板 | Collapse  | 默认折叠                          |
| 内容         | CodeBlock | language=yaml, readonly, showCopy |

---

## 交互流程

### 字段搜索

```
输入字段名 → 过滤字段说明表格行
选中树节点 → 表格滚动到对应行并高亮
```

### 查看示例

```
展开 [📄 示例剧本]
        ↓
显示完整 YAML → 可复制
```

---

## 页面状态矩阵

| 状态       | 触发条件   | 树       | 表格             | 设计原因 | 示例 |
| ---------- | ---------- | -------- | ---------------- | -------- | ---- |
| 加载中     | 首次进入   | skeleton | skeleton         | —        | —    |
| 正常       | 数据就绪   | 完整树   | 所有字段         | 展开     | 折叠 |
| 搜索中     | 输入搜索词 | 不变     | 过滤后行         | —        | —    |
| 搜索无结果 | 无匹配     | 不变     | "未找到匹配字段" | —        | —    |

---

## 组件树

```
SchemaPage
├── PageHeader
│   ├── Text[📐 YAML Schema]
│   └── VersionBadge[v1.0.0]
├── SearchInput[搜索字段名]
├── SchemaTree
│   └── ElTree
│       ├── Node[script]
│       ├── Node[meta]
│       │   ├── Node[title]
│       │   ├── Node[author]
│       │   └── Node[source]
│       ├── Node[characters]
│       │   └── Node[[*]]
│       │       ├── Node[name]
│       │       ├── Node[role]
│       │       └── Node[desc]
│       ├── Node[scenes]
│       │   └── Node[[*]]
│       │       ├── Node[id]
│       │       ├── Node[location]
│       │       ├── Node[time]
│       │       ├── Node[characters]
│       │       └── Node[dialogues]
│       ├── Node[extensions]
│       └── Node[version]
├── SchemaFieldTable
│   └── ElTable
│       ├── Column[字段]
│       ├── Column[类型]
│       ├── Column[必填]
│       ├── Column[说明]
│       └── Column[示例]
├── SchemaRationale (Collapse)
│   └── MarkdownRenderer[设计原因.md]
└── ScriptExample (Collapse)
    └── CodeBlock[yaml, readonly, copyable]
```

---

## 全局适配提示

### → Figma

- 用"组件清单"创建 Component Set，属性映射为 Variant Properties
- "状态矩阵"每行是一个 Frame，Frame 内嵌套对应 Variant
- "交互流程"用 Prototype 连线 + Conditional Logic
- 全局组件（AppLayout、NotificationCenter 等）单独建 Page 存放 Master Component

### → Excalidraw

- "页面结构"逐区域拖入矩形框（Cmd/Ctrl+D 复制模板）
- "组件树"作为标注贴附在矩形框上
- "交互流程"用 Arrow + Text 标注触发→响应

### → Whimsical

- 每个页面建一个 Board
- "页面状态矩阵"对应多个 Frame（Loading/Empty/Error/Normal）
- "交互流程"用 Flowchart 模式绘制
- "组件树"用 Mind Map 模式可视化

---

## 状态矩阵通用说明

所有页面的"加载中"状态统一使用 **Element Plus Skeleton** 骨架屏：

- 表格类：Skeleton × N 行（N=该页默认行数）
- 卡片类：Skeleton 卡片占位
- 表单类：Skeleton Input 占位

所有页面的"网络错误"状态统一使用：

- 错误图标 + "加载失败" 文案 + [重试] 按钮
- 不跳转，原地重新请求
