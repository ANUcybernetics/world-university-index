import type { APIRoute } from "astro";
import { indicesPayload } from "../../lib/api";
import { siteOrigin } from "../../lib/paths";

export const GET: APIRoute = (context) => Response.json(indicesPayload(siteOrigin(context.site)));
