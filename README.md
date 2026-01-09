# TCoder Middleware

Bunny.net edge middleware that protects `/premium/` paths by verifying JWT tokens.

## How It Works

**Token Extraction** (in order):
1. URL query parameter: `?token=...`
2. Authorization header: `Authorization: Bearer <token>`
3. Custom header: `X-TCoder-Token: <token>`

**Access Control**:
- Paths starting with `/premium/` require a valid token with `is_premium: true`
- Missing token on premium path → 403 "Upgrade required"
- Invalid token on premium path → 403 "Upgrade required"
- Non-premium token on premium path → 403 "Upgrade required"
- All other requests proceed normally

**Token Verification**:
- Verifies JWT signature using secret key (configured in `lib/token.ts`)
- Validates token payload contains `is_premium` boolean field
- Logs premium status and verification failures to console

**Response Headers**:
- Adds `X-Via: TcoderMiddleware` header to all responses

## Configuration

- **Pull Zone URL**: Set in `edge/bunny.ts` (line 21)
- **JWT Secret**: Set `DUMMY_DEMO_KEY` in `lib/token.ts` (line 3)

## Development

```bash
deno run --allow-net --allow-env main.ts
deno check main.ts
```

## Deployment

Deploy `main.ts` to Bunny.net Edge Scripting as middleware script. The Pull Zone origin URL will be used automatically in production.
