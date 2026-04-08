const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twitch';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const TWITCH_API_KEY = Deno.env.get('TWITCH_API_KEY');
  if (!TWITCH_API_KEY) {
    return new Response(JSON.stringify({ error: 'TWITCH_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const BROADCASTER_ID = Deno.env.get('TWITCH_BROADCASTER_ID');
  if (!BROADCASTER_ID) {
    return new Response(JSON.stringify({ error: 'TWITCH_BROADCASTER_ID not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const gatewayHeaders = {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'X-Connection-Api-Key': TWITCH_API_KEY,
    'Content-Type': 'application/json',
  };

  try {
    if (req.method === 'POST') {
      const body = await req.json();
      const matches: Array<{ round_index: number; match_index?: number }> = body.matches;
      const duration: number = body.duration ?? 120;

      if (!matches || !Array.isArray(matches) || matches.length < 2 || matches.length > 5) {
        return new Response(JSON.stringify({ error: 'matches must be an array of 2-5 items' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const choices = matches.map(m => ({
        title: `Runda ${m.round_index} Mecz ${m.match_index ?? '?'}`,
      }));

      const pollPayload = {
        broadcaster_id: BROADCASTER_ID,
        title: 'Który mecz chcesz obejrzeć na streamie?',
        choices,
        duration,
      };

      console.log('Creating poll:', JSON.stringify(pollPayload));

      const res = await fetch(`${GATEWAY_URL}/polls`, {
        method: 'POST',
        headers: gatewayHeaders,
        body: JSON.stringify(pollPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Twitch API error:', JSON.stringify(data));
        return new Response(JSON.stringify({ error: `Twitch API error [${res.status}]`, details: data }), {
          status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const poll = data.data?.[0];
      return new Response(JSON.stringify({ poll_id: poll?.id, status: poll?.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const pollId = url.searchParams.get('poll_id');

      if (!pollId) {
        return new Response(JSON.stringify({ error: 'poll_id query param required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch(
        `${GATEWAY_URL}/polls?broadcaster_id=${BROADCASTER_ID}&id=${pollId}`,
        { method: 'GET', headers: gatewayHeaders },
      );

      const data = await res.json();
      if (!res.ok) {
        console.error('Twitch API error:', JSON.stringify(data));
        return new Response(JSON.stringify({ error: `Twitch API error [${res.status}]`, details: data }), {
          status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const poll = data.data?.[0];
      if (!poll) {
        return new Response(JSON.stringify({ error: 'Poll not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const totalVotes = poll.choices.reduce((sum: number, c: { votes: number }) => sum + (c.votes ?? 0), 0);
      const results: Record<string, number> = {};
      for (const choice of poll.choices) {
        const pct = totalVotes > 0 ? Math.round(((choice.votes ?? 0) / totalVotes) * 100) : 0;
        results[choice.title] = pct;
      }

      return new Response(JSON.stringify({
        poll_id: poll.id,
        status: poll.status,
        results,
        total_votes: totalVotes,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Edge function error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
