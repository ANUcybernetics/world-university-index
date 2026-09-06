import type { APIRoute } from "astro";
import { citationsPayload } from "../../lib/api";
import { siteOrigin } from "../../lib/paths";

export const GET: APIRoute = (context) => Response.json(citationsPayload(siteOrigin(context.site)));
