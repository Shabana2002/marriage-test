
Marriage Match Test - Final Render-ready package

Frontend: /frontend
- index.html (UI + client-side logic)
- styles.css
- data/questions.js (exact finalized questions)
- utils/scoring.js
- utils/results.js
- script.js (flow, disqualification logic, PDF download client-side using jsPDF)

Backend: /backend (optional, for persistent storage)
- server.js (Express API)
- sessions.json (data file)
- cleanup.js (delete sessions older than 30 days; call daily)

How to use:
1. Deploy backend to Render as a Web Service (Node). Set DELETE_AFTER_DAYS=30 if desired.
2. Deploy frontend to Render static site or Netlify; ensure index.html loads jsPDF from CDN (already included).
3. For full persistence, set API_BASE in frontend script to your backend URL (not prefilled). The package works as a local demo using localStorage.

PDF download is performed client-side using jsPDF (CDN). The PDF contains only the results and answers (no cover).

