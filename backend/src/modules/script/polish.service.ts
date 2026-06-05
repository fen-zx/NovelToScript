import { ScriptRepository } from "@/modules/script/script.repository"
import { VersionRepository } from "@/modules/script/version.repository"
import { Errors } from "@/shared/errors/error-codes"
import { scriptPolishQueue } from "@/shared/queue/queue-manager"
import type { PolishStyle } from "@/shared/dto/request.dto"

export class PolishService {
  constructor(
    private scriptRepo = new ScriptRepository(),
    private versionRepo = new VersionRepository(),
  ) {}

  async polishScript(scriptId: string, style: PolishStyle, targetSection?: string) {
    const script = await this.scriptRepo.findById(scriptId)
    if (!script) throw Errors.scriptNotFound()

    // 入队 script-polish — Worker 调 AI 润色后写新 Version
    const job = await scriptPolishQueue.add("polish", {
      scriptId,
      style,
      targetSection,
      userId: script.userId,
    })

    return { taskId: job.id!, status: "QUEUED" }
  }

  async getPolishResult(jobId: string) {
    const job = await scriptPolishQueue.getJob(jobId)
    if (!job) throw Errors.taskNotFound()
    return {
      status: await job.getState(),
      result: job.returnvalue ?? null,
      error: job.failedReason ?? null,
    }
  }
}
