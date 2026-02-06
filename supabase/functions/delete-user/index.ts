import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the caller is an admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roleData } = await callerClient
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent deleting self
    if (user_id === callerUser.id) {
      return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role client for admin operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check for active trades
    const { data: activeTrades, error: tradesError } = await adminClient
      .from('trades')
      .select('id, symbol, status')
      .eq('user_id', user_id)
      .in('status', ['OPEN', 'PENDING']);

    if (tradesError) {
      return new Response(JSON.stringify({ error: 'Failed to check active trades' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If there are active trades, return warning (don't delete yet)
    if (activeTrades && activeTrades.length > 0) {
      return new Response(JSON.stringify({
        warning: true,
        message: `User has ${activeTrades.length} active trade(s). These must be closed before deletion.`,
        active_trades: activeTrades,
        user_id,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // No active trades - proceed with deletion
    // 1. Delete user scripts
    await adminClient.from('user_scripts').delete().eq('user_id', user_id);
    
    // 2. Delete user's own pine_scripts
    await adminClient.from('pine_scripts').delete().eq('created_by', user_id);
    
    // 3. Delete bot configurations
    await adminClient.from('bot_configurations').delete().eq('user_id', user_id);
    
    // 4. Delete market maker bots
    await adminClient.from('market_maker_bots').delete().eq('user_id', user_id);
    
    // 5. Delete trades
    await adminClient.from('trades').delete().eq('user_id', user_id);
    
    // 6. Delete exchange keys
    await adminClient.from('exchange_keys').delete().eq('user_id', user_id);
    
    // 7. Delete wallets
    await adminClient.from('wallets').delete().eq('user_id', user_id);
    
    // 8. Delete coin audit log
    await adminClient.from('coin_audit_log').delete().eq('user_id', user_id);
    
    // 9. Delete coin requests
    await adminClient.from('coin_requests').delete().eq('user_id', user_id);
    
    // 10. Delete user roles
    await adminClient.from('user_roles').delete().eq('user_id', user_id);
    
    // 11. Delete profile
    await adminClient.from('profiles').delete().eq('user_id', user_id);
    
    // 12. Delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
    if (deleteError) {
      return new Response(JSON.stringify({ error: `Failed to delete user: ${deleteError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'User account deleted successfully' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
