module.exports = (req, res) => {
  if (req.url === '/api/projects') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello from pure Vercel Serverless Function!');
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not Found - Pure Serverless Function');
  }
};