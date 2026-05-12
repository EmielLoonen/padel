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
  <title>PadelScore — ${code}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      background: #08080d;
      color: #f0f0f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #waiting {
      width: 1920px;
      height: 1080px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      color: #444;
      font-size: 36px;
    }
    #waiting .code { color: #fff; font-weight: 700; font-size: 52px; letter-spacing: .2em; }
    #board {
      width: 1920px;
      height: 1080px;
      display: none;
      flex-direction: column;
    }

    /* ── Top bar ── */
    .topbar {
      height: 88px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 80px;
      border-bottom: 1px solid #161620;
    }
    .court-code {
      font-size: 26px;
      font-weight: 600;
      color: #333;
      letter-spacing: .25em;
      text-transform: uppercase;
    }
    .status-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 24px;
      color: #444;
    }
    .status-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #4ade80;
      animation: pulse 2s ease-in-out infinite;
    }
    .status-dot.offline { background: #f87171; animation: none; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }

    /* ── Team names ── */
    .teams {
      height: 156px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 100px;
    }
    .team-name {
      font-size: 68px;
      font-weight: 700;
      letter-spacing: .02em;
      line-height: 1;
    }
    .serve-dot {
      display: inline-block;
      width: 20px;
      height: 20px;
      background: #4ade80;
      border-radius: 50%;
      margin-right: 14px;
      vertical-align: middle;
      position: relative;
      top: -4px;
    }

    /* ── Game score (dominant) ── */
    .game-row {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 60px;
    }
    .game-score {
      font-size: 360px;
      font-weight: 900;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      min-width: 460px;
      text-align: center;
    }
    .game-dash { font-size: 140px; color: #222; line-height: 1; }
    .game-label {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      font-size: 22px;
      font-weight: 600;
      color: #333;
      letter-spacing: .2em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .game-wrap { position: relative; padding-bottom: 36px; }

    /* ── Set score ── */
    .set-row {
      height: 216px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 48px;
      border-top: 1px solid #161620;
    }
    .set-score {
      font-size: 156px;
      font-weight: 800;
      line-height: 1;
      color: #bbb;
      font-variant-numeric: tabular-nums;
      min-width: 200px;
      text-align: center;
    }
    .set-dash { font-size: 80px; color: #222; line-height: 1; }
    .set-label {
      font-size: 20px;
      font-weight: 600;
      color: #2a2a3a;
      letter-spacing: .2em;
      text-transform: uppercase;
      margin: 0 32px;
      align-self: center;
    }

    /* ── Footer: completed sets / winner ── */
    .footer {
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 48px;
      border-top: 1px solid #161620;
    }
    .set-chip {
      font-size: 28px;
      font-weight: 600;
      color: #2a2a3a;
      letter-spacing: .05em;
    }
    .set-chip.w1 { color: #4ade80; }
    .set-chip.w2 { color: #f87171; }
    .winner-text {
      font-size: 32px;
      font-weight: 700;
      color: #4ade80;
      letter-spacing: .05em;
    }
  </style>
</head>
<body>
  <div id="waiting">
    <div>Waiting for score...</div>
    <div class="code">${code}</div>
  </div>

  <div id="board">
    <div class="topbar">
      <span class="court-code">${code}</span>
      <div class="status-bar">
        <div class="status-dot" id="status-dot"></div>
        <span id="status-text">Live</span>
      </div>
    </div>

    <div class="teams">
      <div class="team-name" id="team1-name">—</div>
      <div class="team-name" id="team2-name">—</div>
    </div>

    <div class="game-row">
      <div class="game-wrap">
        <div class="game-score" id="game-t1">0</div>
        <div class="game-label" id="game-label">Game</div>
      </div>
      <div class="game-dash">–</div>
      <div class="game-wrap">
        <div class="game-score" id="game-t2">0</div>
      </div>
    </div>

    <div class="set-row">
      <div class="set-score" id="set-t1">0</div>
      <div class="set-label">Set</div>
      <div class="set-dash">–</div>
      <div class="set-label">Set</div>
      <div class="set-score" id="set-t2">0</div>
    </div>

    <div class="footer" id="footer"></div>
  </div>

  <script>
    const CODE = '${code}';

    function updateDisplay(data) {
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

      const footer = document.getElementById('footer');
      if (data.isCompleted && data.winner) {
        const winnerName = data.winner === 1 ? t1.replace(/<[^>]+>/g, '') : t2.replace(/<[^>]+>/g, '');
        footer.innerHTML = '<span class="winner-text">Match completed — ' + winnerName + ' wins</span>';
      } else {
        const completedSets = (data.sets || []).filter(s => s.winner !== null);
        footer.innerHTML = completedSets.map((s, i) => {
          const cls = s.winner === 1 ? 'w1' : s.winner === 2 ? 'w2' : '';
          return '<span class="set-chip ' + cls + '">Set ' + (i + 1) + ': ' + s.team1Games + '–' + s.team2Games + '</span>';
        }).join('');
      }

      document.getElementById('waiting').style.display = 'none';
      document.getElementById('board').style.display = 'flex';
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
      es.addEventListener('score', (e) => { setStatus(true); updateDisplay(JSON.parse(e.data)); });
      es.onerror = () => { es.close(); startPolling(); };
    }

    connect();
  </script>
</body>
</html>`;
}

export default router;
