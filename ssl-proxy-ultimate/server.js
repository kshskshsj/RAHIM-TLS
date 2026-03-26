const http = require('http');
const httpProxy = require('http-proxy');

const PORT = process.env.PORT || 8080;
const PATH = "/rahimdx";
const ROTATE_HOSTS = (process.env.ROTATE_HOSTS || "domain1.com;domain2.com").split(";");
const TARGETS = (process.env.TARGETS || "http://example.com").split(";");
const USER = process.env.USERNAME || "RAHIMDX";
const PASS = process.env.PASSWORD || "RAHIMDX";
let hIndex = 0;
let tIndex = 0;

const proxy = httpProxy.createProxyServer({ ws: true, changeOrigin: true, xfwd: true });

function getHost() { const host = ROTATE_HOSTS[hIndex]; hIndex = (hIndex + 1) % ROTATE_HOSTS.length; return host; }
function getTarget() { const target = TARGETS[tIndex]; tIndex = (tIndex + 1) % TARGETS.length; return target; }
function checkAuth(req) {
  const auth = req.headers['authorization'];
  if (!auth) return false;
  const base64 = auth.split(' ')[1];
  return Buffer.from(base64, 'base64').toString() === `${USER}:${PASS}`;
}

const server = http.createServer((req, res) => {
  if (req.url === "/health") { res.writeHead(200); return res.end("OK"); }
  if (!req.url.startsWith(PATH)) { res.writeHead(403); return res.end("Forbidden"); }
  if (!checkAuth(req)) { res.writeHead(401, {'WWW-Authenticate': 'Basic realm="Secure"'}); return res.end("Auth Required"); }

  const target = getTarget();
  const fakeHost = getHost();
  req.headers['host'] = fakeHost;
  req.headers['connection'] = "Upgrade";
  req.headers['upgrade'] = "websocket";
  if (!req.headers['user-agent']) req.headers['user-agent'] = "Mozilla/5.0";

  proxy.web(req, res, { target }, () => { res.writeHead(502); res.end("Bad Gateway"); });
});

server.on('upgrade', (req, socket, head) => {
  if (!req.url.startsWith(PATH) || !checkAuth(req)) { socket.destroy(); return; }
  const target = getTarget();
  const fakeHost = getHost();
  req.headers['host'] = fakeHost;
  proxy.ws(req, socket, head, { target }, () => socket.destroy());
});

server.listen(PORT, () => console.log("🔥 SSL Proxy Ultimate running on port " + PORT));