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
