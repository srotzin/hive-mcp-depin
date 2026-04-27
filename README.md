<!-- HIVE_BANNER_V1 -->
<p align="center">
  <a href="https://hive-mcp-gateway.onrender.com/depin/health">
    <img src="https://hive-mcp-gateway.onrender.com/og.svg" alt="Hive Civilization MCP Gateway · DePIN reward routing · capacity verification · settlement reports" width="100%"/>
  </a>
</p>

<h1 align="center">hive-mcp-depin</h1>

<p align="center"><strong>DePIN reward routing · capacity verification · settlement reports</strong></p>

<p align="center">
  <a href="https://smithery.ai/server/hivecivilization/hive-mcp-depin"><img alt="Smithery" src="https://img.shields.io/badge/Smithery-hivecivilization%2Fhive-mcp-depin-C08D23?style=flat-square"/></a>
  <a href="https://glama.ai/mcp/servers"><img alt="Glama" src="https://img.shields.io/badge/Glama-pending-C08D23?style=flat-square"/></a>
  <a href="https://hive-mcp-gateway.onrender.com/depin/health"><img alt="Live" src="https://img.shields.io/badge/gateway-live-C08D23?style=flat-square"/></a>
  <a href="https://github.com/srotzin/hive-mcp-depin/releases"><img alt="Release" src="https://img.shields.io/github/v/release/srotzin/hive-mcp-depin?style=flat-square&color=C08D23"/></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-C08D23?style=flat-square"/></a>
</p>

<p align="center">
  <code>https://hive-mcp-gateway.onrender.com/depin/mcp</code>
</p>

---

# HiveDePIN

**Decentralized Physical Infrastructure marketplace for autonomous agents**

MCP server for the Hive DePIN provider marketplace. Operators of physical infrastructure (storage, compute, GPU, bandwidth, energy meters, sensors, wireless coverage) list their capacity with 22 standardized metadata fields; agents discover and consume that capacity with USDC/USDT settlement on Base, Ethereum, or Solana. Match fee 0.15%. Real rails.

> Council R3 score 33/49

---

## What this is

`hive-mcp-depin` is a Model Context Protocol (MCP) server that exposes the HiveDePIN platform on the Hive Civilization to any MCP-compatible client (Claude Desktop, Cursor, Manus, etc.). The server proxies to the live production backend at `https://hivemorph.onrender.com`.

- **Protocol:** MCP 2024-11-05 over Streamable-HTTP / JSON-RPC 2.0
- **Transport:** `POST /mcp`
- **Discovery:** `GET /.well-known/mcp.json`
- **Health:** `GET /health`
- **Settlement:** Real rails. USDC / USDT on Base, Ethereum, Solana. No mock. No simulated.
- **Brand gold:** Pantone 1245 C / `#C08D23`

## Tools

| Tool | Description |
|---|---|
| `depin_list_providers` | List DePIN provider listings. Filter by category (storage, compute, gpu, bandwidth, energy, sensor, wireless), region, or capacity. No auth required. |
| `depin_create_listing` | List physical infrastructure capacity (storage TB, compute cores, GPU VRAM, bandwidth Mbps, sensor sample rate, etc.). 22 metadata fields supported. Match fee 0.15%. |
| `depin_get_match_fee` | Get the current DePIN marketplace match fee (currently 0.15%). Returned alongside settlement currencies and chains. |


## Backend endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/agent/listings?kind=depin_provider` | List provider capacity |
| `POST` | `/v1/agent/listings` | Register provider capacity |


## Run locally

```bash
git clone https://github.com/srotzin/hive-mcp-depin.git
cd hive-mcp-depin
npm install
npm start
# server up on http://localhost:3000/mcp
curl http://localhost:3000/health
curl http://localhost:3000/.well-known/mcp.json
```

## Connect from an MCP client

**Claude Desktop / Cursor / Manus** — add to your `mcp.json`:

```json
{
  "mcpServers": {
    "hive_mcp_depin": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://your-deployed-host/mcp"]
    }
  }
}
```

## Hive Civilization

Part of the [Hive Civilization](https://www.thehiveryiq.com) — sovereign DID, USDC settlement, HAHS legal contracts, agent-to-agent rails.

Categories: depin, agent-to-agent, infrastructure, marketplace, web3, defi.

## License

MIT (c) Steve Rotzin / Hive Civilization


## Agent-native (v1.0.3)

This shim ships the Hive Civilization agent-native bundle so any A2A or MCP-aware agent can discover, pay, and earn:

- **A2A AgentCard** — \`GET /.well-known/agent.json\` (also at \`/agent.json\`).
- **Open Agent Card (OAC) JSON-LD** — embedded inline at \`/\` and \`/agent.html\`, with \`@type SoftwareApplication\` + \`@type AgentCard\` under \`@context\` \`https://schema.org\` + \`https://a2a-protocol.org/v1\`.
- **Earn rails** — every shim exposes \`hive_earn_register\`, \`hive_earn_me\`, \`hive_earn_leaderboard\` against \`https://hivemorph.onrender.com/v1/earn/*\`.
  Resilient to upstream cold-start: returns a structured "earn rails not yet live" body if upstream isn't yet deployed.
- **x402 propagation** — paid responses pass through the upstream 402 body untouched so the consuming agent can auto-pay.
- **Pricing annotations** — every paid tool descriptor carries a non-standard \`pricing\` block (amount / currency / chain / recipient) ahead of MCP-next.
- Brand: Hive Civilization gold \`#C08D23\`. Settlement: real Base USDC, recipient \`0x15184bf50b3d3f52b60434f8942b7d52f2eb436e\`. No mock, no testnet.
