# AI_WORKFLOW — LangChain + DeepSeek AI 工作流

> 基于 PRD Agent定义 + ARCHITECTURE AI工作流 + QUEUE_SPECS 生成
> LLM: DeepSeek v2 | 框架: LangChain.js 0.3.x | 日期: 2026-06-05

---

## 一、工作流总览

```
📥 POST /api/tasks (创建任务)
        │
        ▼
┌─────────────────────────────────────────────────────┐
│              BullMQ: script-generation               │
│                                                     │
│  Step 1 ──► NovelAnalysisChain                      │
│              输入: 分片文本                          │
│              输出: { genre, themes, style, outline } │
│  ──────────────────────────────────────────────      │
│  Step 2 ──► CharacterExtractionChain                │
│              输入: 全文 + 分析结果                   │
│              输出: [{ name, role, traits, ... }]     │
│  ──────────────────────────────────────────────      │
│  Step 3 ──► PlotAnalysisChain                       │
│              输入: 全文 + 人物列表                   │
│              输出: { plots, conflicts, climax }      │
│  ──────────────────────────────────────────────      │
│  Step 4 ──► ScenePlanningChain                      │
│              输入: 情节 + 人物                       │
│              输出: [{ sceneNumber, location, ... }]  │
│  ──────────────────────────────────────────────      │
│  Step 5 ──► ScriptGenerationChain                   │
│              输入: 场景规划 + 人物 + Schema          │
│              输出: YAML 剧本                         │
│  ──────────────────────────────────────────────      │
│  Step 6 ──► YamlValidationChain                     │
│              输入: YAML + Schema 规则                │
│              输出: { valid, errors[] }               │
│  ──────────────────────────────────────────────      │
│  Step 7 ──► ScriptPolishChain (可选)                │
│              输入: YAML + 风格                       │
│              输出: 润色后 YAML                       │
└─────────────────────────────────────────────────────┘
        │
        ▼
  📤 写入 DB (Script + Version + Character + Scene)
  📤 SSE 推送完成事件
```

---

## 二、任务拆解

| 步骤 | Chain                      | 输入                     | 输出格式 | 预计 Token    | 预计耗时 |
| ---- | -------------------------- | ------------------------ | -------- | ------------- | -------- |
| 1    | `NovelAnalysisChain`       | 分片文本 × N             | JSON     | 8K in/1K out  | ~3s × N  |
| 2    | `CharacterExtractionChain` | 全文摘要 + 分析结果      | JSON     | 6K in/2K out  | ~15s     |
| 3    | `PlotAnalysisChain`        | 全文摘要 + 人物列表      | JSON     | 6K in/2K out  | ~45s     |
| 4    | `ScenePlanningChain`       | 情节摘要 + 人物          | JSON     | 6K in/3K out  | ~60s     |
| 5    | `ScriptGenerationChain`    | 场景规划 + 人物 + Schema | YAML     | 8K in/8K out  | ~90s     |
| 6    | `YamlValidationChain`      | YAML + Schema 规则       | JSON     | 4K in/500 out | ~2s      |
| 7    | `ScriptPolishChain`        | YAML + 风格选择          | YAML     | 8K in/4K out  | ~30s     |

> **串行总耗时**: ~245s (不含分片并行) | **超时**: 600s (含重试缓冲)

---

## 三、文本切块策略

### 三级分片

```
一级: 章节分片 — 按章节标题边界切分 (第X章/Chapter X/纯数字行)
二级: 段落切片 — 章节 > 8000字时按段落边界再切
三级: 语义切片 — 保持语义完整，确保不在对话/句子中间切断
```

### 切块参数

| 参数       | 值           | 说明                      |
| ---------- | ------------ | ------------------------- |
| 最大 Chunk | 8000 字      | DeepSeek 单次输入上限     |
| 推荐 Chunk | 5000~8000 字 | 平衡语义完整与 Token 消耗 |
| 最小 Chunk | 1000 字      | 低于此值合并到前一 Chunk  |
| Overlap    | 200 字       | 防止边界信息丢失          |
| 分片上限   | 100 个       | 对应最大章节数            |

### 实现

```ts
// backend/src/modules/ai/text-chunker.ts

interface Chunk {
  index: number;
  text: string;
  chapterRef?: string; // 来源章节 (如 "第三章")
  estimatedTokens: number; // 估算: 中文字符 ≈ 2 tokens/字
}

function chunkNovel(fullText: string, chapters: ChapterBoundary[]): Chunk[] {
  const chunks: Chunk[] = [];

  for (const chapter of chapters) {
    const chapterText = fullText.slice(chapter.start, chapter.end);

    if (chapterText.length <= 8000) {
      // 章节小于 8000 字，整章作为一个 Chunk
      chunks.push({
        index: chunks.length,
        text: chapterText,
        chapterRef: chapter.title,
      });
    } else {
      // 章节超过 8000 字，按段落边界再切
      const subChunks = splitByParagraph(chapterText, 8000, 200);
      chunks.push(
        ...subChunks.map((text, i) => ({
          index: chunks.length,
          text,
          chapterRef: `${chapter.title}(分片${i + 1})`,
        })),
      );
    }
  }

  return chunks;
}
```

---

## 四、Prompt 设计

### 4.1 NovelAnalysisChain — 小说分析

```ts
// prompts/novel-analysis.prompt.ts

export const NOVEL_ANALYSIS_PROMPT = `你是一位资深文学编辑。请分析以下小说片段，提取关键信息。

## 任务
1. 识别小说的文学风格和类型 (genre)
2. 归纳核心主题 (themes)
3. 描述叙事风格特点 (narrativeStyle)
4. 如果片段涉及情节，概括主要事件

## 输出格式
严格输出以下 JSON，不要包含任何其他文字：
{
  "genre": "仙侠|都市|科幻|历史|悬疑|言情|武侠|其他",
  "subGenre": "更具体的子类型",
  "themes": ["主题1", "主题2"],
  "narrativeStyle": "第一人称|第三人称|多视角",
  "toneStyle": "严肃|轻松|幽默|悲情|热血",
  "events": [
    { "summary": "事件简述", "importance": "major|minor" }
  ]
}

## 文本
{text}`;
```

### 4.2 CharacterExtractionChain — 角色提取

```ts
// prompts/character-extraction.prompt.ts

export const CHARACTER_EXTRACTION_PROMPT = `你是一位专业的剧本角色分析师。请从小说中提取所有主要角色。

## 任务
1. 识别所有有名有姓的角色
2. 判断角色类型（主角/反派/配角）
3. 描述外貌、性格、动机
4. 分析角色之间的关系

## 输出格式
严格输出以下 JSON：
{
  "characters": [
    {
      "name": "角色名",
      "role": "PROTAGONIST|ANTAGONIST|SUPPORTING",
      "description": "外貌、性格、背景的简短描述 (50-100字)",
      "traits": ["性格特征1", "性格特征2", "性格特征3"],
      "motivation": "角色的核心动机",
      "relationships": [
        { "with": "另一角色名", "type": "师徒|挚友|恋人|敌对|父子|母女|兄弟" }
      ]
    }
  ]
}

## 小说摘要
{summary}

## 小说全文（请重点扫描对话和描写部分）
{text}`;
```

### 4.3 PlotAnalysisChain — 情节分析

```ts
// prompts/plot-analysis.prompt.ts

export const PLOT_ANALYSIS_PROMPT = `你是一位剧本策划。请分析小说的情节结构，为剧本改编做准备。

## 任务
1. 识别主线情节和支线情节
2. 找出关键冲突和转折点
3. 定位高潮和结局

## 输出格式
严格输出以下 JSON：
{
  "mainPlot": {
    "summary": "主线情节概述 (100-200字)",
    "stages": [
      { "stage": "开端|发展|转折|高潮|结局", "description": "阶段描述", "chapterRange": "第X章-第Y章" }
    ]
  },
  "subPlots": [
    { "summary": "支线概述", "relatedCharacters": ["角色名"] }
  ],
  "conflicts": [
    { "type": "人物冲突|内心冲突|环境冲突", "description": "冲突描述", "participants": ["角色1", "角色2"] }
  ],
  "turningPoints": [
    { "description": "转折点描述", "impact": "high|medium", "chapter": "第X章" }
  ],
  "climax": { "description": "高潮描述", "chapter": "第X章" },
  "ending": { "type": "圆满|悲剧|开放|反转", "description": "结局描述" }
}

## 人物列表
{characters}

## 小说摘要
{summary}`;
```

### 4.4 ScenePlanningChain — 场景规划

```ts
// prompts/scene-planning.prompt.ts

export const SCENE_PLANNING_PROMPT = `你是一位影视场景规划师。请将小说情节拆解为具体的剧本场景。

## 任务
1. 按时间/空间变化划分场景
2. 每个场景标注地点、时间、参与者、场景目标
3. 确保场景之间有逻辑递进

## 输出格式
严格输出以下 JSON：
{
  "scenes": [
    {
      "sceneNumber": 1,
      "location": "场景地点",
      "time": "时间描述 (如: 清晨/午后/深夜 或 具体时间)",
      "participants": ["角色1", "角色2"],
      "goal": "本场景要达成的叙事目标 (30字内)",
      "summary": "场景内容简述 (50-100字)",
      "sourceChapter": "第X章",
      "mood": "紧张|温馨|悲伤|欢乐|悬疑|平静|激烈"
    }
  ]
}

## 情节分析
{plotAnalysis}

## 人物列表
{characters}`;
```

### 4.5 ScriptGenerationChain — 剧本生成

```ts
// prompts/script-generation.prompt.ts

export const SCRIPT_GENERATION_PROMPT = `你是一位专业编剧。请根据场景规划和人物信息，生成完整的 YAML 格式剧本。

## 格式要求
严格遵循以下 YAML Schema 输出：

\`\`\`yaml
title: 剧本标题
metadata:
  author: 原作者
  adaptedBy: AI
  genre: 类型
  totalScenes: 场景总数
scenes:
  - sceneNumber: 1
    location: 地点
    time: 时间
    participants:
      - 角色名
    description: 场景环境描述
    dialogues:
      - speaker: 角色名
        text: 对白内容
        action: (可选) 动作描述
        emotion: (可选) 情感标注
    stageDirections:
      - 舞台指示/镜头指示
\`\`\`

## 创作要求
1. 对白要符合角色性格特征
2. 保留小说的核心冲突和情感张力
3. 适当添加舞台指示增强画面感
4. 每场景对白不少于 3 段

## Schema 参考
{schemaRef}

## 场景规划
{scenes}

## 人物列表
{characters}`;
```

### 4.6 YamlValidationChain — YAML 校验

```ts
// prompts/yaml-validation.prompt.ts

export const YAML_VALIDATION_PROMPT = `你是一位 YAML 格式校验专家。请检查以下剧本 YAML 是否符合 Schema 规范。

## 校验规则
{schemaRules}

## 输出格式
严格输出以下 JSON：
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "suggestions": []
}

如果发现错误:
{
  "valid": false,
  "errors": [
    { "line": 行号, "field": "字段路径", "message": "错误描述", "severity": "error|warning" }
  ],
  "warnings": [
    { "line": 行号, "message": "建议描述" }
  ],
  "suggestions": ["改进建议1", "改进建议2"]
}

## 待校验 YAML
{yaml}`;
```

### 4.7 ScriptPolishChain — 润色

```ts
// prompts/polish.prompt.ts

export const POLISH_PROMPT = `你是一位剧本润色专家。请按照指定风格优化以下剧本。

## 润色风格
{style}

## 风格说明
- faithful: 忠实还原原著，保持原文风格和叙事节奏
- tv_drama: 影视剧风格，强化戏剧冲突和视觉画面感
- short_drama: 短剧风格，快节奏、强冲突、每场景对白精简
- anime: 动漫风格，夸张的表情动作描述，视觉化表达
- movie: 电影风格，注重视觉冲击力和镜头语言
- tv_series: 电视剧风格，强化人物关系线索和悬念设置
- stage: 舞台剧风格，强化独白和舞台调度

## 润色要求
1. 保持原有 YAML 结构不变
2. 对白可以调整措辞但不可改变核心意思
3. 可适当添加/调整 stageDirections
4. 输出完整的 YAML，不要省略任何场景

## 原始剧本
{yaml}`;
```

---

## 五、上下文设计

### 上下文传递链

```
NovelAnalysisChain  ─┐
                      ├──► CharacterExtractionChain
                      │      (summary + genre)
                      │
                      ├──► PlotAnalysisChain
                      │      (summary + characters)
                      │
                      ├──► ScenePlanningChain
                      │      (plotAnalysis + characters)
                      │
                      ├──► ScriptGenerationChain
                      │      (scenes + characters + schemaRef)
                      │
                      └──► YamlValidationChain
                             (yaml + schemaRules)
```

### 上下文压缩策略

```ts
// 防止上下文无限增长

function compressContext(
  previousResults: AgentResult[],
  targetTokens: number,
): string {
  // 对前序 Agent 的输出做摘要压缩
  // 例如: 30章小说 → 提取关键人物+情节 → 控制 < 4000 tokens
  let context = "";
  for (const result of previousResults) {
    context += `[${result.agentName}]: ${summarize(result.output)}\n`;
  }
  return truncateToTokens(context, targetTokens);
}
```

### 上下文存储

| 数据        | 存储位置              | 用途            |
| ----------- | --------------------- | --------------- |
| Novel 全文  | MinIO `novels/`       | 原始引用        |
| 分析摘要    | AgentResult.output    | 下游 Chain 输入 |
| 人物列表    | Character 表          | 剧本关联        |
| 场景规划    | Scene 表              | 剧本关联        |
| Schema 规则 | Redis `schema:latest` | YAML 校验       |

---

## 六、模型调用策略

### DeepSeek 配置

```ts
// config/deepseek.ts

import { ChatDeepSeek } from "@langchain/deepseek";

export const deepseekModel = new ChatDeepSeek({
  model: "deepseek-chat", // DeepSeek v2
  temperature: 0.7, // 创意性: 0.7 (生成任务)
  maxTokens: 4096, // 单次输出上限
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
  },
});

// 分析类任务用低温度
export const analysisModel = new ChatDeepSeek({
  model: "deepseek-chat",
  temperature: 0.3, // 提取/分析任务: 0.3 (准确性优先)
  maxTokens: 2048,
  apiKey: process.env.DEEPSEEK_API_KEY,
});
```

### 按任务分策略

| Chain                    | Model           | Temperature | Max Output | 原因           |
| ------------------------ | --------------- | ----------- | ---------- | -------------- |
| NovelAnalysisChain       | `analysisModel` | 0.3         | 2048       | 分析需准确性   |
| CharacterExtractionChain | `analysisModel` | 0.3         | 4096       | 提取需准确性   |
| PlotAnalysisChain        | `analysisModel` | 0.3         | 4096       | 分析需准确性   |
| ScenePlanningChain       | `deepseekModel` | 0.7         | 4096       | 规划需创意性   |
| ScriptGenerationChain    | `deepseekModel` | 0.8         | 8192       | 创作需高创意性 |
| YamlValidationChain      | `analysisModel` | 0.1         | 1024       | 校验需严格性   |
| ScriptPolishChain        | `deepseekModel` | 0.7         | 4096       | 润色需风格适配 |

---

## 七、LangChain Chain 设计

### 7.1 NovelAnalysisChain

```ts
// modules/ai/chains/novel-analysis.chain.ts

import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

const prompt = PromptTemplate.fromTemplate(NOVEL_ANALYSIS_PROMPT);

export const NovelAnalysisChain = RunnableSequence.from([
  prompt,
  analysisModel,
  new StringOutputParser(),
  // 自定义解析器: 尝试 JSON.parse，失败则重试
  new JsonOutputParser({ schema: NovelAnalysisSchema }),
]);
```

### 7.2 CharacterExtractionChain

```ts
const prompt = PromptTemplate.fromTemplate(CHARACTER_EXTRACTION_PROMPT);

export const CharacterExtractionChain = RunnableSequence.from([
  prompt,
  analysisModel,
  new StringOutputParser(),
  new JsonOutputParser({ schema: CharacterArraySchema }),
]);
```

### 7.3 ScriptGenerationChain

````ts
const prompt = PromptTemplate.fromTemplate(SCRIPT_GENERATION_PROMPT);

export const ScriptGenerationChain = RunnableSequence.from([
  prompt,
  deepseekModel,
  new StringOutputParser(),
  // YAML 输出: 提取 ```yaml 代码块或纯文本
  new YamlOutputParser(),
]);
````

### Chain 编排（Agent Pipeline）

```ts
// modules/ai/agent-pipeline.ts

export class AgentPipeline {
  private chains = {
    novelAnalysis: NovelAnalysisChain,
    characterExtraction: CharacterExtractionChain,
    plotAnalysis: PlotAnalysisChain,
    scenePlanning: ScenePlanningChain,
    scriptGeneration: ScriptGenerationChain,
    yamlValidation: YamlValidationChain,
  };

  async run(): Promise<string> {
    // Step 1: 分片分析 (并行)
    const chunkResults = await Promise.all(
      chunks.map((chunk) =>
        this.chains.novelAnalysis.invoke({ text: chunk.text }),
      ),
    );
    const analysisResult = mergeChunkResults(chunkResults);

    // Step 2: 角色提取
    const characterResult = await this.chains.characterExtraction.invoke({
      summary: analysisResult,
      text: fullTextSummary,
    });

    // Step 3: 情节分析
    const plotResult = await this.chains.plotAnalysis.invoke({
      characters: JSON.stringify(characterResult.characters),
      summary: analysisResult,
    });

    // Step 4: 场景规划
    const sceneResult = await this.chains.scenePlanning.invoke({
      plotAnalysis: JSON.stringify(plotResult),
      characters: JSON.stringify(characterResult.characters),
    });

    // Step 5: 剧本生成
    const yamlResult = await this.chains.scriptGeneration.invoke({
      scenes: JSON.stringify(sceneResult.scenes),
      characters: JSON.stringify(characterResult.characters),
      schemaRef: SCHEMA_REFERENCE,
    });

    // Step 6: YAML 校验
    const validationResult = await this.chains.yamlValidation.invoke({
      yaml: yamlResult,
      schemaRules: SCHEMA_RULES,
    });

    if (!validationResult.valid) {
      // 校验失败 → 重试 Step 5
      throw new YamlValidationError(validationResult.errors);
    }

    // Step 7: 写入 DB
    const scriptId = await this.persistResults({
      analysisResult,
      characterResult,
      plotResult,
      sceneResult,
      yamlResult,
    });

    return scriptId;
  }
}
```

---

## 八、输出格式规范

### JSON 输出 (分析/提取类 Chain)

```json
// 所有 JSON 输出必须包裹在 StructuredOutput 中
{
  "success": true,
  "data": {
    /* 具体内容 */
  },
  "metadata": {
    "tokensUsed": 1234,
    "model": "deepseek-chat",
    "duration": 3.2
  }
}
```

### YAML 输出 (生成类 Chain)

```yaml
# 必须符合 Schema 定义
title: string
metadata:
  author: string
  adaptedBy: "AI (DeepSeek)"
  genre: string
  totalScenes: integer
scenes:
  - sceneNumber: integer
    location: string
    time: string
    participants: [string]
    description: string
    dialogues:
      - speaker: string
        text: string
        action: string | null
        emotion: string | null
    stageDirections: [string]
```

### 禁止的输出形式

- ❌ 自然语言自由描述
- ❌ 混合 JSON 和 Markdown
- ❌ 输出中包含 "`json" 或 "`yaml" 代码块标记（由 Parser 处理）

---

## 九、校验机制

### 双层校验

```
Chain 输出 → Parser 层校验 → Schema 层校验 → AI 兜底校验
```

### Parser 层 (代码级)

````ts
class JsonOutputParser<T> {
  async parse(output: string): Promise<T> {
    try {
      // 移除可能的 markdown 代码块包装
      const json = output
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const parsed = JSON.parse(json);

      // Schema 校验
      const result = this.schema.safeParse(parsed);
      if (!result.success) {
        throw new OutputParseError(result.error.issues);
      }
      return result.data as T;
    } catch (err) {
      throw new OutputParseError(`JSON parse failed: ${err.message}`);
    }
  }
}
````

### Schema 层 (Zod)

```ts
import { z } from "zod";

export const NovelAnalysisSchema = z.object({
  genre: z.enum([
    "仙侠",
    "都市",
    "科幻",
    "历史",
    "悬疑",
    "言情",
    "武侠",
    "其他",
  ]),
  subGenre: z.string(),
  themes: z.array(z.string()),
  narrativeStyle: z.enum(["第一人称", "第三人称", "多视角"]),
  toneStyle: z.enum(["严肃", "轻松", "幽默", "悲情", "热血"]),
  events: z.array(
    z.object({
      summary: z.string(),
      importance: z.enum(["major", "minor"]),
    }),
  ),
});
```

### AI 兜底校验 (YamlValidationChain)

当 Parser + Schema 层无法覆盖的语义错误（如角色名拼写错误、场景逻辑跳跃），由 Step 6 的 AI 校验链做最终检查。

---

## 十、重试机制

```ts
interface RetryConfig {
  maxRetries: number;
  backoffMs: number; // 起始延迟
  backoffMultiplier: number; // 退避倍率
  retryableErrors: string[]; // 可重试的错误类型
}

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  backoffMs: 2000,
  backoffMultiplier: 4, // 2s → 8s → 32s
  retryableErrors: [
    "timeout",
    "rate_limit_exceeded",
    "server_error",
    "OutputParseError", // JSON 解析失败可重试
    "YamlValidationError", // YAML 校验失败可重试
  ],
};

async function invokeWithRetry<T>(
  chain: RunnableSequence,
  input: object,
  config: RetryConfig = DEFAULT_RETRY,
): Promise<T> {
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await chain.invoke(input);
    } catch (err) {
      if (attempt === config.maxRetries) throw err;
      if (!config.retryableErrors.some((e) => err.message.includes(e)))
        throw err;

      const delay =
        config.backoffMs * Math.pow(config.backoffMultiplier, attempt - 1);
      console.warn(
        `[Retry ${attempt}/${config.maxRetries}] ${err.message}, waiting ${delay}ms`,
      );
      await sleep(delay);
    }
  }
  throw new Error("Unreachable");
}
```

---

## 十一、缓存设计

### 可缓存项

| 缓存 Key                  | 内容            | TTL  | 原因                     |
| ------------------------- | --------------- | ---- | ------------------------ |
| `ai:analysis:{novelId}`   | 小说分析结果    | 30天 | 同一小说不会频繁重新分析 |
| `ai:characters:{novelId}` | 角色提取结果    | 30天 | 角色列表稳定             |
| `ai:plot:{novelId}`       | 情节分析结果    | 30天 | 情节分析稳定             |
| `ai:schema:latest`        | Schema 规则文本 | 永久 | 版本更新时替换           |

### 缓存策略

```ts
// 写入: AI 结果入库后 → 写 Redis
await redis.set(
  `ai:analysis:${novelId}`,
  JSON.stringify(result),
  "EX",
  2592000,
);

// 读取: 重试(resume)时跳过已完成步骤
const cached = await redis.get(`ai:analysis:${novelId}`);
if (cached && retryMode === "resume") {
  return JSON.parse(cached); // 直接返回缓存，不调用 AI
}
```

---

## 十二、成本优化

### Token 消耗估算（以 30 章/12万字小说为例）

| 步骤                     | 输入 Token | 输出 Token | 调用次数 | 小计 Token   |
| ------------------------ | ---------- | ---------- | -------- | ------------ |
| NovelAnalysis (分片并行) | 8,000      | 1,000      | ~15次    | 135,000      |
| CharacterExtraction      | 6,000      | 2,000      | 1次      | 8,000        |
| PlotAnalysis             | 6,000      | 2,000      | 1次      | 8,000        |
| ScenePlanning            | 6,000      | 3,000      | 1次      | 9,000        |
| ScriptGeneration         | 8,000      | 8,000      | 1次      | 16,000       |
| YamlValidation           | 4,000      | 500        | 1次      | 4,500        |
| **合计**                 |            |            |          | **~180,500** |

### 优化策略

| 策略                 | 节省效果             | 实现方式                          |
| -------------------- | -------------------- | --------------------------------- |
| 分片并行调用         | 耗时 3s×N → 3s       | `Promise.all(chunks.map(invoke))` |
| 中间结果缓存         | 重试时跳过已完成步骤 | Redis `ai:*:{novelId}`            |
| 全文字数限制         | 50万字上限           | 导入时校验                        |
| 低温分析任务         | 减少输出 Token       | temperature=0.3 → 输出更精简      |
| 骤降级（API 不可用） | 不丢失数据           | 队列重试 + DLQ                    |

---

## 十三、错误处理

| 错误类型             | 错误码              | 处理流程                           |
| -------------------- | ------------------- | ---------------------------------- |
| DeepSeek API 超时    | `AI_TIMEOUT`        | 指数退避重试 → 3次后 FAILED        |
| API 返回空响应       | `AI_EMPTY_RESPONSE` | 重试 → 2次后标记 FAILED            |
| JSON 解析失败        | `AI_INVALID_JSON`   | 重试（可能重新生成）→ 3次后 FAILED |
| YAML Schema 校验失败 | `AI_INVALID_YAML`   | 标记 errors[] → 提示用户手动修复   |
| Rate Limit 限流      | `AI_RATE_LIMITED`   | 等待 Retry-After → 重试            |
| Token 超限           | `AI_TOKEN_OVERFLOW` | 减小 Chunk → 重新分片              |

```ts
// 错误映射 + AgentResult 记录
function handleAIError(err: Error, taskId: string, agentName: string): void {
  const errorType = classifyError(err);
  agentResultRepo.update(taskId, agentName, {
    status: "FAILED",
    errorMessage: `${errorType}: ${err.message}`,
    completedAt: new Date(),
  });
}
```

---

## 十四、监控设计

### 指标

| 指标              | 来源               | 告警阈值   |
| ----------------- | ------------------ | ---------- |
| 总调用次数        | LangChain callback | —          |
| Token 消耗 (累计) | DeepSeek API       | > 100万/天 |
| 平均耗时/Chain    | `Date.now()` 差值  | > 120s     |
| 成功率            | AgentResult 表     | < 95%      |
| JSON Parse 失败率 | OutputParser       | > 10%      |
| API 错误率        | DeepSeek HTTP 状态 | > 5%       |

### LangChain Callback

```ts
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";

class MonitoringHandler extends BaseCallbackHandler {
  async handleLLMStart(llm: any, prompts: string[]) {
    metrics.increment("ai.calls");
    metrics.gauge("ai.prompt_tokens", estimateTokens(prompts[0]));
  }

  async handleLLMEnd(output: any) {
    metrics.gauge("ai.output_tokens", estimateTokens(output.text));
    metrics.histogram("ai.duration", Date.now() - this.startTime);
  }

  async handleLLMError(err: Error) {
    metrics.increment("ai.errors");
    logger.error("AI call failed", { error: err.message });
  }
}
```

---

## 十五、风险分析

| 编号     | 风险                                  | 等级      | 缓解措施                                   |
| -------- | ------------------------------------- | --------- | ------------------------------------------ |
| RISK-001 | 分片并行导致 Rate Limit               | 🔴 High   | 控制并发数 (最多5个并行) + 429退避         |
| RISK-002 | AI 输出格式不稳定 (JSON/YAML)         | 🔴 High   | Parser 层重试 + AI 兜底校验 + 人工降级     |
| RISK-003 | 长文本 Token 消耗过高                 | 🟡 Medium | 三级分片 + 摘要压缩 + 50万字上限           |
| RISK-004 | 角色名/地名在 AI 输出中被篡改         | 🟡 Medium | YAML Validation 语义层检查                 |
| RISK-005 | 缓存过期后重复调用 AI 产生不一致      | 🟡 Medium | 版本号 + 摘要对比，差异大时提示用户确认    |
| RISK-006 | Prompt 注入攻击                       | 🟡 Medium | 小说文本 sanitize (过滤 "Ignore previous") |
| RISK-007 | 单次 8000 字 Chunk 可能截断重要上下文 | 🟢 Low    | 200字 overlap + 语义切片                   |
| RISK-008 | 多章节角色跨 Chunk 识别不完整         | 🟢 Low    | CharacterExtraction 使用全文摘要而非分片   |
