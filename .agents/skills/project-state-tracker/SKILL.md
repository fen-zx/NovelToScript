---
name: project-state-tracker
description: "跟踪项目整体状态，包括页面完成度、组件完成度、接口完成度、原型完成度和迭代进度。生成项目状态报告，支持多轮迭代追踪。"
argument-hint: "[项目状态 JSON]"
user-invocable: true
---

# 项目状态追踪器（ProjectStateTracker）

## 目标

实时跟踪项目的各类完成度和进度，生成可视化/可读性报告，为团队提供统一项目状态参考。

## 何时使用

* 每次迭代结束后
* 页面/组件/API/原型完成后
* 项目例会汇报
* 长期项目多轮迭代追踪

## 输入格式

JSON 示例：

```json
{
  "pages": {
    "用户管理": "完成",
    "订单管理": "进行中"
  },
  "components": {
    "UserTable": "完成",
    "SearchForm": "完成",
    "EditModal": "进行中"
  },
  "apis": {
    "GET /api/users": "完成",
    "PUT /api/users/{id}": "未开始"
  },
  "prototype": {
    "用户管理": "完成",
    "订单管理": "进行中"
  },
  "iteration": 2,
  "last_update": "2026-06-04"
}
```

状态可选值：`未开始` / `进行中` / `完成`

## 输出格式

Markdown

```markdown
# 项目状态报告 - 第2轮迭代 (2026-06-04)

## 页面完成度

- 用户管理: 完成
- 订单管理: 进行中

## 组件完成度

- UserTable: 完成
- SearchForm: 完成
- EditModal: 进行中

## API完成度

- GET /api/users: 完成
- PUT /api/users/{id}: 未开始

## 原型完成度

- 用户管理: 完成
- 订单管理: 进行中
```

## 工作步骤

1. 接收最新状态 JSON
2. 对页面/组件/API/原型分别统计完成度
3. 输出 Markdown 状态报告
4. 可按迭代轮次或日期记录历史状态
5. 支持与 ChangeLog 和 Decision Recorder 联动

## 强制要求

* 必须包含各类完成度统计
* 输出迭代号与最后更新时间
* 不得遗漏任何项目模块
 and examples