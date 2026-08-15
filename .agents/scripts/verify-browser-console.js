import http from "node:http";

async function run() {
  console.log("Fetching CDP targets from http://localhost:9222/json ...");
  const targetsRaw = await new Promise((resolve, reject) => {
    http.get("http://127.0.0.1:9222/json", (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });

  const targets = JSON.parse(targetsRaw);
  const pageTarget = targets.find((t) => t.type === "page" && t.url.includes("localhost:8081"));
  if (!pageTarget) {
    console.error("No localhost:8081 page target found in Chrome DevTools!");
    process.exit(1);
  }

  console.log(`Connecting to CDP target: ${pageTarget.title} (${pageTarget.url})`);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  const errors = [];
  const logs = [];

  ws.onopen = () => {
    console.log("Connected to Chrome CDP WebSocket.");
    ws.send(JSON.stringify({ id: 1, method: "Runtime.enable" }));
    ws.send(JSON.stringify({ id: 2, method: "Log.enable" }));
    ws.send(JSON.stringify({ id: 3, method: "Page.enable" }));

    // Evaluate window.location and page document state
    ws.send(JSON.stringify({
      id: 4,
      method: "Runtime.evaluate",
      params: { expression: "({ url: location.href, title: document.title, rootHtml: document.getElementById('root')?.innerHTML })", returnByValue: true }
    }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Runtime.consoleAPICalled") {
      const { type, args } = msg.params;
      const text = args.map((a) => a.value || a.description || JSON.stringify(a)).join(" ");
      logs.push(`[Console ${type.toUpperCase()}] ${text}`);
      if (type === "error") {
        errors.push(text);
      }
    } else if (msg.method === "Log.entryAdded") {
      const { level, text, url } = msg.params.entry;
      logs.push(`[Browser ${level.toUpperCase()}] ${text} (${url || ""})`);
      if (level === "error") {
        errors.push(text);
      }
    } else if (msg.id === 4 && msg.result) {
      console.log("Page Evaluation Result:", JSON.stringify(msg.result.result?.value, null, 2));
      setTimeout(() => {
        console.log("\n=== Captured Browser Logs ===");
        logs.forEach((l) => console.log(l));
        console.log("\n=== Console Errors Count ===", errors.length);
        ws.close();
        if (errors.length > 0) {
          console.error("FAILED: Found browser console errors!");
          process.exit(1);
        } else {
          console.log("PASSED: 0 browser console errors detected!");
          process.exit(0);
        }
      }, 1000);
    }
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
    process.exit(1);
  };
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
