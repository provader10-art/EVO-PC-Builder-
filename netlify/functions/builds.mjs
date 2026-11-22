import { getStore } from "@netlify/blobs";
const store = getStore({ name: "evo-pc-builds", consistency: "strong" });
const json = (data, status=200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export default async (req) => {
  try {
    if (req.method === "POST") {
      const body = await req.json();
      const allowed = new Set(["cpu","board","gpu","memory","storage","power","case","monitor"]);
      const raw = body.components && typeof body.components === "object" ? body.components : {};
      const components = Object.fromEntries(Object.entries(raw).filter(([k,v]) => allowed.has(k) && typeof v === "string" && v.length < 100));
      if (!Object.keys(components).length) return json({ error: "Select at least one valid component." }, 400);
      const build = { id: crypto.randomUUID(), name: String(body.name || "My EVO PC Build").trim().slice(0,48) || "My EVO PC Build", budget: Math.max(0, Math.min(20000, Number(body.budget)||0)), components, total: Math.max(0, Math.min(100000, Number(body.total)||0)), currency: ["USD","EUR","GBP"].includes(body.currency) ? body.currency : "USD", market: ["USA","International","All"].includes(body.market) ? body.market : "USA", createdAt: new Date().toISOString() };
      await store.setJSON(build.id, build);
      return json({ success: true, build }, 201);
    }
    if (req.method === "GET") {
      const id = new URL(req.url).searchParams.get("id");
      if (id) { const build = await store.get(id, { type: "json" }); return build ? json({ build }) : json({ error: "Build not found." }, 404); }
      const { blobs } = await store.list();
      const entries = await Promise.all(blobs.map(item => store.get(item.key, { type: "json" })));
      const builds = entries.filter(Boolean).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,60);
      return json({ builds, count: builds.length });
    }
    if (req.method === "DELETE") {
      const id = new URL(req.url).searchParams.get("id");
      if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "A valid build ID is required." }, 400);
      await store.delete(id);
      return json({ success: true });
    }
    return json({ error: "Method not allowed." }, 405);
  } catch (error) {
    console.error("EVO builds API error:", error);
    return json({ error: "The build service is temporarily unavailable." }, 500);
  }
};
export const config = { path: "/api/builds", method: ["GET","POST","DELETE"] };
