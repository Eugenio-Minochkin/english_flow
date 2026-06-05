export type TelegramMiniAppAuthResult = {
  telegramId: bigint;
  username?: string;
};

export function validateTelegramMiniAppInitData(_initData: string, _botToken: string): TelegramMiniAppAuthResult {
  throw new Error("Telegram Mini App initData validation is planned for a later milestone.");
}
