import dns from "node:dns";


export function fixWindowsDns() {
  if (process.platform !== "win32") return;

  const servers = dns.getServers();

  if (servers.length === 1 && servers[0] === "127.0.0.1") {
    console.warn("⚠️ Applying Windows DNS workaround.");
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
  }
}
