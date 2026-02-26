import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const CHANNEL_ID = "@lovewithtrade_channel";
const CHANNEL_URL = "https://t.me/lovewithtrade_channel";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function isInChannel(userId: number): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API}/getChatMember`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHANNEL_ID, user_id: userId }),
    });
    const data = await res.json();
    return data.ok && ["member", "administrator", "creator"].includes(data.result?.status);
  } catch {
    return false;
  }
}

async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      ...(replyMarkup && { reply_markup: replyMarkup }),
    }),
  });
}

async function editMessage(chatId: number, messageId: number, text: string, replyMarkup?: any) {
  await fetch(`${TELEGRAM_API}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "Markdown",
      ...(replyMarkup && { reply_markup: replyMarkup }),
    }),
  });
}

const joinButton = {
  inline_keyboard: [[{ text: "🔴 JOIN CHANNEL", url: CHANNEL_URL }]],
};

const rejoinButton = {
  inline_keyboard: [[{ text: "🔴 REJOIN CHANNEL", url: CHANNEL_URL }]],
};

async function sendJoinPrompt(chatId: number, text = "❌ You must join our channel to use this bot!") {
  await sendMessage(chatId, text, joinButton);
}

async function handleStart(chatId: number, userId: number) {
  if (await isInChannel(userId)) {
    await sendMessage(chatId,
      "🚀 *Welcome to Love With Trade Bot!*\n\n" +
      "Commands:\n" +
      "/trade - Trading Menu\n" +
      "/help - Help"
    );
  } else {
    await sendJoinPrompt(chatId);
  }
}

async function handleTrade(chatId: number, userId: number) {
  if (!(await isInChannel(userId))) {
    await sendJoinPrompt(chatId, "❌ Join channel first to trade!");
    return;
  }
  const keyboard = {
    inline_keyboard: [
      [
        { text: "🟢 BUY", callback_data: "buy" },
        { text: "🔴 SELL", callback_data: "sell" },
      ],
    ],
  };
  await sendMessage(chatId, "📊 *Trading Menu*", keyboard);
}

async function handleHelp(chatId: number, userId: number) {
  if (!(await isInChannel(userId))) {
    await sendJoinPrompt(chatId);
    return;
  }
  await sendMessage(chatId,
    "*Commands:*\n" +
    "/start - Welcome\n" +
    "/trade - Trading\n" +
    "/help - Help"
  );
}

async function handleCallback(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  // Answer callback to remove loading state
  await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQuery.id }),
  });

  if (!(await isInChannel(userId))) {
    await editMessage(chatId, messageId, "❌ You left the channel! Join again.", rejoinButton);
    return;
  }

  if (data === "buy") {
    await editMessage(chatId, messageId, "🟢 Buy option selected");
  } else if (data === "sell") {
    await editMessage(chatId, messageId, "🔴 Sell option selected");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // GET request = set webhook
  if (req.method === "GET") {
    const url = new URL(req.url);
    const webhookUrl = `${url.origin}/telegram-bot`;
    const res = await fetch(`${TELEGRAM_API}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    });
    const data = await res.json();
    return new Response(JSON.stringify({ webhook_set: true, ...data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // POST request = handle Telegram update
  try {
    const update = await req.json();

    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const userId = update.message.from.id;
      const text = update.message.text;

      if (text === "/start" || text.startsWith("/start ")) {
        await handleStart(chatId, userId);
      } else if (text === "/trade") {
        await handleTrade(chatId, userId);
      } else if (text === "/help") {
        await handleHelp(chatId, userId);
      } else {
        // Any other message: check channel membership
        if (!(await isInChannel(userId))) {
          await sendJoinPrompt(chatId);
        }
      }
    } else if (update.callback_query) {
      await handleCallback(update.callback_query);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing update:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
