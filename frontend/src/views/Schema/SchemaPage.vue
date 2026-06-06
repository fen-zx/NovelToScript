<!-- P6 YAML Schema 文档页 -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { schemaApi } from "@/api/schema";

const schema = ref<{
  version: string;
  schema: Record<string, unknown>;
  designRationale: string;
  example: string;
} | null>(null);
const loading = ref(true);
const error = ref("");
const showExample = ref(false);
const showRationale = ref(true);
const searchQuery = ref("");

onMounted(async () => {
  try {
    const res = await schemaApi.get();
    schema.value = res.data;
  } catch {
    error.value = "加载失败";
  } finally {
    loading.value = false;
  }
});

const fieldRows = [
  { field: "meta.title", type: "string", required: true, desc: "剧本标题" },
  { field: "meta.author", type: "string", required: false, desc: "原作者" },
  { field: "meta.source", type: "string", required: false, desc: "原著小说名" },
  { field: "scenes[].id", type: "int", required: true, desc: "场景序号" },
  {
    field: "scenes[].location",
    type: "string",
    required: true,
    desc: "场景地点",
  },
  { field: "scenes[].time", type: "string", required: false, desc: "场景时间" },
  {
    field: "scenes[].characters",
    type: "string[]",
    required: false,
    desc: "参与者列表",
  },
  {
    field: "dialogues[].speaker",
    type: "string",
    required: true,
    desc: "说话人",
  },
  {
    field: "dialogues[].text",
    type: "string",
    required: true,
    desc: "对白文本",
  },
  {
    field: "extensions",
    type: "object",
    required: false,
    desc: "作者自定义扩展区",
  },
  { field: "version", type: "string", required: true, desc: "Schema 版本号" },
];

const filteredRows = computed(() =>
  fieldRows.filter((r) => r.field.includes(searchQuery.value)),
);
</script>

<script lang="ts">
import { computed } from "vue";
</script>

<template>
  <div class="schema-page">
    <h2>📐 YAML Schema <el-tag type="primary" size="small">v1.0.0</el-tag></h2>

    <div v-if="loading" v-loading="loading" style="min-height: 200px" />
    <div v-else-if="error" class="empty-state">{{ error }}</div>

    <template v-else>
      <!-- Schema Tree -->
      <el-card class="mb16">
        <h3>Schema 结构</h3>
        <pre class="tree">
script
 ├─ meta               (元数据)
 │   ├─ title            string
 │   ├─ author           string
 │   └─ source           string
 ├─ characters         (人物列表)
 │   └─ [*]
 │       ├─ name          string
 │       ├─ role          enum
 │       └─ desc          string
 ├─ scenes             (场景列表)
 │   └─ [*]
 │       ├─ id            int
 │       ├─ location      string
 │       ├─ time          string
 │       ├─ characters    []
 │       └─ dialogues     []
 ├─ extensions         (扩展区)
 └─ version              string</pre
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
            <b>多版本共存:</b> Schema 通过 version
            字段管理版本，旧版本剧本不受新 Schema 影响。
          </p>
          <p class="mt8">
            <b>extensions 扩展区:</b> 在 script
            根节点预留，作者可注入自定义属性。
          </p>
        </div>
      </el-card>

      <!-- Example -->
      <el-card>
        <h3 class="collapse-hdr" @click="showExample = !showExample">
          📄 示例剧本 {{ showExample ? "▲" : "▼" }}
        </h3>
        <div v-if="showExample">
          <pre class="example-code">{{
            schema?.example || "script:\n  meta:\n    title: 斗破苍穹\n  ..."
          }}</pre>
        </div>
      </el-card>
    </template>
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
