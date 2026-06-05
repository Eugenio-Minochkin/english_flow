import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import type { Bot } from "grammy";

export class TelegramFileService {
  constructor(
    private readonly bot: Bot,
    private readonly tempDir = join(process.cwd(), "tmp", "telegram-audio")
  ) {}

  async downloadFile(fileId: string): Promise<string> {
    const file = await this.bot.api.getFile(fileId);
    if (!file.file_path) throw new Error("Telegram file path is missing.");
    const url = `https://api.telegram.org/file/bot${this.bot.token}/${file.file_path}`;
    const targetPath = join(this.tempDir, `${fileId.replace(/[^a-zA-Z0-9_-]/g, "_")}.oga`);
    await mkdir(dirname(targetPath), { recursive: true });
    const response = await fetch(url);
    if (!response.ok || !response.body) throw new Error(`Telegram file download failed: ${response.status}`);
    await pipeline(response.body, createWriteStream(targetPath));
    return targetPath;
  }
}
