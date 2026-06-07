<!-- P5 剧本编辑页 -->
<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { scriptApi } from "@/api/scripts";
import YamlEditor from "@/components/YamlEditor.vue";
import type { ScriptDetail, VersionSummary } from "@/types/script";

const route = useRoute();
const id = route.params.id as string;

const content = ref("");
const title = ref("");
const currentVersion = ref(1);
const saveStatus = ref<"saved" | "unsaved" | "saving">("saved");
const loading = ref(true);
const error = ref("");

// Preview
const viewMode = ref<"split" | "editor" | "preview">("split");

// Export
const exportVisible = ref(false);
const exportFormat = ref("yaml");

// Polish
const polishVisible = ref(false);
const polishStyle = ref("faithful");
const polishing = ref(false);

// Version history
const versionsVisible = ref(false);
const versions = ref<VersionSummary[]>([]);
const loadingVersions = ref(false);

// Schema validation (simplified)
const validationErrors = ref<
  { line: number; field: string; message: string }[]
>([]);

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let lastSavedContent = "";

onMounted(async () => {
  try {
    const res = await scriptApi.getById(id);
    content.value = res.data.content;
    lastSavedContent = res.data.content;
    title.value = res.data.title;
    currentVersion.value = res.data.currentVersion;
  } catch {
    error.value = "加载失败";
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  if (saveTimer) clearTimeout(saveTimer);
});

// 自动保存：内容变更后 2 秒触发
watch(content, (newVal) => {
  if (newVal === lastSavedContent) return;
  saveStatus.value = "unsaved";
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    saveStatus.value = "saving";
    try {
      const res = await scriptApi.update(id, { content: newVal });
      currentVersion.value = res.data.currentVersion;
      lastSavedContent = newVal;
      saveStatus.value = "saved";
    } catch {
      saveStatus.value = "unsaved";
    }
  }, 2000);
});

async function handleSave() {
  saveStatus.value = "saving";
  try {
    const res = await scriptApi.update(id, { content: content.value });
    currentVersion.value = res.data.currentVersion;
    lastSavedContent = content.value;
    saveStatus.value = "saved";
    ElMessage.success("保存成功");
  } catch {
    ElMessage.error("保存失败");
  }
}

const exportFileName = ref("");

function openExport() {
  exportFileName.value = `${title.value}_剧本_v${currentVersion.value}`;
  exportVisible.value = true;
}

async function handleExport() {
  try {
    const format = exportFormat.value as import("@/types/api").ExportFormat;
    const res = await scriptApi.export(id, format);
    // blob 响应直接下载
    const url = URL.createObjectURL(res as unknown as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName.value}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    exportVisible.value = false;
    ElMessage.success("导出成功");
  } catch {
    // 降级：客户端Blob导出
    const ext = exportFormat.value;
    const blob = new Blob([content.value], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${exportFileName.value}.${ext}`;
    a.click();
    exportVisible.value = false;
  }
}

async function handlePolish() {
  try {
    await scriptApi.polish(id, {
      style: polishStyle.value as import("@/types/api").PolishStyle,
    });
    ElMessage.success("润色任务已入队，等待中...");
    polishVisible.value = false;
    polishing.value = true;

    // 轮询等待新版本生成
    const targetVersion = currentVersion.value + 1;
    const poll = setInterval(async () => {
      try {
        const res = await scriptApi.getById(id);
        if (res.data.currentVersion >= targetVersion) {
          clearInterval(poll);
          content.value = res.data.content;
          currentVersion.value = res.data.currentVersion;
          polishing.value = false;
          ElMessage.success("润色完成！");
          await loadVersions();
        }
      } catch {
        /* retry */
      }
    }, 3000);

    // 超时 5 分钟
    setTimeout(() => {
      clearInterval(poll);
      if (polishing.value) {
        polishing.value = false;
        ElMessage.warning("润色超时，请刷新查看");
      }
    }, 300000);
  } catch {
    ElMessage.error("润色失败");
  }
}

async function loadVersions() {
  loadingVersions.value = true;
  try {
    const res = await scriptApi.getVersions(id);
    versions.value = res.data;
  } finally {
    loadingVersions.value = false;
  }
}

async function handleRollback(v: number) {
  try {
    await scriptApi.rollback(id, v);
    const res = await scriptApi.getById(id);
    content.value = res.data.content;
    currentVersion.value = res.data.currentVersion;
    ElMessage.success(`已回滚到 v${v}`);
    versionsVisible.value = false;
  } catch {
    ElMessage.error("回滚失败");
  }
}

// Simple markdown preview
function yamlToPreview(yaml: string): string {
  return yaml
    .replace(/^title:\s*(.+)$/gm, "# $1")
    .replace(/scenes:/g, "")
    .replace(/^\s*- scene:\s*(\d+)/gm, "## 第$1场")
    .replace(/^\s*location:\s*(.+)$/gm, "**地点:** $1")
    .replace(/^\s*time:\s*(.+)$/gm, "**时间:** $1")
    .replace(/^\s*characters:/gm, "**人物:** ")
    .replace(/^\s*-\s+(.+)$/gm, "$1")
    .replace(/dialogues:/g, "")
    .replace(/^\s*speaker:\s*(.+)$/gm, "**$1:** ")
    .replace(/^\s*text:\s*(.+)$/gm, "$1");
}
</script>

<template>
  <div class="editor-page">
    <div v-if="loading" v-loading="loading" style="min-height: 400px" />
    <div v-else-if="error" class="empty-state">
      <p>{{ error }}</p>
    </div>

    <template v-else>
      <div class="toolbar">
        <div class="toolbar-left">
          <h3>✏️ {{ title }}</h3>
          <el-tag
            :type="saveStatus === 'saved' ? 'success' : 'warning'"
            size="small"
          >
            {{
              saveStatus === "saved"
                ? "💾已保存"
                : saveStatus === "saving"
                  ? "⏳保存中"
                  : "🟡未保存"
            }}
          </el-tag>
          <span class="version">v{{ currentVersion }}</span>
        </div>
        <div class="toolbar-center">
          <el-radio-group v-model="viewMode">
            <el-radio-button value="split">◐ 分屏</el-radio-button>
            <el-radio-button value="editor">📝 仅编辑</el-radio-button>
            <el-radio-button value="preview">📖 仅预览</el-radio-button>
          </el-radio-group>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="handleSave">💾 保存</el-button>
          <el-button @click="openExport">📤 导出</el-button>
          <el-dropdown>
            <el-button>✨ 润色 ▼</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  @click="
                    polishStyle = 'faithful';
                    polishVisible = true;
                  "
                  >原著还原</el-dropdown-item
                >
                <el-dropdown-item
                  @click="
                    polishStyle = 'tv_drama';
                    polishVisible = true;
                  "
                  >影视剧风格</el-dropdown-item
                >
                <el-dropdown-item
                  @click="
                    polishStyle = 'movie';
                    polishVisible = true;
                  "
                  >电影风格</el-dropdown-item
                >
                <el-dropdown-item
                  @click="
                    polishStyle = 'anime';
                    polishVisible = true;
                  "
                  >动漫风格</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button
            @click="
              versionsVisible = true;
              loadVersions();
            "
            >📜 历史</el-button
          >
        </div>
      </div>

      <div class="editor-area" :class="viewMode">
        <div v-if="viewMode !== 'preview'" class="editor-pane">
          <YamlEditor v-model="content" />
        </div>
        <div v-if="viewMode !== 'editor'" class="preview-pane">
          <div
            class="preview-content"
            v-html="yamlToPreview(content).replace(/\n/g, '<br>')"
          />
        </div>
      </div>
    </template>

    <!-- Export Dialog -->
    <el-dialog v-model="exportVisible" title="导出剧本" width="400px">
      <el-form label-width="80px">
        <el-form-item label="文件名">
          <el-input v-model="exportFileName" placeholder="请输入文件名" />
        </el-form-item>
        <el-form-item label="格式">
          <el-radio-group v-model="exportFormat">
            <el-radio value="yaml">YAML</el-radio>
            <el-radio value="json">JSON</el-radio>
            <el-radio value="md">MD</el-radio>
            <el-radio value="txt">TXT</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportVisible = false">取消</el-button>
        <el-button type="primary" @click="handleExport">下载</el-button>
      </template>
    </el-dialog>

    <!-- Polish Dialog -->
    <el-dialog v-model="polishVisible" title="确认润色" width="360px">
      <p>将对整个剧本进行 AI 润色，确认？</p>
      <template #footer
        ><el-button @click="handlePolish" type="primary"
          >确认</el-button
        ></template
      >
    </el-dialog>

    <!-- Version Dialog -->
    <el-dialog v-model="versionsVisible" title="版本历史" width="500px">
      <el-table :data="versions" v-loading="loadingVersions" size="small">
        <el-table-column prop="versionNumber" label="版本" width="60" />
        <el-table-column prop="note" label="备注" />
        <el-table-column label="时间" width="160">
          <template #default="{ row }">{{
            new Date(row.createdAt).toLocaleString()
          }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }"
            ><el-button
              text
              type="primary"
              size="small"
              @click="handleRollback(row.versionNumber)"
              >回滚</el-button
            ></template
          >
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<style scoped>
.editor-page {
  height: calc(100vh - clamp(80px, 7vh, 100px));
  width: 100%;
  display: flex;
  flex-direction: column;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar-right {
  display: flex;
  gap: 4px;
}
.version {
  font-size: 12px;
  color: #909399;
}
.editor-area {
  flex: 1;
  display: flex;
  gap: 8px;
  overflow: hidden;
  min-height: 0;
}
.editor-area.split .editor-pane,
.editor-area.split .preview-pane {
  flex: 1;
  overflow: auto;
  min-width: 0;
}
.editor-area.editor .editor-pane {
  flex: 1;
  overflow: auto;
}
.editor-area.editor .preview-pane,
.editor-area.preview .editor-pane {
  display: none;
}
.editor-area.preview .preview-pane {
  flex: 1;
  overflow: auto;
}
.editor-pane {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
.yaml-editor {
  flex: 1;
  font-family: Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  min-height: 0;
}
.yaml-editor :deep(textarea) {
  font-family: Consolas, monospace !important;
  height: 100% !important;
  resize: none;
  min-height: 100%;
}
.preview-pane {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 16px;
}
.preview-content {
  line-height: 1.8;
}
.empty-state {
  text-align: center;
  padding: 100px 0;
  color: #909399;
}
</style>
