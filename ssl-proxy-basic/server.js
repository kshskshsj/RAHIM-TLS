const http = require('http');
const httpProxy = require('http-proxy');

const PORT = process.env.PORT || 8080;
const PATH = "/rahimdx";
const TARGETS = (process.env.TARGETS || "http://example.com").split(";");

let index = 0;

function getTarget() {
  const target = TARGETS[index];
  index = (index + 1) % TARGETS.length;
  return target;
}

const proxy = httpProxy.createProxyServer({ ws: true, changeOrigin: true });

const server = http.createServer((req, res) => {
  if (req.url === "/health") { res.writeHead(200); return res.end("OK"); }
  if (!req.url.startsWith(PATH)) { res.writeHead(403); return res.end("Forbidden"); }

  const target = getTarget();
  req.headers['host'] = new URL(target).host;
  req.headers['connection'] = "Upgrade";
  req.headers['upgrade'] = "websocket";
  if (!req.headers['user-agent']) req.headers['user-agent'] = "Mozilla/5.0";

  proxy.web(req, res, { target }, () => {
    res.writeHead(502);
    res.end("Bad Gateway");
  });
});

server.on('upgrade', (req, socket, head) => {
  if (!req.url.startsWith(PATH)) { socket.destroy(); return; }
  const target = getTarget();
  req.headers['host'] = new URL(target).host;
  proxy.ws(req, socket, head, { target }, () => socket.destroy());
});

server.listen(PORT, () => console.log("SSL Proxy Basic running on port " + PORT));