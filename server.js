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
import { HIVE_EARN_TOOLS, executeHiveEarnTool, isHiveEarnTool } from './hive-earn-tools.js';
import { buildAgentCard, buildOacJsonLd, renderRootHtml } from './hive-agent-card.js';
import { renderLanding, renderRobots, renderSitemap, renderSecurity, renderOgImage, seoJson, BRAND_GOLD } from './meta.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const HIVE_BASE = process.env.HIVE_BASE || 'https://hivemorph.onrender.com';

// ─── Tool definitions ────────────────────────────────────────────────────────

// ─── Agent-native config (A2A AgentCard + OAC JSON-LD + earn rails) ───────
const HIVE_AGENT_CFG = {
  name: 'HiveDePIN MCP',
  description: "DePIN provider marketplace MCP server. Storage, compute, GPU, bandwidth, sensors, wireless. Real Base USDC settlement, 0.15% match fee.",
  url: 'https://hive-mcp-gateway.onrender.com/depin',
  version: '1.0.3',
  repoUrl: 'https://github.com/srotzin/hive-mcp-depin',
  did: 'did:hive:depin',
  gatewayUrl: 'https://hive-mcp-gateway.onrender.com',
  // Tools attached at runtime (after merging earn tools in)
  tools: [],
};

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


const SERVICE_CFG = {
  service: "hive-mcp-depin",
  shortName: "HiveDePIN",
  title: "HiveDePIN \u00b7 Decentralized Physical Infrastructure Marketplace MCP",
  tagline: "DePIN provider marketplace \u2014 storage, compute, GPU, bandwidth, sensors, wireless.",
  description: "MCP server for HiveDePIN \u2014 decentralized physical infrastructure marketplace. Operators list capacity (storage, compute, GPU, bandwidth, energy meters, sensors, wireless coverage) with 22 standardized metadata fields. Match fee 0.15%. USDC/USDT settlement on Base, Ethereum, or Solana. Real rails.",
  keywords: ["mcp", "model-context-protocol", "x402", "agentic", "ai-agent", "ai-agents", "llm", "hive", "hive-civilization", "depin", "decentralized-physical-infrastructure", "marketplace", "usdc", "base", "base-l2", "ethereum", "solana", "a2a"],
  externalUrl: "https://hive-mcp-depin.onrender.com",
  gatewayMount: "/depin",
  version: "1.0.2",
  pricing: [
    { name: "depin_list_providers", priceUsd: 0, label: "List providers \u2014 free" },
    { name: "depin_match", priceUsd: 0.005, label: "Match (Tier 2)" },
    { name: "depin_settle", priceUsd: 0.05, label: "Settle (Tier 3, 0.15% match fee)" }
  ],
};
SERVICE_CFG.tools = (typeof TOOLS !== 'undefined' ? TOOLS : (typeof MCP_TOOLS !== 'undefined' ? MCP_TOOLS : [])).map(t => ({ name: t.name, description: t.description }));

// HIVE_AGENT_NATIVE_v1 — earn tools + AgentCard wiring
for (const t of HIVE_EARN_TOOLS) {
  if (!TOOLS.find(x => x.name === t.name)) TOOLS.push(t);
}
HIVE_AGENT_CFG.tools = TOOLS;
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
  // HIVE_AGENT_DISPATCH_v1 — earn tools first, then native dispatch
  if (isHiveEarnTool(name)) {
    const out = await executeHiveEarnTool(name, args);
    if (out) return out;
  }
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


// HIVE_META_BLOCK_v1 — comprehensive meta tags + JSON-LD + crawler discovery
app.get('/', (req, res) => {
  // HIVE_AGENT_INJECT_LD_v1 — inject OAC JSON-LD into the meta-tags landing
  const __landing = renderLanding(SERVICE_CFG);
  const __oacLd = JSON.stringify(buildOacJsonLd(HIVE_AGENT_CFG)).replace(/</g, '\\u003c');
  const __ldTag = '\n<script type="application/ld+json">' + __oacLd + '</script>\n';
  const __out = __landing.replace('</head>', __ldTag + '</head>');
  res.type('text/html; charset=utf-8').send(__out);
});
app.get('/og.svg', (req, res) => {
  res.type('image/svg+xml').send(renderOgImage(SERVICE_CFG));
});
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(renderRobots(SERVICE_CFG));
});
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml').send(renderSitemap(SERVICE_CFG));
});
app.get('/.well-known/security.txt', (req, res) => {
  res.type('text/plain').send(renderSecurity());
});
app.get('/seo.json', (req, res) => res.json(seoJson(SERVICE_CFG)));
// HIVE_AGENT_ROUTES_v1 — A2A AgentCard + OAC JSON-LD
app.get('/.well-known/agent.json', (req, res) => {
  res.json(buildAgentCard(HIVE_AGENT_CFG));
});
app.get('/agent.json', (req, res) => {
  res.json(buildAgentCard(HIVE_AGENT_CFG));
});
app.get('/.well-known/oac.json', (req, res) => {
  res.json(buildOacJsonLd(HIVE_AGENT_CFG));
});
app.get('/agent.html', (req, res) => {
  res.type('text/html; charset=utf-8').send(renderRootHtml(HIVE_AGENT_CFG));
});


// ─── Schema discoverability ────────────────────────────────────────────────
const AGENT_CARD = {
  name: SERVICE,
  description: 'MCP server for the Hive DePIN provider marketplace. Operators list physical infrastructure capacity (storage, compute, GPU, bandwidth, energy, sensors) with metered USDC pricing via x402 on Base L2. New agents: first call free. Loyalty: every 6th paid call is free. Pay in USDC on Base L2.',
  url: `https://${SERVICE}.onrender.com`,
  provider: {
    organization: 'Hive Civilization',
    url: 'https://www.thehiveryiq.com',
    contact: 'steve@thehiveryiq.com',
  },
  version: VERSION,
  capabilities: {
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: false,
  },
  authentication: {
    schemes: ['x402'],
    credentials: {
      type: 'x402',
      asset: 'USDC',
      network: 'base',
      asset_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      recipient: '0x15184bf50b3d3f52b60434f8942b7d52f2eb436e',
    },
  },
  defaultInputModes: ['application/json'],
  defaultOutputModes: ['application/json'],
  skills: [
    { name: 'depin_list_providers', description: 'List DePIN provider listings. Filter by category (storage, compute, gpu, bandwidth, energy, sensor, wireless), region, or capacity. No auth required.' },
    { name: 'depin_create_listing', description: 'List physical infrastructure capacity (storage TB, compute cores, GPU VRAM, bandwidth Mbps, sensor sample rate, etc.). 22 metadata fields supported. Match fee 0.15%.' },
    { name: 'depin_get_match_fee', description: 'Get the current DePIN marketplace match fee (currently 0.15%). Returned alongside settlement currencies and chains.' },
  ],
  extensions: {
    hive_pricing: {
      currency: 'USDC',
      network: 'base',
      model: 'per_call',
      first_call_free: true,
      loyalty_threshold: 6,
      loyalty_message: 'Every 6th paid call is free',
    },
  },
};

const AP2 = {
  ap2_version: '1',
  agent: {
    name: SERVICE,
    did: `did:web:${SERVICE}.onrender.com`,
    description: 'MCP server for the Hive DePIN provider marketplace. Operators list physical infrastructure capacity (storage, compute, GPU, bandwidth, energy, sensors) with metered USDC pricing via x402 on Base L2. New agents: first call free. Loyalty: every 6th paid call is free. Pay in USDC on Base L2.',
  },
  endpoints: {
    mcp: `https://${SERVICE}.onrender.com/mcp`,
    agent_card: `https://${SERVICE}.onrender.com/.well-known/agent-card.json`,
  },
  payments: {
    schemes: ['x402'],
    primary: {
      scheme: 'x402',
      network: 'base',
      asset: 'USDC',
      asset_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      recipient: '0x15184bf50b3d3f52b60434f8942b7d52f2eb436e',
    },
  },
  brand: { color: '#C08D23', name: 'Hive Civilization' },
};

app.get('/.well-known/agent-card.json', (req, res) => res.json(AGENT_CARD));
app.get('/.well-known/ap2.json',         (req, res) => res.json(AP2));


app.listen(PORT, () => {
  console.log(`HiveDePIN MCP Server running on :${PORT}`);
  console.log(`  Backend : ${HIVE_BASE}`);
  console.log(`  Tools   : ${TOOLS.length}`);
});
