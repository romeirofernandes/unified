// Push only invalidations. The authenticated run endpoint remains the sole source of run data.
function streamRun(req, res, Run) {
  let changes;
  try { changes = Run.watch([{ $match: { "documentKey._id": req.run._id } }], { maxAwaitTimeMS: 1000 }); }
  catch { return res.status(503).json({ message: "Live updates are unavailable. Automatic refresh will continue." }); }
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
  res.flushHeaders();
  const send = event => { if (!res.destroyed && !res.writableEnded) res.write(`event: ${event}\ndata: {}\n\n`); };
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true; clearInterval(heartbeat); clearTimeout(expiry);
    changes.close().catch(() => {});
    if (!res.writableEnded) res.end();
  };
  const heartbeat = setInterval(() => send("heartbeat"), 15000);
  // Reconnect periodically so authentication and project ownership are checked again.
  const expiry = setTimeout(close, 120000);
  let ready = false;
  const connected = () => { if (!ready) { ready = true; send("ready"); } };
  changes.on("resumeTokenChanged", connected);
  changes.on("change", () => { connected(); send("change"); });
  changes.on("error", close);
  changes.on("close", close);
  res.on("close", close);
}
module.exports = { streamRun };
