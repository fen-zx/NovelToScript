import { NovelRepository } from "./novel.repository"
import { Errors } from "@/shared/errors/error-codes"
import { storagePaths, minioClient } from "@/shared/storage/minio"
import { FILE_LIMITS } from "@/shared/dto/request.dto"

export class NovelService {
  constructor(private novelRepo = new NovelRepository()) {}

  async importNovel(
    userId: string,
    file: Express.Multer.File | undefined,
    title: string,
    author?: string,
  ) {
    if (!file) throw Errors.validation("请上传文件")

    // 校验文件
    if (file.size > FILE_LIMITS.maxSize) throw Errors.fileTooLarge()
    const ext = file.originalname.split(".").pop()?.toLowerCase()
    if (!ext || !FILE_LIMITS.allowedExtensions.includes(`.${ext}` as any)) {
      throw Errors.fileFormatUnsupported()
    }

    // 章节识别 + 字数统计 [TODO] ChapterDetector
    const chapterCount = 3 // placeholder
    const wordCount = file.buffer.toString("utf-8").length

    // 创建 Novel (先写 DB 获取 novelId)
    const novel = await this.novelRepo.create({
      userId,
      title,
      author,
      chapterCount,
      wordCount,
      fileFormat: ext.toUpperCase() as any,
    })

    // 上传 MinIO
    const key = storagePaths.novel(userId, novel.id, ext)
    await minioClient.putObject("novels", key, file.buffer, file.size, {
      "Content-Type": file.mimetype,
    })

    // 更新 filePath
    // [TODO] NovelRepository needs update method or store filePath at create time
    return {
      id: novel.id, title: novel.title, author: novel.author ?? null,
      chapterCount: novel.chapterCount, wordCount: novel.wordCount,
      fileFormat: novel.fileFormat, createdAt: novel.createdAt.toISOString(),
    }
  }
}
