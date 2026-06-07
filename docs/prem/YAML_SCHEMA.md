# YAML Schema — 剧本结构定义

> 定义 AI 小说转剧本工具输出的 YAML 剧本结构规范  
> 版本: 1.0.0 | 日期: 2026-06-07 | 对应 PRD 需求 R6

---

## 一、Schema 总览

```yaml
title: string # 剧本标题（必填）
metadata: # 元数据（必填）
  author: string # 原作者
  adaptedBy: string # 改编者
  genre: string # 文学类型
  subGenre: string # 子类型
  totalScenes: integer # 场景总数
  language: string # 语言
characters: # 角色列表（必填）
  - name: string # 角色名
    role: enum # 角色类型
    description: string # 角色描述
    traits: [string] # 性格特征
    motivation: string # 动机
    relationships: # 角色关系
      - with: string
        type: string
scenes: # 场景列表（必填）
  - sceneNumber: integer # 场景序号
    location: string # 地点
    time: string # 时间描述
    participants: [string] # 出场角色
    description: string # 环境描述（50-150字）
    mood: enum # 场景氛围
    dialogues: # 对白列表（必填）
      - speaker: string # 说话人
        text: string # 对白内容
        action: string # 动作描述（可选）
        emotion: string # 情感标注（可选）
    stageDirections: [string] # 舞台/镜头指示（可选）
```

---

## 二、字段详细定义

### 2.1 顶级字段

| 字段         | 类型     | 必填 | 说明                                         |
| ------------ | -------- | ---- | -------------------------------------------- |
| `title`      | `string` | ✅   | 剧本标题，从原文内容提炼，禁止使用已知作品名 |
| `metadata`   | `object` | ✅   | 元数据块，包含作者、类型等制式信息           |
| `characters` | `array`  | ✅   | 剧本角色列表，至少包含 1 个角色              |
| `scenes`     | `array`  | ✅   | 场景列表，至少包含 1 个场景                  |

### 2.2 metadata 字段

| 字段          | 类型      | 必填 | 说明                                   |
| ------------- | --------- | ---- | -------------------------------------- |
| `author`      | `string`  |      | 原作者，原文未明确提及时填 `"未知"`    |
| `adaptedBy`   | `string`  |      | 改编者标识，AI 生成时填 `"AI"`         |
| `genre`       | `string`  |      | 文学类型，见 [2.5 枚举值](#25-枚举值)  |
| `subGenre`    | `string`  |      | 子类型，如"修真"、"星际"、"宫斗"       |
| `totalScenes` | `integer` | ✅   | 场景总数，必须与 `scenes` 数组长度一致 |
| `language`    | `string`  |      | 语言，默认 `"zh-CN"`                   |

### 2.3 characters 字段

| 字段            | 类型     | 必填 | 说明                                  |
| --------------- | -------- | ---- | ------------------------------------- |
| `name`          | `string` | ✅   | 角色名，必须在原文中有明确依据        |
| `role`          | `enum`   | ✅   | 角色类型，见 [2.5 枚举值](#25-枚举值) |
| `description`   | `string` |      | 50-100 字角色外貌性格描述             |
| `traits`        | `array`  |      | 性格特征标签，如 `["勇敢", "冲动"]`   |
| `motivation`    | `string` |      | 角色核心动机，30 字以内               |
| `relationships` | `array`  |      | 角色关系列表                          |

**relationships 子字段**：

| 字段   | 类型     | 必填 | 说明                                               |
| ------ | -------- | ---- | -------------------------------------------------- |
| `with` | `string` | ✅   | 关系对象角色名，必须在 characters 中存在           |
| `type` | `string` | ✅   | 关系类型，如"师徒"、"挚友"、"恋人"、"敌对"、"父子" |

### 2.4 scenes 字段

| 字段              | 类型      | 必填 | 说明                                             |
| ----------------- | --------- | ---- | ------------------------------------------------ |
| `sceneNumber`     | `integer` | ✅   | 场景序号，从 1 开始递增，不可重复                |
| `location`        | `string`  | ✅   | 场景地点，如"萧家练武场"、"长安城朱雀大街"       |
| `time`            | `string`  |      | 时间描述，如"清晨"、"三日后"、"同年深秋"         |
| `participants`    | `array`   |      | 出场角色名列表，角色名必须在 `characters` 中存在 |
| `description`     | `string`  |      | 场景环境描述，50-150 字，用于舞台/镜头调度       |
| `mood`            | `enum`    |      | 场景氛围，见 [2.5 枚举值](#25-枚举值)            |
| `dialogues`       | `array`   | ✅   | 对白列表，每个场景至少 3 段对白                  |
| `stageDirections` | `array`   |      | 舞台指示/镜头指示，描述非对白的调度动作          |

**dialogues 子字段**：

| 字段      | 类型     | 必填 | 说明                                                   |
| --------- | -------- | ---- | ------------------------------------------------------ |
| `speaker` | `string` | ✅   | 说话人，必须在 `characters` 中存在                     |
| `text`    | `string` | ✅   | 对白文本，应尽可能从原文对话中提取                     |
| `action`  | `string` |      | 同步动作描述，如"拔剑"、"转身"、"低声"                 |
| `emotion` | `string` |      | 情感标注，用于 AI 润色和导出渲染，见 [2.5](#25-枚举值) |

### 2.5 枚举值

#### role — 角色类型

| 值            | 说明     |
| ------------- | -------- |
| `PROTAGONIST` | 主角     |
| `ANTAGONIST`  | 反派     |
| `SUPPORTING`  | 配角     |
| `MINOR`       | 次要角色 |

#### genre — 文学类型

| 值       | 说明 |
| -------- | ---- |
| `仙侠`   |      |
| `都市`   |      |
| `科幻`   |      |
| `历史`   |      |
| `悬疑`   |      |
| `言情`   |      |
| `武侠`   |      |
| `奇幻`   |      |
| `军事`   |      |
| `游戏`   |      |
| `体育`   |      |
| `轻小说` |      |
| `其他`   |      |

#### mood — 场景氛围

| 值     | 说明 |
| ------ | ---- |
| `紧张` |      |
| `温馨` |      |
| `悲伤` |      |
| `欢乐` |      |
| `悬疑` |      |
| `平静` |      |
| `激烈` |      |
| `恐惧` |      |
| `庄严` |      |

#### emotion — 对白情感

| 值     | 说明     |
| ------ | -------- |
| `平静` | 中性陈述 |
| `愤怒` |          |
| `悲伤` |          |
| `喜悦` |          |
| `恐惧` |          |
| `惊讶` |          |
| `轻蔑` |          |
| `坚定` | 意志表达 |
| `犹豫` |          |
| `温柔` |          |
| `讽刺` |          |
| `无奈` |          |

---

## 三、完整示例

```yaml
title: 斗破苍穹·三年之约
metadata:
  author: 天蚕土豆
  adaptedBy: AI
  genre: 仙侠
  subGenre: 修真
  totalScenes: 3
  language: zh-CN
characters:
  - name: 萧炎
    role: PROTAGONIST
    description: 萧家少年，背负三年之约，隐忍坚毅
    traits: ["坚毅", "隐忍", "重情义"]
    motivation: 变强以兑现三年之约
    relationships:
      - with: 纳兰嫣然
        type: 敌对/婚约
      - with: 药老
        type: 师徒
  - name: 纳兰嫣然
    role: ANTAGONIST
    description: 云岚宗天才弟子，曾退婚羞辱萧炎
    traits: ["骄傲", "天赋异禀"]
    motivation: 证明自己当初的选择正确
    relationships:
      - with: 萧炎
        type: 敌对/婚约
  - name: 药老
    role: SUPPORTING
    description: 寄居在萧炎戒指中的神秘灵魂体
    traits: ["睿智", "神秘", "严格"]
    motivation: 帮助萧炎变强，寻找恢复肉身之法
    relationships:
      - with: 萧炎
        type: 师徒
scenes:
  - sceneNumber: 1
    location: 萧家练武场
    time: 清晨
    participants: ["萧炎"]
    description: 练武场上晨雾未散，萧炎独立于场中，手中紧握一柄玄铁重尺，汗珠沿着脸颊滑落
    mood: 平静
    dialogues: []
    stageDirections:
      - "萧炎挥动重尺，每一次挥击都带起风声"
      - "远处鸡鸣响起，天色渐明"

  - sceneNumber: 2
    location: 萧炎房间
    time: 深夜
    participants: ["萧炎", "药老"]
    description: 一灯如豆，萧炎盘膝而坐，戒指中飘出一缕青烟，化作药老虚影
    mood: 平静
    dialogues:
      - speaker: 药老
        text: 小家伙，三年之约将至，可准备好了？
        emotion: 平静
      - speaker: 萧炎
        text: 弟子日夜苦修，断不敢忘。
        action: 握紧拳头
        emotion: 坚定
      - speaker: 药老
        text: 那丫头如今已是云岚宗年轻一辈第一人，你可有信心？
        emotion: 平静
      - speaker: 萧炎
        text: 她越强，我越要赢。
        action: 目光如炬
        emotion: 坚定
    stageDirections:
      - "窗外风声掠过，烛火摇曳"

  - sceneNumber: 3
    location: 云岚宗大殿
    time: 正午
    participants: ["萧炎", "纳兰嫣然"]
    description: 大殿之上，云岚宗诸长老列坐，气氛肃杀。萧炎负尺而立，纳兰嫣然白衣胜雪
    mood: 紧张
    dialogues:
      - speaker: 纳兰嫣然
        text: 萧炎，想不到你真敢来。
        emotion: 轻蔑
      - speaker: 萧炎
        text: 三年之约，我来了。
        action: 将玄铁重尺顿地
        emotion: 坚定
      - speaker: 纳兰嫣然
        text: 当日退婚，是我不对。但今日之战，我不会留手。
        action: 拔出长剑
        emotion: 平静
      - speaker: 萧炎
        text: 正合我意！
        action: 重尺横扫，斗气迸发
        emotion: 激烈
    stageDirections:
      - "两股斗气在大殿中碰撞，气浪掀翻两侧旗帜"
      - "诸长老面露惊色，纷纷退后"
```

---

## 四、校验规则

### 4.1 结构校验

| 规则 | 描述                                                         | 严重级别 |
| ---- | ------------------------------------------------------------ | -------- |
| S-01 | 必须是合法 YAML 格式                                         | `error`  |
| S-02 | `title`、`metadata`、`characters`、`scenes` 四个顶级字段必填 | `error`  |
| S-03 | `scenes` 数组不能为空                                        | `error`  |
| S-04 | `characters` 数组不能为空                                    | `error`  |

### 4.2 metadata 校验

| 规则 | 描述                                     | 严重级别  |
| ---- | ---------------------------------------- | --------- |
| M-01 | `totalScenes` 必须等于 `scenes` 数组长度 | `error`   |
| M-02 | `totalScenes` 必须为正整数               | `error`   |
| M-03 | `genre` 必须在枚举范围内                 | `warning` |
| M-04 | `author` 填"未知"时建议提示              | `warning` |

### 4.3 characters 校验

| 规则 | 描述                                                          | 严重级别  |
| ---- | ------------------------------------------------------------- | --------- |
| C-01 | 每个角色必须有 `name` 和 `role`                               | `error`   |
| C-02 | `role` 必须在枚举范围内                                       | `error`   |
| C-03 | `name` 在 characters 列表中不可重复                           | `error`   |
| C-04 | `relationships[].with` 引用的角色名必须在 `characters` 中存在 | `warning` |

### 4.4 scenes 校验

| 规则  | 描述                                                  | 严重级别  |
| ----- | ----------------------------------------------------- | --------- |
| SC-01 | 每个场景必须有 `sceneNumber`、`location`、`dialogues` | `error`   |
| SC-02 | `sceneNumber` 从 1 递增，不可重复、不可跳跃           | `error`   |
| SC-03 | `participants` 中的角色名必须在 `characters` 中存在   | `warning` |
| SC-04 | 每个场景至少包含 3 段对白（AI 生成阶段）              | `warning` |
| SC-05 | `mood` 必须在枚举范围内                               | `warning` |
| SC-06 | `sceneNumber` 最大不得低于 `totalScenes`              | `error`   |

### 4.5 dialogues 校验

| 规则 | 描述                                 | 严重级别  |
| ---- | ------------------------------------ | --------- |
| D-01 | 每段对白必须有 `speaker` 和 `text`   | `error`   |
| D-02 | `speaker` 必须在 `characters` 中存在 | `warning` |
| D-03 | `text` 不能为空字符串                | `error`   |
| D-04 | `emotion` 必须在枚举范围内           | `warning` |

---

## 五、设计原因

### 5.1 为什么选择 YAML？

| 维度         | YAML                        | JSON                          |
| ------------ | --------------------------- | ----------------------------- |
| **可读性**   | ✅ 无括号、中文友好、可注释 | ❌ 引号和花括号密集，视觉噪音 |
| **可编辑性** | ✅ 编剧可直接手改           | ❌ 需要格式化工具辅助         |
| **多行文本** | ✅ `>` `\|` 语法优雅        | ❌ `\n` 转义难以维护          |
| **结构化**   | ✅ 缩进表层级，直观         | ✅ 同样支持                   |
| **工具链**   | ✅ js-yaml / PyYAML 成熟    | ✅ 原生支持                   |
| **版本对比** | ✅ 行级 diff 友好           | ❌ 无格式对比困难             |

> **决策**: 剧本的最终用户是编剧，他们需要直接阅读和修改 YAML 内容。YAML 的可注释特性也允许在协作中标注修改意图。

### 5.2 为什么分 metadata / characters / scenes 三层？

```
剧本 = 元数据(metadata) + 人物(characters) + 内容(scenes)
```

| 层           | 类比                        | 设计意图                                      |
| ------------ | --------------------------- | --------------------------------------------- |
| `metadata`   | 书籍封面+版权页             | 与创作内容解耦，便于检索、分类、导出          |
| `characters` | 人物表（Dramatis Personae） | 前置声明所有角色，对白中的 `speaker` 引用此表 |
| `scenes`     | 正文                        | 核心创作内容，场景为最小叙事单元              |

**关键设计决策**：将 `characters` 从 `metadata` 中独立出来作为顶级字段，而非内嵌在 metadata 内。原因：

1. **角色引用的完整性**：`scenes[].participants` 和 `dialogues[].speaker` 需要引用角色名，独立列表便于校验
2. **独立编辑**：编剧可以单独修改人物设定而不影响正文
3. **AI 流水线**：CharacterExtractionAgent 的输出直接映射为此块

### 5.3 为什么以场景（scene）为核心叙事单元？

| 考量             | 说明                                        |
| ---------------- | ------------------------------------------- |
| **影视行业标准** | 剧本天然按场景组织（scene = 同一时间+地点） |
| **对白分组**     | 对白必须在场景上下文中有意义                |
| **导演调度**     | `stageDirections` 解释场景内的走位和镜头    |
| **AI 分片友好**  | 场景是 AI 生成的自然边界，支持断点续传      |

### 5.4 为什么 dialogues 中需要 action 和 emotion？

```yaml
dialogues:
  - speaker: 萧炎
    text: 三年之约，我来了。
    action: 将玄铁重尺顿地 # ← 同步动作
    emotion: 坚定 # ← 情感标签
```

| 字段      | 为谁服务        | 用途                                   |
| --------- | --------------- | -------------------------------------- |
| `speaker` | 演员/配音       | 谁说话                                 |
| `text`    | 演员/字幕       | 说什么                                 |
| `action`  | 导演/分镜       | 说话时做什么 — 决定镜头语言            |
| `emotion` | AI润色/配音指导 | 以什么语气说 — 指导 AI 润色和 TTS 渲染 |

`action` 和 `emotion` 虽然是可选字段，但在 AI 生成阶段强制输出，因为：

1. **动作-对白绑定**：剧本不同于小说，动作和对白必须同步描述（不能"先描述动作，再另起一行写台词"）
2. **AI 润色依据**：润色 Agent 根据 `emotion` 调整措辞风格
3. **导出渲染**：导出为 PDF/字幕时，`emotion` 可转换为括号标注（如"（坚定地）"）

### 5.5 为什么 stageDirections 是数组？

```yaml
stageDirections:
  - "萧炎挥动重尺，每一次挥击都带起风声"
  - "远处鸡鸣响起，天色渐明"
```

| 数组方案                             | 单字符串方案                          |
| ------------------------------------ | ------------------------------------- |
| ✅ 一条指示 = 一个镜头/调度单元      | ❌ 多条指示挤在一个字符串中，难以拆分 |
| ✅ 支持单独编辑、插删                | ❌ 编辑整段文本                       |
| ✅ 导出时可逐条渲染（编号/项目符号） | ❌                                    |

### 5.6 为什么 characters 前置？

传统剧本格式中，"人物表"（Dramatis Personae）总是放在正文前。本 Schema 遵循此惯例：

1. **读者体验**：先认识角色，再阅读场景对话
2. **引用一致性**：有了全局角色表，`speaker` 字段只需存角色名，无需在每个场景重复角色描述
3. **校验便利**：可自动检测 `speaker` 和 `participants` 是否引用了不存在的角色

### 5.7 枚举值的设计考量

**emotion 为何限定为 12 个值？**

- 太少（如 5 个）：无法覆盖剧本常见情感，AI 会倾向于选"平静"
- 太多（如 50 个）：AI 会选择不一致（同一角色同一情绪被标注为不同标签）
- 12 个是经验值，覆盖普拉切克情感轮的核心情感维度

**genre 为何设"其他"？**

- DeepSeek 等 LLM 可能识别出不在预定义列表中的类型
- "其他"作为兜底，避免 AI 为匹配枚举而强行分类
- 后续版本可根据实际使用数据扩展枚举

---

## 六、扩展性设计

### 6.1 向前兼容策略

新增字段时遵循以下原则：

1. **只增不减**：已有字段不删除、不重命名
2. **新增字段默认可选**：旧版本剧本缺失新字段时不报错
3. **版本号递增**：Schema 版本号遵循 SemVer
   - MAJOR：删除字段、修改字段类型
   - MINOR：新增必填字段
   - PATCH：新增可选字段、调整枚举值

### 6.2 扩展点

```yaml
# 预留扩展点（当前版本不启用，但解析器应忽略未知字段）
metadata:
  # ... 现有字段
  copyright: string # 版权信息
  tags: [string] # 标签（用于分类检索）

scenes:
  - sceneNumber: 1
    # ... 现有字段
    soundtrack: string # 建议配乐
    visualStyle: string # 视觉风格参考
    duration: string # 预估时长（如 "3min"）
```

### 6.3 与数据库模型的映射

| YAML 路径                | 数据库表/字段     |
| ------------------------ | ----------------- |
| `metadata.title`         | `Script.title`    |
| `metadata.author`        | `Novel.author`    |
| `metadata.totalScenes`   | 计算字段          |
| `characters[*]`          | `Character` 表    |
| `scenes[*]`              | `Scene` 表        |
| `scenes[*].dialogues[*]` | `Dialogue` 表     |
| 完整 YAML                | `Version.content` |

---

## 七、与 AI 流水线的衔接

```
ScriptGenerationChain (Step 5)
    │  输出: YAML 剧本（遵循本 Schema）
    │  输入: scenes规划 + characters + 原文采样
    ▼
YamlValidationChain (Step 6)
    │  输入: YAML + Schema 规则
    │  校验: 结构完整性 + 枚举有效性 + 引用一致性
    │  输出: { valid, errors[], warnings[] }
    ▼
FaithfulnessCheck (Step 6.5)
        输入: YAML + 原文采样
        校验: 角色/情节/对白的忠实度
```

### Prompt 注入 Schema 规则

在 `ScriptGenerationChain` 的 Prompt 中，应包含本 Schema 的格式要求和示例，确保 AI 输出直接合规。在 `YamlValidationChain` 中，应注入校验规则（第四节的规则表）作为结构化约束。

---

## 八、版本历史

| 版本  | 日期       | 变更说明                                                   |
| ----- | ---------- | ---------------------------------------------------------- |
| 1.0.0 | 2026-06-07 | 初始版本，定义完整 Schema 结构、枚举值、校验规则和设计原因 |
