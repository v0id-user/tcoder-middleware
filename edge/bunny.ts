import * as Bunny from "@bunny.net/edgescript-sdk";
import { handleRequest } from "./middleware.ts";

Bunny.net.http
  .servePullZone({ url: "https://example.com" })
  .onOriginRequest(handleRequest)
  .onOriginResponse(async (ctx: { request: Request, response: Response }) => {
    const response = await ctx.response;
    response.headers.append("X-Via", "MyMiddleware");
    return response;
  })

