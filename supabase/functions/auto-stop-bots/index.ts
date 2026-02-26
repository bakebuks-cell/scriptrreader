import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find active bots whose auto_stop_at has passed
    const { data: expiredBots, error: fetchError } = await supabase
      .from('market_maker_bots')
      .select('id, name, user_id')
      .eq('is_active', true)
      .not('auto_stop_at', 'is', null)
      .lte('auto_stop_at', new Date().toISOString());

    if (fetchError) throw fetchError;

    if (!expiredBots || expiredBots.length === 0) {
      return new Response(JSON.stringify({ message: 'No bots to stop' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deactivate each expired bot
    const ids = expiredBots.map(b => b.id);
    const { error: updateError } = await supabase
      .from('market_maker_bots')
      .update({ is_active: false })
      .in('id', ids);

    if (updateError) throw updateError;

    console.log(`Auto-stopped ${ids.length} bot(s):`, ids);

    return new Response(
      JSON.stringify({ stopped: ids.length, bot_ids: ids }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Auto-stop error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
