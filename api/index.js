const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Vercel 로그 확인을 위한 미들웨어
app.use((req, res, next) => {
  console.log(`[Vercel Test] Incoming request: ${req.method} ${req.url}`);
  next();
});

// 최소 기능 테스트 엔드포인트
app.get('/api/projects', (req, res) => {
    res.status(200).send('Hello from Vercel API!');
});

// 모든 다른 경로에 대한 404 처리 (선택 사항, 디버깅에 도움)
app.use((req, res) => {
    console.log(`[Vercel Test] 404 Not Found for: ${req.method} ${req.url}`);
    res.status(404).send('Not Found - Vercel Test API');
});

module.exports = app;