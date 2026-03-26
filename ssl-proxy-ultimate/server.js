const http = require("http");
const net = require("net");
const url = require("url");

const PORT = process.env.PORT || 8080;

const USERNAME = process.env.USERNAME || "RAHIMDX";
const PASSWORD = process.env.PASSWORD || "RAHIMDX";
const PATH = process.env.PATH_ROUTE || "/app17";

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("SSL Proxy Running ✅");
});

// 🔥 دعم WebSocket (المهم)
server.on("upgrade", (req, socket, head) => {
  const pathname = url.parse(req.url).pathname;

  if (pathname !== PATH) {
    socket.destroy();
    return;
  }

  // 🔐 تحقق من auth
  const auth = req.headers["authorization"];
  if (auth) {
    const base64 = auth.split(" ")[1];
    const decoded = Buffer.from(base64, "base64").toString();
    const [user, pass] = decoded.split(":");

    if (user !== USERNAME || pass !== PASSWORD) {
      socket.destroy();
      return;
    }
  }

  // 🔗 الاتصال بالسيرفر النهائي
  const target = "YouTube.com"; // تقدر تبدلها من ENV

  const remote = net.connect(443, target, () => {
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
  console.log("Server running on port " + PORT);
});
