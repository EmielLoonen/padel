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
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #08080d;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* ── Waiting ── */
    #waiting {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2vh;
      font-size: 3vh;
      color: #fff;
    }
    #waiting .code { font-size: 6vh; font-weight: 700; letter-spacing: .2em; }

    /* ── Board ── */
    #board {
      width: 100%;
      height: 100%;
      display: none;
      flex-direction: column;
      position: relative;
    }

    /* ── Game section: 75% ── */
    .game-section {
      height: 75%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      padding-bottom: 1vh;
    }
    .teams-above {
      display: flex;
      width: 100%;
      padding: 0 3vw;
      gap: 2vw;
      margin-bottom: 1vh;
    }
    .teams-above .team-name { flex: 1; text-align: center; }
    .teams-above .teams-spacer { flex-shrink: 0; width: 20vh; }
    .team-name {
      font-size: 17vh;
      font-weight: 700;
      color: #fff;
      letter-spacing: .02em;
      line-height: 1;
    }
    .serve-dot {
      display: inline-block;
      width: 7vh;
      height: 7vh;
      background: #4ade80;
      border-radius: 50%;
      margin-right: 2vh;
      vertical-align: middle;
      position: relative;
      top: -1vh;
    }
    .game-row {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 0 3vw;
      gap: 2vw;
    }
    .game-score {
      flex: 1;
      font-size: 50vh;
      font-weight: 900;
      line-height: 1;
      color: #fff;
      font-variant-numeric: tabular-nums;
      text-align: center;
    }
    .game-dash {
      font-size: 20vh;
      color: #fff;
      line-height: 1;
      flex-shrink: 0;
    }
    .game-label {
      font-size: 1.8vh;
      font-weight: 600;
      color: #fff;
      letter-spacing: .2em;
      text-transform: uppercase;
      text-align: center;
      margin-top: .5vh;
    }

    /* ── Set section: 25% ── */
    .set-section {
      height: 25%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2vw;
      border-top: 1px solid #1a1a2a;
      position: relative;
    }
    .set-score {
      flex: 1;
      font-size: 20vh;
      font-weight: 800;
      line-height: 1;
      color: #fff;
      font-variant-numeric: tabular-nums;
      text-align: center;
      padding: 0 3vw;
    }
    .set-dash {
      font-size: 7vh;
      color: #fff;
      line-height: 1;
      flex-shrink: 0;
    }

    /* ── Overlaid info ── */
    .corner-tl {
      position: absolute;
      top: 1.5vh;
      left: 2vw;
      font-size: 1.6vh;
      font-weight: 600;
      color: #fff;
      letter-spacing: .2em;
      opacity: .4;
    }
    .corner-tr {
      position: absolute;
      top: 1.5vh;
      right: 2vw;
      display: flex;
      align-items: center;
      gap: .6vw;
      font-size: 1.6vh;
      color: #fff;
      opacity: .4;
    }
    .status-dot {
      width: 1.2vh;
      height: 1.2vh;
      border-radius: 50%;
      background: #4ade80;
      animation: pulse 2s ease-in-out infinite;
    }
    .status-dot.offline { background: #f87171; animation: none; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .2; } }

    .sets-overlay {
      position: absolute;
      bottom: 1vh;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 3vw;
      font-size: 3vh;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
    }
    .set-chip.w1 { color: #4ade80; opacity: 1; }
    .set-chip.w2 { color: #f87171; opacity: 1; }

    .winner-banner {
      position: absolute;
      bottom: 1vh;
      left: 50%;
      transform: translateX(-50%);
      font-size: 2.5vh;
      font-weight: 700;
      color: #4ade80;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div id="waiting">
    <div>Waiting for score...</div>
    <div class="code">${code}</div>
  </div>

  <div id="board">
    <div class="game-section">
      <div class="teams-above">
        <div class="team-name" id="team1-name">—</div>
        <div class="teams-spacer"></div>
        <div class="team-name" id="team2-name">—</div>
      </div>
      <div class="game-row">
        <div class="game-score" id="game-t1">0</div>
        <div class="game-dash">–</div>
        <div class="game-score" id="game-t2">0</div>
      </div>
      <div class="game-label" id="game-label">Game</div>
    </div>

    <div class="set-section">
      <div class="set-score" id="set-t1">0</div>
      <div class="set-dash">–</div>
      <div class="set-score" id="set-t2">0</div>

      <div class="corner-tl">${code}</div>
      <div class="corner-tr">
        <div class="status-dot" id="status-dot"></div>
        <span id="status-text">Live</span>
      </div>
      <div class="sets-overlay" id="sets-overlay"></div>
      <div class="winner-banner" id="winner-banner" style="display:none"></div>
    </div>
  </div>

  <script>
    const CODE = '${code}';

    function updateDisplay(data) {
      const p = data.players || {};
      const sp = data.servingPlayer;
      const dot = '<span class="serve-dot"></span>';
      const t1OnLeft = !data.team1Side || data.team1Side === 'L';

      function pn(key) {
        const name = p[key];
        if (!name) return null;
        return (sp === key ? dot : '') + name;
      }

      const t1 = [pn('A'), pn('B')].filter(Boolean).join(' / ') || '—';
      const t2 = [pn('C'), pn('D')].filter(Boolean).join(' / ') || '—';
      const leftName  = t1OnLeft ? t1 : t2;
      const rightName = t1OnLeft ? t2 : t1;

      document.getElementById('team1-name').innerHTML = leftName;
      document.getElementById('team2-name').innerHTML = rightName;

      const isTB = data.currentSet && data.currentSet.isTiebreak;
      if (isTB && data.tiebreak) {
        document.getElementById('game-t1').textContent = t1OnLeft ? data.tiebreak.team1 : data.tiebreak.team2;
        document.getElementById('game-t2').textContent = t1OnLeft ? data.tiebreak.team2 : data.tiebreak.team1;
        document.getElementById('game-label').textContent = 'Tiebreak';
      } else if (data.game) {
        document.getElementById('game-t1').textContent = t1OnLeft ? data.game.team1Points : data.game.team2Points;
        document.getElementById('game-t2').textContent = t1OnLeft ? data.game.team2Points : data.game.team1Points;
        document.getElementById('game-label').textContent = 'Game';
      }

      if (data.currentSet) {
        document.getElementById('set-t1').textContent = t1OnLeft ? data.currentSet.team1Games : data.currentSet.team2Games;
        document.getElementById('set-t2').textContent = t1OnLeft ? data.currentSet.team2Games : data.currentSet.team1Games;
      }

      const completedSets = (data.sets || []).filter(s => s.winner !== null);
      document.getElementById('sets-overlay').innerHTML = completedSets.map((s, i) => {
        const leftGames  = t1OnLeft ? s.team1Games : s.team2Games;
        const rightGames = t1OnLeft ? s.team2Games : s.team1Games;
        const leftWon = (t1OnLeft && s.winner === 1) || (!t1OnLeft && s.winner === 2);
        const cls = s.winner === null ? '' : (leftWon ? 'w1' : 'w2');
        return '<span class="set-chip ' + cls + '">Set ' + (i + 1) + ': ' + leftGames + '–' + rightGames + '</span>';
      }).join('');

      const banner = document.getElementById('winner-banner');
      if (data.isCompleted && data.winner) {
        const leftWon = (t1OnLeft && data.winner === 1) || (!t1OnLeft && data.winner === 2);
        const winnerName = (leftWon ? leftName : rightName).replace(/<[^>]+>/g, '');
        banner.textContent = 'Match completed — ' + winnerName + ' wins';
        banner.style.display = 'block';
        document.getElementById('sets-overlay').style.display = 'none';
      } else {
        banner.style.display = 'none';
        document.getElementById('sets-overlay').style.display = 'flex';
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
