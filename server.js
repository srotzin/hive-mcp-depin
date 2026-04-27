#!/usr/bin/env node
/**
 * HiveDePIN MCP Server
 * Decentralized Physical Infrastructure marketplace for autonomous agents
 *
 * Backend: https://hivemorph.onrender.com
 * Spec   : MCP 2024-11-05 / Streamable-HTTP / JSON-RPC 2.0
 * Brand  : Hive Civilization gold #C08D23 (Pantone 1245 C)
 */

import express from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const HIVE_BASE = process.env.HIVE_BASE || 'https://hivemorph.onrender.com';

// ─── Tool definitions ────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'depin_list_providers',
    description: 'List DePIN provider listings. Filter by category (storage, compute, gpu, bandwidth, energy, sensor, wireless), region, or capacity. No auth required.',
    inputSchema: {
      type: 'object',
      properties: {
provider_category: { type: 'string', description: 'storage | compute | gpu | bandwidth | energy | sensor | wireless' },
region: { type: 'string', description: 'Filter by region (e.g. us-east, eu-west)' }
      },
    },
  },    {
      name: 'depin_create_listing',
      description: 'List physical infrastructure capacity (storage TB, compute cores, GPU VRAM, bandwidth Mbps, sensor sample rate, etc.). 22 metadata fields supported. Match fee 0.15%.',
      inputSchema: {
type: 'object',
required: ["agent_id", "provider_category", "unit_rate_usdc", "unit_label", "operator_did", "payout_address"],
properties: {
  agent_id: { type: 'string', description: 'Operator agent ID' },
  provider_category: { type: 'string', description: 'storage | compute | gpu | bandwidth | energy | sensor | wireless' },
  unit_rate_usdc: { type: 'number', description: 'Price per unit in USDC' },
  unit_label: { type: 'string', description: 'Pricing unit, e.g. \'per TB-month\', \'per GPU-hour\'' },
  operator_did: { type: 'string', description: 'Operator DID for trust scoring' },
  payout_address: { type: 'string', description: 'Settlement address' },
  region: { type: 'string', description: 'Geographic region' },
  capacity_gb: { type: 'number', description: 'Capacity for storage providers (GB)' },
  throughput_mbps: { type: 'number', description: 'Throughput for bandwidth providers (Mbps)' },
  gpu_model: { type: 'string', description: 'GPU model for GPU providers' },
  vram_gb: { type: 'number', description: 'VRAM for GPU providers (GB)' },
  kind: { type: 'string', description: 'Listing kind (default: depin_provider)' }
},
      },
    },{
  name: 'depin_get_match_fee',
  description: 'Get the current DePIN marketplace match fee (currently 0.15%). Returned alongside settlement currencies and chains.',
  inputSchema: {
    type: 'object',
    properties: {

    },
  },
}
];

// ─── HTTP helpers ────────────────────────────────────────────────────────────
async function hiveGet(path, params = {}) {
  const url = new URL(`${HIVE_BASE}${path.startsWith('/') ? path : '/' + path}`);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
  return res.json();
}
async function hivePost(path, body) {
  const res = await fetch(`${HIVE_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  let data; try { data = await res.json(); } catch { data = { raw: await res.text() }; }
  return { data, status: res.status };
}

// ─── Tool execution ──────────────────────────────────────────────────────────
async function executeTool(name, args) {
  switch (name) {
      case 'depin_list_providers': {
const data = await hiveGet('/v1/agent/listings', {
  kind: 'depin_provider',
  provider_category: args.provider_category, region: args.region
});
return { type: 'text', text: JSON.stringify(data, null, 2) };
      }
      case 'depin_create_listing': {
const { data, status } = await hivePost('/v1/agent/listings', {
  agent_id: args.agent_id,
  provider_category: args.provider_category,
  unit_rate_usdc: args.unit_rate_usdc,
  unit_label: args.unit_label,
  operator_did: args.operator_did,
  payout_address: args.payout_address,
  region: args.region,
  capacity_gb: args.capacity_gb,
  throughput_mbps: args.throughput_mbps,
  gpu_model: args.gpu_model,
  vram_gb: args.vram_gb,
  kind: 'depin_provider'
});
return { type: 'text', text: JSON.stringify({ status, ...data }, null, 2) };
      }
      case 'depin_get_match_fee': {
const data = await hiveGet('/v1/agent/listings?kind=depin_provider&limit=1');
return { type: 'text', text: JSON.stringify(data, null, 2) };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── MCP JSON-RPC handler ────────────────────────────────────────────────────
app.post('/mcp', async (req, res) => {
  const { jsonrpc, id, method, params } = req.body || {};
  if (jsonrpc !== '2.0') return res.json({ jsonrpc:'2.0', id, error: { code:-32600, message:'Invalid JSON-RPC' } });
  try {
    switch (method) {
      case 'initialize':
        return res.json({ jsonrpc:'2.0', id, result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'hive-mcp-depin', version: '1.0.0', description: 'Decentralized Physical Infrastructure marketplace for autonomous agents' },
        } });
      case 'tools/list':
        return res.json({ jsonrpc:'2.0', id, result: { tools: TOOLS } });
      case 'tools/call': {
        const { name, arguments: args } = params || {};
        const out = await executeTool(name, args || {});
        return res.json({ jsonrpc:'2.0', id, result: { content: [out] } });
      }
      case 'ping':
        return res.json({ jsonrpc:'2.0', id, result: {} });
      default:
        return res.json({ jsonrpc:'2.0', id, error: { code:-32601, message:`Method not found: ${method}` } });
    }
  } catch (err) {
    return res.json({ jsonrpc:'2.0', id, error: { code:-32000, message: err.message } });
  }
});

// ─── Discovery + health ──────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status:'ok', service:'hive-mcp-depin', version:'1.0.0', backend: HIVE_BASE }));
app.get('/.well-known/mcp.json', (req, res) => res.json({
  name: 'hive-mcp-depin',
  endpoint: '/mcp',
  transport: 'streamable-http',
  protocol: '2024-11-05',
  tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
}));

app.listen(PORT, () => {
  console.log(`HiveDePIN MCP Server running on :${PORT}`);
  console.log(`  Backend : ${HIVE_BASE}`);
  console.log(`  Tools   : ${TOOLS.length}`);
});
