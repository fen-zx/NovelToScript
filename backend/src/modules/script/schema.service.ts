export class SchemaService {
  private schemaCache: { version: string; data: any } | null = null

  async getSchema() {
    if (this.schemaCache) return this.schemaCache.data

    // [TODO] 从配置文件或 DB 加载
    this.schemaCache = {
      version: "1.0.0",
      data: {
        version: "1.0.0",
        fields: [
          { key: "title", type: "string", required: true, description: "剧本标题" },
          { key: "metadata", type: "object", required: true, description: "元数据", children: [
            { key: "author", type: "string", required: false, description: "原作者" },
            { key: "adaptedBy", type: "string", required: false, description: "改编者" },
            { key: "genre", type: "string", required: false, description: "类型" },
            { key: "totalScenes", type: "integer", required: true, description: "场景总数" },
          ]},
          { key: "scenes", type: "array", required: true, description: "场景列表", children: [
            { key: "sceneNumber", type: "integer", required: true, description: "场景序号" },
            { key: "location", type: "string", required: true, description: "场景地点" },
            { key: "time", type: "string", required: false, description: "场景时间" },
            { key: "participants", type: "array", required: false, description: "参与者" },
            { key: "description", type: "string", required: false, description: "场景环境描述" },
            { key: "dialogues", type: "array", required: true, description: "对白列表", children: [
              { key: "speaker", type: "string", required: true, description: "说话人" },
              { key: "text", type: "string", required: true, description: "对白内容" },
              { key: "action", type: "string", required: false, description: "动作描述" },
              { key: "emotion", type: "string", required: false, description: "情感标注" },
            ]},
            { key: "stageDirections", type: "array", required: false, description: "舞台/镜头指示" },
          ]},
        ],
        example: `title: 斗破苍穹
metadata:
  author: 天蚕土豆
  adaptedBy: AI
  genre: 仙侠
  totalScenes: 1
scenes:
  - sceneNumber: 1
    location: 萧家练武场
    time: 清晨
    participants: [萧炎, 纳兰嫣然]
    description: 练武场上晨雾未散
    dialogues:
      - speaker: 萧炎
        text: 三年之约，我来了。
        emotion: 坚毅`,
        rationale: "YAML 格式兼顾可读性和结构化。scenes 为核心单元，dialogues 和 stageDirections 为可选扩展。participants 和 emotion 等字段为 AI 润色和导出渲染提供语义信息。",
      },
    }

    return this.schemaCache.data
  }
}
