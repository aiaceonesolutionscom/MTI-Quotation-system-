// Entry file for cPanel's Node.js Selector on LiteSpeed (lsnode). LiteSpeed's
// lsnode wrapper does NOT hand the app a TCP port — it hands it a Unix domain
// socket path via LSNODE_SOCKET and expects the server to listen on that
// socket. Next.js's generated standalone server always calls
// `server.listen(numericPort, hostname, cb)`, so we intercept that call and
// redirect it to the socket LiteSpeed actually proxies to.
const http = require("http");
const socketPath = process.env.LSNODE_SOCKET;

if (socketPath) {
  const originalListen = http.Server.prototype.listen;
  http.Server.prototype.listen = function (...args) {
    const callback = args.find((a) => typeof a === "function");
    return originalListen.call(this, socketPath, callback);
  };
}

process.env.PORT = process.env.PORT || 3000;
require("./.next/standalone/server.js");
