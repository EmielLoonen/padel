import express, { Request, Response } from 'express';

const router = express.Router();

const TTL_MS = 24 * 60 * 60 * 1000;

interface LiveScore {
  courtCode: string;
  timestamp: string;
  players: { A?: string; B?: string; C?: string; D?: string };
  servingPlayer: string | null;
  servingTeam: number | null;
  game: { team1Points: string; team2Points: string; isTiebreak: boolean };
  tiebreak: { team1: number; team2: number } | null;
  currentSet: { team1Games: number; team2Games: number; isTiebreak: boolean };
  sets: Array<{ team1Games: number; team2Games: number; winner: number | null }>;
  matchScore: { team1Sets: number; team2Sets: number };
  team1Side: string;
  isCompleted: boolean;
  winner: number | null;
}

interface ScoreEntry {
  score: LiveScore;
  updatedAt: Date;
}

const scoreStore = new Map<string, ScoreEntry>();
const sseClients = new Map<string, Set<Response>>();

function getValidEntry(code: string): ScoreEntry | null {
  const entry = scoreStore.get(code);
  if (!entry) return null;
  if (Date.now() - entry.updatedAt.getTime() > TTL_MS) {
    scoreStore.delete(code);
    return null;
  }
  return entry;
}

// POST /courts/:code/score — primary watch pushes score after every point
router.post('/:code/score', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const score: LiveScore = { ...req.body, courtCode: code };
  const entry: ScoreEntry = { score, updatedAt: new Date() };

  scoreStore.set(code, entry);

  const clients = sseClients.get(code);
  if (clients && clients.size > 0) {
    const payload = JSON.stringify({ ...score, updatedAt: entry.updatedAt.toISOString() });
    clients.forEach((client) => {
      client.write(`event: score\ndata: ${payload}\n\n`);
    });
  }

  res.json({ ok: true });
});

// GET /courts/:code/score — secondary watches / web page poll for latest state
router.get('/:code/score', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const entry = getValidEntry(code);

  if (!entry) {
    return res.status(404).json({ error: 'No score found for this court code' });
  }

  res.json({ ...entry.score, updatedAt: entry.updatedAt.toISOString() });
});

// GET /courts/:code/score/stream — SSE endpoint for instant updates
router.get('/:code/score/stream', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send current score immediately so the client doesn't wait for the next push
  const entry = getValidEntry(code);
  if (entry) {
    const payload = JSON.stringify({ ...entry.score, updatedAt: entry.updatedAt.toISOString() });
    res.write(`event: score\ndata: ${payload}\n\n`);
  }

  if (!sseClients.has(code)) sseClients.set(code, new Set());
  sseClients.get(code)!.add(res);

  req.on('close', () => {
    const clients = sseClients.get(code);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) sseClients.delete(code);
    }
  });
});

// GET /courts/:code — browser-accessible HTML scoreboard
router.get('/:code', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  res.setHeader('Content-Type', 'text/html');
  res.send(buildScoreboardHtml(code));
});

function buildScoreboardHtml(code: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PadelScore — ${code}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0f1117;
      color: #f0f0f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    #waiting {
      text-align: center;
      color: #888;
      font-size: 1.1rem;
    }
    #waiting .code { color: #fff; font-weight: 700; font-size: 1.4rem; margin-top: .5rem; }
    #scoreboard { width: 100%; max-width: 520px; display: none; flex-direction: column; gap: 1.5rem; }
    .teams-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: .5rem;
      text-align: center;
    }
    .team { display: flex; flex-direction: column; align-items: center; gap: .25rem; }
    .team-name {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: .03em;
    }
    .team-label { font-size: .7rem; color: #888; text-transform: uppercase; letter-spacing: .1em; }
    .serve-dot {
      display: inline-block;
      width: .6rem;
      height: .6rem;
      background: #4ade80;
      border-radius: 50%;
      margin-right: .35rem;
      vertical-align: middle;
    }
    .divider { color: #555; font-size: 1.1rem; }
    .score-block {
      background: #1a1d27;
      border-radius: 1rem;
      padding: 1.25rem 1rem;
    }
    .score-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      text-align: center;
      gap: .5rem;
    }
    .score-value { font-size: 3.5rem; font-weight: 800; line-height: 1; }
    .score-dash { color: #555; font-size: 1.5rem; }
    .score-label {
      text-align: center;
      font-size: .7rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: .1em;
      margin-top: .5rem;
    }
    .sets-row {
      display: flex;
      gap: .75rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    .set-chip {
      background: #1a1d27;
      border-radius: .5rem;
      padding: .4rem .9rem;
      font-size: .9rem;
      font-weight: 600;
      color: #ccc;
      position: relative;
    }
    .set-chip.winner1 { color: #4ade80; }
    .set-chip.winner2 { color: #f87171; }
    .completed-banner {
      background: #1a1d27;
      border-radius: 1rem;
      padding: 1rem 1.5rem;
      text-align: center;
      font-size: 1.1rem;
      font-weight: 600;
      color: #4ade80;
    }
    .status-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .4rem;
      font-size: .75rem;
      color: #555;
    }
    .status-dot {
      width: .5rem;
      height: .5rem;
      border-radius: 50%;
      background: #4ade80;
      animation: pulse 2s ease-in-out infinite;
    }
    .status-dot.offline { background: #f87171; animation: none; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .3; }
    }
  </style>
</head>
<body>
  <div id="waiting">
    <div>Waiting for score...</div>
    <div class="code">${code}</div>
  </div>

  <div id="scoreboard">
    <div class="teams-row">
      <div class="team">
        <div class="team-name" id="team1-name">—</div>
        <div class="team-label">Team 1</div>
      </div>
      <div class="divider">vs</div>
      <div class="team">
        <div class="team-name" id="team2-name">—</div>
        <div class="team-label">Team 2</div>
      </div>
    </div>

    <div class="score-block">
      <div class="score-row">
        <div class="score-value" id="game-t1">0</div>
        <div class="score-dash">–</div>
        <div class="score-value" id="game-t2">0</div>
      </div>
      <div class="score-label" id="game-label">Game</div>
    </div>

    <div class="score-block">
      <div class="score-row">
        <div class="score-value" id="set-t1" style="font-size:2.5rem">0</div>
        <div class="score-dash">–</div>
        <div class="score-value" id="set-t2" style="font-size:2.5rem">0</div>
      </div>
      <div class="score-label">Current Set</div>
    </div>

    <div class="sets-row" id="sets-row"></div>

    <div class="completed-banner" id="completed-banner" style="display:none"></div>

    <div class="status-bar">
      <div class="status-dot" id="status-dot"></div>
      <span id="status-text">Live</span>
    </div>
  </div>

  <script>
    const CODE = '${code}';
    let lastUpdate = null;

    function updateDisplay(data) {
      lastUpdate = data.updatedAt;

      const p = data.players || {};
      const sp = data.servingPlayer;
      const dot = '<span class="serve-dot"></span>';

      function pn(key) {
        const name = p[key];
        if (!name) return null;
        return (sp === key ? dot : '') + name;
      }

      const t1 = [pn('A'), pn('B')].filter(Boolean).join(' / ') || '—';
      const t2 = [pn('C'), pn('D')].filter(Boolean).join(' / ') || '—';

      document.getElementById('team1-name').innerHTML = t1;
      document.getElementById('team2-name').innerHTML = t2;

      const isTB = data.currentSet && data.currentSet.isTiebreak;
      if (isTB && data.tiebreak) {
        document.getElementById('game-t1').textContent = data.tiebreak.team1;
        document.getElementById('game-t2').textContent = data.tiebreak.team2;
        document.getElementById('game-label').textContent = 'Tiebreak';
      } else if (data.game) {
        document.getElementById('game-t1').textContent = data.game.team1Points;
        document.getElementById('game-t2').textContent = data.game.team2Points;
        document.getElementById('game-label').textContent = 'Game';
      }

      if (data.currentSet) {
        document.getElementById('set-t1').textContent = data.currentSet.team1Games;
        document.getElementById('set-t2').textContent = data.currentSet.team2Games;
      }

      const setsRow = document.getElementById('sets-row');
      const completedSets = (data.sets || []).filter(s => s.winner !== null);
      setsRow.innerHTML = completedSets.map((s, i) => {
        const cls = s.winner === 1 ? 'winner1' : s.winner === 2 ? 'winner2' : '';
        return '<div class="set-chip ' + cls + '">Set ' + (i + 1) + ': ' + s.team1Games + '–' + s.team2Games + '</div>';
      }).join('');

      const banner = document.getElementById('completed-banner');
      if (data.isCompleted && data.winner) {
        const winnerName = data.winner === 1 ? t1 : t2;
        banner.textContent = 'Match completed — ' + winnerName + ' wins';
        banner.style.display = 'block';
      } else {
        banner.style.display = 'none';
      }

      document.getElementById('waiting').style.display = 'none';
      document.getElementById('scoreboard').style.display = 'flex';
    }

    function setStatus(live) {
      document.getElementById('status-dot').className = 'status-dot' + (live ? '' : ' offline');
      document.getElementById('status-text').textContent = live ? 'Live' : 'Reconnecting...';
    }

    function startPolling() {
      setStatus(false);
      setInterval(async () => {
        try {
          const res = await fetch('/courts/' + CODE + '/score');
          if (res.ok) { setStatus(true); updateDisplay(await res.json()); }
          else setStatus(false);
        } catch { setStatus(false); }
      }, 2000);
    }

    function connect() {
      if (!window.EventSource) { startPolling(); return; }

      const es = new EventSource('/courts/' + CODE + '/score/stream');

      es.addEventListener('score', (e) => {
        setStatus(true);
        updateDisplay(JSON.parse(e.data));
      });

      es.onerror = () => {
        es.close();
        startPolling();
      };
    }

    connect();
  </script>
</body>
</html>`;
}

export default router;
