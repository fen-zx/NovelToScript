---

name: context-updater
description: "任务完成后，自动更新项目上下文文档，包括决策记录、变更日志、项目状态、组件状态、接口状态和任务完成情况，保证多轮迭代项目记忆保持最新。"
argument-hint: "[任务完成信息 / JSON]"
user-invocable: true
--------------------

# 上下文写回器（ContextUpdater）

## 目标

在任务完成后，自动更新：

* DECISIONS.md
* CHANGELOG.md
* PROJECT_STATE.md
* TASKS.md
* PAGE_SPECS.md
* COMPONENTS.md
* API_SPECS.md

确保 ContextManager 获取的上下文总是最新。

---

## 何时使用

* 页面开发完成后
* 组件完成或修改后
* API对接完成后
* 低保真原型完成后
* 决策、变更或迭代任务完成后

---

## 输入格式

JSON 示例：

```json id="w9v1xz"
{
  "task": "为用户管理页面增加批量删除功能",
  "status": "完成",
  "modified_components": ["UserTable", "UserActions"],
  "modified_pages": ["用户管理"],
  "modified_apis": ["DELETE /api/users/batch"],
  "new_decisions": [
    {
      "decision": "批量删除接口使用事务",
      "context": "保证数据一致性",
      "options": ["不使用事务", "前端批量", "服务端事务"],
      "chosen_option": "服务端事务",
      "reason": "保证数据一致性",
      "author": "王五",
      "date": "2026-06-04"
    }
  ],
  "change_description": [
    "UserTable增加多选框和批量删除按钮",
    "新增DELETE /api/users/batch接口"
  ],
  "author": "王五",
  "date": "2026-06-04"
}
```

---

## 输出格式

Markdown，更新对应文档。例如：

### CHANGELOG.md

```markdown id="4v1kzq"
## 2026-06-04

### 用户管理页面 (修改)
- UserTable增加多选框和批量删除按钮
- 新增DELETE /api/users/batch接口
- 作者: 王五
```

### DECISIONS.md

```markdown id="a3lzv1"
## 2026-06-04

### 批量删除接口使用事务

- 背景: 保证数据一致性
- 可选方案: 不使用事务 / 前端批量 / 服务端事务
- 最终选择: 服务端事务
- 理由: 保证数据一致性
- 作者: 王五
```

### PROJECT_STATE.md

```markdown id="9t0vbr"
# 项目状态报告 - 第3轮迭代 (2026-06-04)

## 页面完成度
- 用户管理: 完成

## 组件完成度
- UserTable: 完成
- UserActions: 完成

## API完成度
- DELETE /api/users/batch: 完成
```

### TASKS.md

```markdown id="m4p9zs"
## 已完成任务
- 为用户管理页面增加批量删除功能 (2026-06-04, 作者: 王五)
```

---

## 工作步骤

1. 接收任务完成 JSON
2. 更新 CHANGELOG.md（按日期追加修改记录）
3. 更新 DECISIONS.md（记录新决策）
4. 更新 PROJECT_STATE.md（更新页面、组件、接口状态）
5. 更新 TASKS.md（标记任务完成）
6. 更新 PAGE_SPECS.md / COMPONENTS.md / API_SPECS.md（如有新增或修改）
7. 输出更新确认摘要

---

## 强制要求

* 所有文档必须同步更新
* 不得遗漏任务相关模块
* 必须记录作者和日期
* 每次更新都要保证 ContextManager 获取的上下文与文档一致

---

## 风险提示

* 避免覆盖未关联的旧任务
* 避免冲突决策覆盖历史记录
* 避免状态更新错误导致重复开发
