const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const SESS = path.join(__dirname, 'sessions.json');

function readS() {
  if (!fs.existsSync(SESS)) return {};
  try {
    return JSON.parse(fs.readFileSync(SESS));
  } catch (e) {
    return {};
  }
}

function writeS(s) {
  fs.writeFileSync(SESS, JSON.stringify(s, null, 2));
}

// Create session (female)
app.post('/api/session', (req, res) => {
  const { femaleAnswers } = req.body;
  if (!femaleAnswers) return res.status(400).json({ error: 'No answers provided' });

  const code = 'MM' + Math.floor(1000 + Math.random() * 9000); // MMxxxx
  const sessions = readS();
  sessions[code] = {
    femaleAnswers,
    createdAt: Date.now(),
    completedAt: null,
    maleAnswers: null
  };
  writeS(sessions);
  res.json({ code });
});

// Get session (male)
app.get('/api/session/:code', (req, res) => {
  const code = req.params.code;
  const sessions = readS();
  if (!sessions[code]) return res.status(404).json({ error: 'Session not found' });
  res.json(sessions[code]);
});

// Complete session (male submits)
app.post('/api/session/:code/complete', (req, res) => {
  const code = req.params.code;
  const { maleAnswers } = req.body;
  const sessions = readS();
  if (!sessions[code]) return res.status(404).json({ error: 'Session not found' });

  sessions[code].maleAnswers = maleAnswers;
  sessions[code].completedAt = Date.now();
  writeS(sessions);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
