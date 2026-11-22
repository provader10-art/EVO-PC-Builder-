import products from "../../data/products.json" with { type: "json" };
export default async () => Response.json({ products, count: products.length, source: "EVO catalog", updatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
export const config = { path: "/api/catalog", method: "GET" };
