import { ScriptRepository } from "./script.repository"
import { VersionRepository } from "./version.repository"
import { CharacterRepository } from "./character.repository"
import { Errors } from "@/shared/errors/error-codes"

export class ScriptService {
  constructor(
    private scriptRepo = new ScriptRepository(),
    private versionRepo = new VersionRepository(),
    private characterRepo = new CharacterRepository(),
  ) {}

  async getScriptById(scriptId: string) {
    const script = await this.scriptRepo.findByIdWithDetail(scriptId)
    if (!script) throw Errors.scriptNotFound()

    const latestVersion = script.versions[0]
    const characters = script.characters

    return {
      id: script.id, userId: script.userId, novelId: script.novelId,
      title: script.title, currentVersion: script.currentVersion,
      content: latestVersion?.content ?? "",
      characters: characters.map(c => ({
        id: c.id, name: c.name, role: c.role,
        description: c.description, traits: c.traits ? JSON.parse(c.traits) : null,
      })),
      createdAt: script.createdAt.toISOString(),
      updatedAt: script.updatedAt.toISOString(),
    }
  }

  async updateScript(scriptId: string, content: string, note?: string) {
    const script = await this.scriptRepo.findById(scriptId)
    if (!script) throw Errors.scriptNotFound()

    const nextVersion = await this.versionRepo.getNextVersionNumber(scriptId)

    await this.versionRepo.create({ scriptId, versionNumber: nextVersion, content, note })
    await this.scriptRepo.update(scriptId, { currentVersion: nextVersion })

    return { id: scriptId, currentVersion: nextVersion, updatedAt: new Date().toISOString() }
  }

  async rollbackScript(scriptId: string, targetVersion: number) {
    const version = await this.versionRepo.findByScriptIdAndNumber(scriptId, targetVersion)
    if (!version) throw Errors.versionNotFound()

    const nextVersion = await this.versionRepo.getNextVersionNumber(scriptId)

    await this.versionRepo.create({
      scriptId, versionNumber: nextVersion,
      content: version.content, note: `回滚到 v${targetVersion}`,
    })
    await this.scriptRepo.update(scriptId, { currentVersion: nextVersion })

    return { id: scriptId, currentVersion: nextVersion }
  }

  async deleteScript(scriptId: string) {
    const script = await this.scriptRepo.findById(scriptId)
    if (!script) throw Errors.scriptNotFound()
    await this.scriptRepo.softDelete(scriptId)
  }
}
