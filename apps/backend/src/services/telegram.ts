const TELEGRAM_API = 'https://api.telegram.org/bot'

export async function sendMessage(
  botToken: string,
  chatId: string,
  text: string,
  parseMode: 'Markdown' | 'HTML' = 'Markdown'
): Promise<boolean> {
  const res = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  })
  return res.ok
}

export async function setWebhook(
  botToken: string,
  url: string,
  secretToken: string
): Promise<boolean> {
  const res = await fetch(`${TELEGRAM_API}${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, secret_token: secretToken }),
  })
  return res.ok
}
