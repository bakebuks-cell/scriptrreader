import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Primary: Binance Global, Fallback: Binance US (for geo-restricted regions)
const BINANCE_APIS = [
  "https://api.binance.com/api/v3",
  "https://api.binance.us/api/v3",
  "https://api1.binance.com/api/v3",
  "https://api2.binance.com/api/v3",
  "https://api3.binance.com/api/v3",
];

async function fetchWithFallback(symbol: string): Promise<any | null> {
  for (const baseUrl of BINANCE_APIS) {
    try {
      const response = await fetch(`${baseUrl}/ticker/24hr?symbol=${symbol.toUpperCase()}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (response.ok) {
        return await response.json();
      }
      console.log(`${baseUrl} returned ${response.status} for ${symbol}`);
    } catch (e) {
      console.log(`${baseUrl} failed for ${symbol}:`, e);
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols, mode = "polling" } = await req.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: "symbols array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use REST API polling mode with fallback endpoints
    if (mode === "polling") {
      const tickerPromises = symbols.map((symbol: string) => fetchWithFallback(symbol));

      const results = await Promise.all(tickerPromises);
      const tickers = results.filter(r => r !== null).map((data: any) => ({
        symbol: data.symbol,
        lastPrice: parseFloat(data.lastPrice),
        bidPrice: parseFloat(data.bidPrice),
        askPrice: parseFloat(data.askPrice),
        priceChange: parseFloat(data.priceChange),
        priceChangePercent: parseFloat(data.priceChangePercent),
        highPrice: parseFloat(data.highPrice),
        lowPrice: parseFloat(data.lowPrice),
        volume: parseFloat(data.volume),
        quoteVolume: parseFloat(data.quoteVolume),
      }));

      return new Response(
        JSON.stringify({ tickers, timestamp: Date.now() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SSE streaming mode with REST polling
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        let isActive = true;
        
        const sendData = (data: any) => {
          if (isActive) {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            } catch {
              isActive = false;
            }
          }
        };

        // Send initial connected message
        sendData({ type: "connected" });

        // Poll every 2 seconds
        const poll = async () => {
          if (!isActive) return;

          try {
            const tickerPromises = symbols.map(async (symbol: string) => {
              const result = await fetchWithFallback(symbol);
              if (!result) return null;
              const data = result;
              return {
                e: '24hrTicker',
                s: data.symbol,
                c: data.lastPrice,
                b: data.bidPrice,
                a: data.askPrice,
                p: data.priceChange,
                P: data.priceChangePercent,
                h: data.highPrice,
                l: data.lowPrice,
                v: data.volume,
                q: data.quoteVolume,
              };
            });

            const results = await Promise.all(tickerPromises);
            for (const data of results) {
              if (data) {
                sendData({ type: "ticker", data });
              }
            }
          } catch (e) {
            console.error("Poll error:", e);
            sendData({ type: "error", message: "Failed to fetch ticker data" });
          }

          // Schedule next poll
          if (isActive) {
            setTimeout(poll, 2000);
          }
        };

        // Start polling
        poll();

        // Keep stream alive for up to 5 minutes
        setTimeout(() => {
          isActive = false;
          try {
            sendData({ type: "closed", code: 0 });
            controller.close();
          } catch {
            // Stream already closed
          }
        }, 5 * 60 * 1000);
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
