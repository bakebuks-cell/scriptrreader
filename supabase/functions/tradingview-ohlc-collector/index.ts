// TradingView OHLC Collector Webhook
// Receives candle-close OHLC data from TradingView alerts and stores raw payloads
// for later Heikin Ashi conversion analysis.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SHARED_SECRET = "tv_ohlc_2026_simti_collector_x9k2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const rawText = await req.text();
    let payload: any;
    try {
      payload = JSON.parse(rawText);
    } catch {
      return json({ error: "Invalid JSON body", received: rawText.slice(0, 500) }, 400);
    }

    // Auth via shared secret in payload
    if (payload.secret !== SHARED_SECRET) {
      return json({ error: "Unauthorized: missing or invalid secret" }, 401);
    }

    // Required fields
    const required = ["symbol", "timeframe", "candle_time", "open", "high", "low", "close"];
    const missing = required.filter((k) => payload[k] === undefined || payload[k] === null);
    if (missing.length > 0) {
      return json({ error: `Missing required fields: ${missing.join(", ")}` }, 400);
    }

    // Normalize candle_time → ISO string
    let candleTimeIso: string;
    const ct = payload.candle_time;
    if (typeof ct === "number") {
      // assume ms epoch (TradingView {{time}} is ms)
      candleTimeIso = new Date(ct).toISOString();
    } else if (typeof ct === "string") {
      const asNum = Number(ct);
      candleTimeIso = !isNaN(asNum) && asNum > 1_000_000_000_000
        ? new Date(asNum).toISOString()
        : new Date(ct).toISOString();
    } else {
      return json({ error: "candle_time must be a number (ms) or ISO string" }, 400);
    }

    if (isNaN(new Date(candleTimeIso).getTime())) {
      return json({ error: "Invalid candle_time" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const row = {
      symbol: String(payload.symbol).toUpperCase(),
      timeframe: String(payload.timeframe),
      candle_time: candleTimeIso,
      open: Number(payload.open),
      high: Number(payload.high),
      low: Number(payload.low),
      close: Number(payload.close),
      volume: payload.volume !== undefined ? Number(payload.volume) : null,
      candle_type: payload.candle_type ? String(payload.candle_type) : "regular",
      source: payload.source ? String(payload.source) : "tradingview_webhook",
      raw_payload: payload,
    };

    // Validate numeric fields
    for (const k of ["open", "high", "low", "close"] as const) {
      if (isNaN(row[k])) {
        return json({ error: `${k} must be a valid number` }, 400);
      }
    }

    const { error } = await supabase
      .from("tradingview_ohlc_collection")
      .upsert(row, { onConflict: "symbol,timeframe,candle_time,candle_type" });

    if (error) {
      console.error("DB insert error:", error);
      return json({ error: "Database insert failed", details: error.message }, 500);
    }

    return json({
      ok: true,
      stored: {
        symbol: row.symbol,
        timeframe: row.timeframe,
        candle_time: row.candle_time,
        candle_type: row.candle_type,
      },
    });
  } catch (err) {
    console.error("Handler error:", err);
    return json({ error: (err as Error).message ?? "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
