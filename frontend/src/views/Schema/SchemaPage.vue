<!-- P6 YAML Schema 文档页 -->
<script setup lang="ts">
import { ref, computed } from "vue";

const showExample = ref(false);
const showRationale = ref(true);
const searchQuery = ref("");

const fieldRows = [
  {
    field: "title",
    type: "string",
    required: true,
    desc: "剧本标题，从原文提炼",
  },
  {
    field: "metadata.author",
    type: "string",
    required: false,
    desc: '原作者，未知填"未知"',
  },
  {
    field: "metadata.adaptedBy",
    type: "string",
    required: false,
    desc: '改编者，AI生成填"AI"',
  },
  {
    field: "metadata.genre",
    type: "enum",
    required: false,
    desc: "类型：仙侠|都市|科幻|历史|悬疑|言情|武侠|奇幻|军事|游戏|体育|轻小说|其他",
  },
  {
    field: "metadata.subGenre",
    type: "string",
    required: false,
    desc: "子类型，如修真、星际、宫斗",
  },
  {
    field: "metadata.totalScenes",
    type: "integer",
    required: true,
    desc: "场景总数，须等于scenes数组长度",
  },
  {
    field: "metadata.language",
    type: "string",
    required: false,
    desc: "语言，默认zh-CN",
  },
  {
    field: "characters[].name",
    type: "string",
    required: true,
    desc: "角色名，须在原文有明确依据",
  },
  {
    field: "characters[].role",
    type: "enum",
    required: true,
    desc: "PROTAGONIST|ANTAGONIST|SUPPORTING|MINOR",
  },
  {
    field: "characters[].description",
    type: "string",
    required: false,
    desc: "50-100字外貌性格描述",
  },
  {
    field: "characters[].traits",
    type: "string[]",
    required: false,
    desc: '性格特征标签，如["勇敢","冲动"]',
  },
  {
    field: "characters[].motivation",
    type: "string",
    required: false,
    desc: "角色核心动机，30字内",
  },
  {
    field: "characters[].relationships[].with",
    type: "string",
    required: true,
    desc: "关系对象角色名",
  },
  {
    field: "characters[].relationships[].type",
    type: "string",
    required: true,
    desc: "师徒|挚友|恋人|敌对|父子等",
  },
  {
    field: "scenes[].sceneNumber",
    type: "integer",
    required: true,
    desc: "场景序号，从1递增不重复",
  },
  {
    field: "scenes[].location",
    type: "string",
    required: true,
    desc: "场景地点",
  },
  {
    field: "scenes[].time",
    type: "string",
    required: false,
    desc: "时间描述，如清晨、三日后",
  },
  {
    field: "scenes[].participants",
    type: "string[]",
    required: false,
    desc: "出场角色名，须在characters中存在",
  },
  {
    field: "scenes[].description",
    type: "string",
    required: false,
    desc: "环境描述，50-150字",
  },
  {
    field: "scenes[].mood",
    type: "enum",
    required: false,
    desc: "紧张|温馨|悲伤|欢乐|悬疑|平静|激烈|恐惧|庄严",
  },
  {
    field: "scenes[].dialogues[].speaker",
    type: "string",
    required: true,
    desc: "说话人，须在characters中存在",
  },
  {
    field: "scenes[].dialogues[].text",
    type: "string",
    required: true,
    desc: "对白文本，尽量从原文提取",
  },
  {
    field: "scenes[].dialogues[].action",
    type: "string",
    required: false,
    desc: "同步动作描述，如拔剑、转身",
  },
  {
    field: "scenes[].dialogues[].emotion",
    type: "enum",
    required: false,
    desc: "平静|愤怒|悲伤|喜悦|恐惧|惊讶|轻蔑|坚定|犹豫|温柔|讽刺|无奈",
  },
  {
    field: "scenes[].stageDirections",
    type: "string[]",
    required: false,
    desc: "舞台/镜头指示，一条一调度单元",
  },
];

const filteredRows = computed(() =>
  fieldRows.filter((r) => r.field.includes(searchQuery.value)),
);
</script>

<template>
  <div class="schema-page">
    <h2>📐 YAML Schema <el-tag type="primary" size="small">v1.0.0</el-tag></h2>

    <!-- Schema Tree -->
    <el-card class="mb16">
      <h3>Schema 结构</h3>
      <pre class="tree">
script
 ├─ title                string  (剧本标题)
 ├─ metadata             object  (元数据)
 │   ├─ author             string
 │   ├─ adaptedBy          string
 │   ├─ genre              enum
 │   ├─ subGenre           string
 │   ├─ totalScenes        integer
 │   └─ language           string
 ├─ characters           array   (角色列表)
 │   └─ [*]
 │       ├─ name            string
 │       ├─ role            enum
 │       ├─ description     string
 │       ├─ traits          string[]
 │       ├─ motivation      string
 │       └─ relationships   array
 │           ├─ with          string
 │           └─ type          string
 └─ scenes               array   (场景列表)
     └─ [*]
         ├─ sceneNumber      integer
         ├─ location         string
         ├─ time             string
         ├─ participants     string[]
         ├─ description      string
         ├─ mood             enum
         ├─ dialogues        array
         │   └─ [*]
         │       ├─ speaker    string
         │       ├─ text       string
         │       ├─ action     string
         │       └─ emotion    enum
         └─ stageDirections  string[]</pre
      >
    </el-card>

    <!-- Field Table -->
    <el-card class="mb16">
      <div class="section-header">
        <h3>📋 字段说明</h3>
        <el-input
          v-model="searchQuery"
          placeholder="搜索字段..."
          size="small"
          style="width: 200px"
          clearable
        />
      </div>
      <el-table :data="filteredRows" size="small" stripe>
        <el-table-column prop="field" label="字段" />
        <el-table-column prop="type" label="类型" width="80" />
        <el-table-column label="必填" width="60">
          <template #default="{ row }"
            ><el-tag :type="row.required ? 'success' : 'info'" size="small">{{
              row.required ? "✅" : "—"
            }}</el-tag></template
          >
        </el-table-column>
        <el-table-column prop="desc" label="说明" />
      </el-table>
    </el-card>

    <!-- Rationale -->
    <el-card class="mb16">
      <h3 class="collapse-hdr" @click="showRationale = !showRationale">
        💡 设计原因 {{ showRationale ? "▲" : "▼" }}
      </h3>
      <div v-if="showRationale">
        <p>
          <b>YAML 而非 JSON:</b> 编剧可直接手改，支持注释，多行文本优雅，行级
          diff 友好。
        </p>
        <p class="mt8">
          <b>characters 前置:</b> 遵循 Dramatis Personae 传统，对白 speaker
          引用角色表，独立编辑人物不伤正文。
        </p>
        <p class="mt8">
          <b>场景为核心单元:</b> scene = 同一时间+地点，影视行业标准，AI
          分片自然边界。
        </p>
        <p class="mt8">
          <b>action + emotion:</b> 动作与对白同步绑定，为 AI 润色和 TTS
          渲染提供语义信息。
        </p>
        <p class="mt8">
          <b>12 emotion 枚举:</b> 覆盖普拉切克情感轮核心维度，防 AI 标注不一致。
        </p>
        <p class="mt8">
          <b>SemVer 版本策略:</b>
          MAJOR删字段、MINOR增必填、PATCH增可选，旧剧本向前兼容。
        </p>
      </div>
    </el-card>

    <!-- Example -->
    <el-card>
      <h3 class="collapse-hdr" @click="showExample = !showExample">
        📄 示例剧本 {{ showExample ? "▲" : "▼" }}
      </h3>
      <div v-if="showExample">
        <pre class="example-code">
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
  - name: 纳兰嫣然
    role: ANTAGONIST
    description: 云岚宗天才弟子
    traits: ["骄傲", "天赋异禀"]
  - name: 药老
    role: SUPPORTING
    description: 寄居戒指中的神秘灵魂体
    traits: ["睿智", "神秘"]
scenes:
  - sceneNumber: 1
    location: 萧家练武场
    time: 清晨
    participants: ["萧炎"]
    description: 晨雾未散，萧炎独立场中挥动重尺
    mood: 平静
    dialogues:
      - speaker: 药老
        text: 小家伙，三年之约将至，可准备好了？
        emotion: 平静
      - speaker: 萧炎
        text: 弟子日夜苦修，断不敢忘。
        action: 握紧拳头
        emotion: 坚定
    stageDirections:
      - "萧炎挥动重尺，每一次挥击都带起风声"
      - "远处鸡鸣响起，天色渐明"</pre
        >
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.schema-page {
  width: 100%;
}
.mb16 {
  margin-bottom: 16px;
}
.mt8 {
  margin-top: 8px;
}
.tree {
  font-family: Consolas, monospace;
  font-size: 13px;
  line-height: 1.8;
  white-space: pre;
  background: rgba(0, 0, 0, 0.02);
  padding: 12px;
  border-radius: 8px;
}
.collapse-hdr {
  cursor: pointer;
  user-select: none;
}
.example-code {
  background: rgba(0, 0, 0, 0.02);
  padding: 12px;
  border-radius: 8px;
  font-family: Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #909399;
}
</style>
