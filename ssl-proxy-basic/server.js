const http = require("http");
const net = require("net");
const url = require("url");

const PORT = process.env.PORT || 8080;

// ❌ بدون auth
const PATH = process.env.PATH_ROUTE || "/app17";

// 🔥 تقدر تغيّر التارغت من هنا أو من ENV
const TARGET = process.env.TARGET || "YouTube.com";
const TARGET_PORT = process.env.TARGET_PORT || 443;

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("SSL Proxy Basic Running ✅");
});

server.on("upgrade", (req, socket, head) => {
  const pathname = url.parse(req.url).pathname;

  if (pathname !== PATH) {
    socket.destroy();
    return;
  }

  const remote = net.connect(TARGET_PORT, TARGET, () => {
    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\n" +
      "Connection: Upgrade\r\n" +
      "Upgrade: websocket\r\n\r\n"
    );

    remote.write(head);
    socket.pipe(remote);
    remote.pipe(socket);
  });

  remote.on("error", () => socket.destroy());
});

server.listen(PORT, () => {
  console.log("Basic server running on port " + PORT);
});
