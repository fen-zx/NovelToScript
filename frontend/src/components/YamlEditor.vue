<!-- YAML Monaco Editor 组件 -->
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, shallowRef } from "vue";
import * as monaco from "monaco-editor";

const props = defineProps<{
  modelValue: string;
  readOnly?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const container = ref<HTMLElement>();
let editor: monaco.editor.IStandaloneCodeEditor | null = null;
const editorMounted = shallowRef(false);

// 配置 YAML 语言
monaco.languages.setLanguageConfiguration("yaml", {
  autoClosingPairs: [
    { open: '"', close: '"' },
    { open: "'", close: "'" },
    { open: "[", close: "]" },
  ],
});

onMounted(() => {
  if (!container.value) return;

  editor = monaco.editor.create(container.value, {
    value: props.modelValue,
    language: "yaml",
    theme: "vs-dark",
    fontSize: 14,
    lineNumbers: "on",
    minimap: { enabled: false },
    wordWrap: "on",
    automaticLayout: true,
    scrollBeyondLastLine: false,
    tabSize: 2,
    readOnly: props.readOnly,
    bracketPairColorization: { enabled: true },
    guides: { indentation: true, bracketPairs: true },
  });

  // 内容变更
  editor.onDidChangeModelContent(() => {
    const value = editor?.getValue() ?? "";
    emit("update:modelValue", value);
  });

  editorMounted.value = true;
});

onUnmounted(() => {
  editor?.dispose();
});

// 外部 modelValue 变更时同步到编辑器
watch(
  () => props.modelValue,
  (newVal) => {
    if (editor && editor.getValue() !== newVal) {
      editor.setValue(newVal);
    }
  },
);

// 暴露方法供父组件调用
defineExpose({
  getEditor: () => editor,
  focus: () => editor?.focus(),
});
</script>

<template>
  <div ref="container" class="monaco-container" />
</template>

<style scoped>
.monaco-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
