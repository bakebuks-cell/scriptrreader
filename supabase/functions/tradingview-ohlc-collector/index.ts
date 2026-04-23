// TradingView OHLC Collector Webhook
// Responds instantly to TradingView (avoids 3s timeout) and processes in background.

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

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const rawText = await req.text();

  // Fire-and-forget background processing — respond to TradingView immediately
  const processingPromise = (async () => {
    try {
      let payload: any;
      try {
        payload = JSON.parse(rawText);
      } catch {
        console.error("Invalid JSON:", rawText.slice(0, 500));
        return;
      }

      if (payload.secret !== SHARED_SECRET) {
        console.error("Unauthorized: invalid secret");
        return;
      }

      const required = ["symbol", "timeframe", "candle_time", "open", "high", "low", "close"];
      const missing = required.filter((k) => payload[k] === undefined || payload[k] === null || payload[k] === "");
      if (missing.length > 0) {
        console.error("Missing fields:", missing.join(", "), "payload:", payload);
        return;
      }

      // Normalize candle_time → ISO string
      let candleTimeIso: string;
      const ct = payload.candle_time;
      if (typeof ct === "number") {
        candleTimeIso = new Date(ct).toISOString();
      } else if (typeof ct === "string") {
        const asNum = Number(ct);
        if (!isNaN(asNum) && asNum > 1_000_000_000_000) {
          candleTimeIso = new Date(asNum).toISOString();
        } else {
          // ISO string from TradingView like "2026-04-23T20:45:00Z"
          const d = new Date(ct);
          if (isNaN(d.getTime())) {
            console.error("Invalid candle_time string:", ct);
            return;
          }
          candleTimeIso = d.toISOString();
        }
      } else {
        console.error("candle_time must be number or string, got:", typeof ct);
        return;
      }

      const row = {
        symbol: String(payload.symbol).toUpperCase(),
        timeframe: String(payload.timeframe),
        candle_time: candleTimeIso,
        open: Number(payload.open),
        high: Number(payload.high),
        low: Number(payload.low),
        close: Number(payload.close),
        volume: payload.volume !== undefined && payload.volume !== "" ? Number(payload.volume) : null,
        candle_type: payload.candle_type ? String(payload.candle_type) : "regular",
        source: payload.source ? String(payload.source) : "tradingview_webhook",
        raw_payload: payload,
      };

      for (const k of ["open", "high", "low", "close"] as const) {
        if (isNaN(row[k])) {
          console.error(`${k} is NaN, value:`, payload[k]);
          return;
        }
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      const { error } = await supabase
        .from("tradingview_ohlc_collection")
        .upsert(row, { onConflict: "symbol,timeframe,candle_time,candle_type" });

      if (error) {
        console.error("DB upsert error:", error.message, "row:", row);
      } else {
        console.log("Stored:", row.symbol, row.timeframe, row.candle_type, row.candle_time);
      }
    } catch (err) {
      console.error("Background processing error:", (err as Error).message);
    }
  })();

  // @ts-ignore - EdgeRuntime is available in Supabase edge runtime
  if (typeof EdgeRuntime !== "undefined") {
    // @ts-ignore
    EdgeRuntime.waitUntil(processingPromise);
  }

  // Respond instantly so TradingView never times out
  return new Response(JSON.stringify({ ok: true, received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
