using Microsoft.AspNetCore.Mvc;

namespace CastleInventoryAX.Controllers;

[ApiController]
public class RootController : ControllerBase
{
    [HttpGet("/")]
    public ContentResult Index()
    {
        var html = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>CastleInventoryAX</title>
              <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #e2e8f0; padding: 2rem; }
                h1 { font-size: 1.6rem; font-weight: 700; color: #f8fafc; margin-bottom: 0.25rem; }
                .subtitle { color: #94a3b8; font-size: 0.9rem; margin-bottom: 2rem; }
                .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
                .card { background: #1e2330; border: 1px solid #2d3748; border-radius: 8px; padding: 1.25rem; }
                .card h2 { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #7c8fa6; margin-bottom: 0.75rem; }
                .route { display: flex; align-items: baseline; gap: 0.5rem; padding: 0.3rem 0; border-bottom: 1px solid #2a3340; }
                .route:last-child { border-bottom: none; }
                .method { font-size: 0.7rem; font-weight: 700; color: #4ade80; width: 40px; flex-shrink: 0; }
                .method.post { color: #fb923c; }
                .method.patch { color: #facc15; }
                .method.delete { color: #f87171; }
                a { color: #60a5fa; text-decoration: none; font-size: 0.82rem; font-family: 'Courier New', monospace; }
                a:hover { color: #93c5fd; text-decoration: underline; }
              </style>
            </head>
            <body>
              <h1>CastleInventoryAX</h1>
              <p class="subtitle">Master inventory system for the Castle ecosystem &nbsp;|&nbsp; <a href="/health">/health</a></p>
              <div class="grid">
                <div class="card">
                  <h2>Primary Entry Points</h2>
                  <div class="route"><span class="method">GET</span><a href="/bom/CSTL-STRUT-WAREHOUSE-INVENTORY-V001">/bom/:castle_record_id</a></div>
                  <div class="route"><span class="method">GET</span><a href="/bom/impact/AtomicAsset/AA-VALIDATE-POSITIVE-NUMBER-V001">/bom/impact/:entity_type/:entity_id</a></div>
                  <div class="route"><span class="method">GET</span><a href="/retrieval/context?castle_type_id=CT-INTERNAL-INVENTORY-V001&blueprint_id=BP-INVENTORY-INTERNAL-TENANT-V001">/retrieval/context</a></div>
                  <div class="route"><span class="method">GET</span><a href="/retrieval/castle/CSTL-STRUT-WAREHOUSE-INVENTORY-V001">/retrieval/castle/:castle_record_id</a></div>
                </div>
                <div class="card">
                  <h2>Reports</h2>
                  <div class="route"><span class="method">GET</span><a href="/reports/castles">/reports/castles</a></div>
                  <div class="route"><span class="method">GET</span><a href="/reports/blueprints">/reports/blueprints</a></div>
                  <div class="route"><span class="method">GET</span><a href="/reports/castle-types">/reports/castle-types</a></div>
                  <div class="route"><span class="method">GET</span><a href="/reports/castle-units">/reports/castle-units</a></div>
                  <div class="route"><span class="method">GET</span><a href="/reports/castle-services">/reports/castle-services</a></div>
                  <div class="route"><span class="method">GET</span><a href="/reports/composites">/reports/composites</a></div>
                  <div class="route"><span class="method">GET</span><a href="/reports/compounds">/reports/compounds</a></div>
                  <div class="route"><span class="method">GET</span><a href="/reports/atomic-assets">/reports/atomic-assets</a></div>
                  <div class="route"><span class="method">GET</span><a href="/reports/reuse">/reports/reuse</a></div>
                  <div class="route"><span class="method">GET</span><a href="/reports/deprecated">/reports/deprecated</a></div>
                  <div class="route"><span class="method">GET</span><a href="/reports/duplicates">/reports/duplicates</a></div>
                  <div class="route"><span class="method">GET</span><a href="/reports/promotion-candidates">/reports/promotion-candidates</a></div>
                  <div class="route"><span class="method">GET</span><a href="/reports/approval-status">/reports/approval-status</a></div>
                  <div class="route"><span class="method">GET</span><a href="/reports/local-modifications">/reports/local-modifications</a></div>
                  <div class="route"><span class="method">GET</span><a href="/reports/build-readiness/CSTL-STRUT-WAREHOUSE-INVENTORY-V001">/reports/build-readiness/:castle_record_id</a></div>
                  <div class="route"><span class="method">GET</span><a href="/reports/dependency-map/AtomicAsset/AA-FORMAT-QUANTITY-V001">/reports/dependency-map/:type/:id</a></div>
                </div>
                <div class="card">
                  <h2>Castles &amp; Local Mods</h2>
                  <div class="route"><span class="method">GET</span><a href="/castles">/castles</a></div>
                  <div class="route"><span class="method post">POST</span><a href="/castles">/castles</a></div>
                  <div class="route"><span class="method">GET</span><a href="/castles/CSTL-STRUT-WAREHOUSE-INVENTORY-V001">/castles/:id</a></div>
                  <div class="route"><span class="method">GET</span><a href="/castles/CSTL-STRUT-WAREHOUSE-INVENTORY-V001/local-modifications">/castles/:id/local-modifications</a></div>
                </div>
                <div class="card">
                  <h2>Castle Types &amp; Blueprints</h2>
                  <div class="route"><span class="method">GET</span><a href="/castle-types">/castle-types</a></div>
                  <div class="route"><span class="method">GET</span><a href="/castle-types/CT-INTERNAL-INVENTORY-V001">/castle-types/:id</a></div>
                  <div class="route"><span class="method">GET</span><a href="/blueprints">/blueprints</a></div>
                  <div class="route"><span class="method">GET</span><a href="/blueprints/BP-INVENTORY-INTERNAL-TENANT-V001">/blueprints/:id</a></div>
                </div>
                <div class="card">
                  <h2>Castle Units &amp; Services</h2>
                  <div class="route"><span class="method">GET</span><a href="/castle-units">/castle-units</a></div>
                  <div class="route"><span class="method">GET</span><a href="/castle-units/CU-WAREHOUSING-INVENTORY-V001">/castle-units/:id</a></div>
                  <div class="route"><span class="method">GET</span><a href="/castle-services">/castle-services</a></div>
                  <div class="route"><span class="method">GET</span><a href="/castle-services/CS-INVENTORY-V001">/castle-services/:id</a></div>
                </div>
                <div class="card">
                  <h2>Composites, Compounds &amp; Atomic Assets</h2>
                  <div class="route"><span class="method">GET</span><a href="/composites">/composites</a></div>
                  <div class="route"><span class="method">GET</span><a href="/composites/COMP-INVENTORY-TABLE-V001">/composites/:id</a></div>
                  <div class="route"><span class="method">GET</span><a href="/compounds">/compounds</a></div>
                  <div class="route"><span class="method">GET</span><a href="/compounds/CMPD-QUANTITY-VALIDATION-V001">/compounds/:id</a></div>
                  <div class="route"><span class="method">GET</span><a href="/atomic-assets">/atomic-assets</a></div>
                  <div class="route"><span class="method">GET</span><a href="/atomic-assets/AA-FORMAT-QUANTITY-V001">/atomic-assets/:id</a></div>
                </div>
              </div>
            </body>
            </html>
            """;
        return Content(html, "text/html");
    }

    [HttpGet("/health")]
    public IActionResult Health() => Ok(new { status = "ok", system = "CastleInventoryAX" });
}
