![Image](https://github.com/user-attachments/assets/3152cf8b-b683-4acf-ab9d-e3bfd5dc0390)

> \[!NOTE]\
> Originally built for the **DKGcon2025 Hackathon** powered by OriginTrail.

## GWALN Plugin

GWALN is a plugin for the OriginTrail DKG Node that helps you compare Grokipedia and Wikipedia topics. It parses structured snapshots, computes discrepancies, and drafts Community Notes so that you can publish verifiable context on the OriginTrail DKG.

Project status: actively maintained.

### Basic functionality

The GWALN plugin provides tools for analysts and contributors who review AI-generated encyclopedia content. It helps them fetch topic snapshots, analyze alignment gaps, and package Community Notes for publication.

The plugin reads wikitext and Grokipedia HTML, normalizes both into a shared JSON schema, and runs an analyzer that aligns sections, claims, and citations. It then outputs structured analysis files, an HTML report, and JSON-LD Community Notes. For more details about the technical implementation, see [the developer documentation](#developer-documentation).

### What the GWALN plugin does not do

This plugin cannot edit Grokipedia or Wikipedia. It does not have content moderation powers and cannot publish to the OriginTrail DKG without valid signing keys configured in your DKG node. Users still need to review the findings and decide whether to publish.

## Prerequisites

Before using this plugin, you should be familiar with:

* OriginTrail concepts, including DKG nodes and Knowledge Assets.
* How to configure and run a DKG edge node.

You should have:

* A running DKG edge node with the plugin system enabled
* Network access to the DKG node and sufficient blockchain funds if you plan to publish
* Optional: a Google Gemini API key if you use automated bias verification

## Installation

### Install as a plugin in your DKG node

1. Install the plugin package:

   ```bash
   npm install @dkg/plugin-gwaln
   ```

2. Register the plugin in your DKG node server configuration:

   ```typescript
   import gwalnPlugin from "@dkg/plugin-gwaln";

   const app = createPluginServer({
     // ... other config
     plugins: [
       defaultPlugin,
       oauthPlugin,
       dkgEssentialsPlugin,
       gwalnPlugin, // Add the GWALN plugin
       // ... other plugins
     ],
   });
   ```

3. Ensure your DKG node is configured with:
   * Valid DKG endpoint, environment, and port
   * Blockchain identifiers and signing keys
   * Publish defaults such as epochs and retries

## Available Tools

The GWALN plugin exposes the following tools via the DKG node's MCP (Model Context Protocol) interface, making them available to AI agents and other MCP clients connected to your DKG node:

### Topic Management

#### `lookup` - Search for topics

Search for topics in the local catalog or discover new ones from Grokipedia and Wikipedia APIs.

**Parameters:**
- `query` (string): The topic to search for
- `limit` (number, optional): Maximum number of results per platform (default: 5)

**Example:**
```json
{
  "query": "Moon",
  "limit": 3
}
```

### Fetching Topic Snapshots

#### `fetch` - Download topic data

Download raw Wikipedia and/or Grokipedia data for a topic.

**Parameters:**
- `source` (string): Either `"wiki"`, `"grok"`, or `"both"` (default: `"both"`)
- `topicId` (string): The topic identifier from your catalog

**Example:**
```json
{
  "source": "both",
  "topicId": "moon"
}
```

Fetched data is stored in `~/.gwaln/data/wiki/<topic>.parsed.json` and `~/.gwaln/data/grok/<topic>.parsed.json`.

### Analysis

#### `analyze` - Compare and analyze topics

Run the analyzer to compare Wikipedia and Grokipedia content, detect discrepancies, and generate analysis reports.

**Parameters:**
- `topicId` (string): The topic identifier to analyze
- `force` (boolean, optional): Force re-analysis even if results exist
- `verifyCitations` (boolean, optional): Verify citations against Grokipedia references
- `biasVerifier` (object, optional): Gemini API settings for bias verification
  - `geminiKey` (string): Google Gemini API key
  - `geminiModel` (string): Model to use (default: "gemini-pro")
  - `geminiSummary` (boolean): Whether to generate summaries

**Example:**
```json
{
  "topicId": "moon",
  "force": true,
  "verifyCitations": true
}
```

Analysis results are stored in `~/.gwaln/analysis/<topic>.json` and `~/.gwaln/analysis/<topic>-report.html`.

#### `show` - Display analysis results

Display a summary of the analysis results in the terminal or generate an HTML dashboard.

**Parameters:**
- `topicId` (string): The topic identifier to display
- `renderHtml` (boolean, optional): Generate and return path to HTML report

**Example:**
```json
{
  "topicId": "moon",
  "renderHtml": true
}
```

### Community Notes

#### `notes` - Build and publish Community Notes

Create ClaimReview drafts and publish them to the OriginTrail DKG.

**Build a note:**
```json
{
  "action": "build",
  "topicId": "moon",
  "summary": "Grok omits the NASA mission context and adds speculative claims.",
  "accuracy": 3,
  "completeness": 3,
  "toneBias": 3,
  "stakeToken": "TRAC",
  "stakeAmount": 0
}
```

**Publish a note:**
```json
{
  "action": "publish",
  "topicId": "moon"
}
```

**Check publication status:**
```json
{
  "action": "status",
  "topicId": "moon"
}
```

Notes are stored in `~/.gwaln/notes/<topic>.json` and indexed in `~/.gwaln/notes/index.json`.

### Publishing

#### `publish` - Publish arbitrary JSON-LD assets

Publish any JSON-LD Knowledge Asset to the DKG (outside the Community Notes flow).

**Parameters:**
- `filePath` (string, optional): Path to JSON-LD file to publish
- `payload` (object, optional): Inline JSON-LD payload
- `privacy` (boolean, optional): Whether the asset is private
- `endpoint` (string, optional): Override DKG endpoint
- `environment` (string, optional): Override blockchain environment

**Example:**
```json
{
  "filePath": "~/.gwaln/notes/moon.json",
  "privacy": false
}
```

### Querying

#### `query` - Retrieve published Knowledge Assets

Retrieve previously published Community Notes from the DKG by topic title or UAL.

**Query by topic:**
```json
{
  "topic": "Moon",
  "save": "moon-retrieved"
}
```

**Query by UAL:**
```json
{
  "ual": "did:dkg:base:8453/0xc28f310a87f7621a087a603e2ce41c22523f11d7/666506",
  "save": "moon-retrieved"
}
```

The query command uses the DKG as the source of truth. It first checks for a local UAL cache, and if not found, searches the DKG directly using SPARQL to find the most recent published Community Note for the topic.

Results are saved to `~/.gwaln/data/dkg/<save-name>.json` if the `save` parameter is provided.

## Using the Plugin

### Via MCP Client

The plugin tools are exposed through the DKG node's MCP interface. Connect any MCP-compatible client (such as Claude Code, Cursor, or MCP Inspector) to your DKG node to access these tools.

1. Ensure your DKG node is running with the GWALN plugin registered
2. Connect your MCP client to the DKG node's MCP endpoint
3. Use the available tools (`fetch`, `analyze`, `notes`, `publish`, `query`, `show`, `lookup`) as needed

### Typical Workflow

1. **Lookup a topic**: Use `lookup` to find or discover topics in Grokipedia and Wikipedia
2. **Fetch snapshots**: Use `fetch` with `source="both"` to download Wikipedia and Grokipedia data
3. **Analyze**: Use `analyze` to compare content and generate discrepancy reports
4. **Review**: Use `show` to view analysis results and generate HTML reports
5. **Build note**: Use `notes` with `action="build"` to create a Community Note draft
6. **Publish**: Use `notes` with `action="publish"` to publish the note to the DKG
7. **Query**: Use `query` to retrieve previously published notes

All tools use the DKG node's configured credentials and settings automatically. Cached files and analysis results are stored in `~/.gwaln/` for reuse.

## Troubleshooting

**Analysis not found for topic**

* Ensure you've run `fetch` for both Wikipedia and Grokipedia sources before analyzing. Check that `~/.gwaln/data/wiki/<topic>.parsed.json` and `~/.gwaln/data/grok/<topic>.parsed.json` exist.

**DKG publish failed: UNAUTHORIZED**

* Ensure your DKG node is configured with valid `dkgPrivateKey`, `dkgPublicKey`, and endpoint values. Confirm the key has sufficient balance on the target blockchain.

**Plugin not available in MCP client**

* Verify the plugin is registered in your DKG node's server configuration and that the node is running. Check that the MCP endpoint is accessible.

## How to get help and report issues

* Report issues at the GitHub issue tracker for this repository.
* Ask questions by opening a discussion or contacting the maintainers on the project chat. You can expect a response within one week.

## Developer documentation

### Technical implementation

The plugin uses Node.js and integrates with the DKG node's plugin system via `@dkg/plugins`. Parsing is handled by a custom module that converts Wikipedia wikitext and Grokipedia HTML into identical structured JSON (lead/sections, sentences, claims, citations, media attachments). The analyzer stage:

* normalizes sentences into token sets and compares them to detect missing or extra context
* aligns sections and claims using cosine similarity from the `string-similarity` library
* computes numeric discrepancies via relative-difference heuristics and entity discrepancies via set symmetric differences
* flags bias/hallucination cues through lexicon scans plus subjectivity/polarity scoring

Optional verification hooks call the Gemini API for bias confirmation and run citation checks against Grokipedia references.

### Code structure

* `src/index.ts`: Plugin entry point that registers MCP tools
* `src/tools/`: Individual tool implementations (`fetch`, `analyze`, `show`, `notes`, `publish`, `query`, `lookup`)
* `src/lib/`: Reusable modules including the parser, analyzer, discrepancies, bias metrics, and DKG helpers (if present)
* `~/.gwaln/data/`: Cached structured snapshots per topic
* `~/.gwaln/analysis/`: Analyzer outputs (JSON + HTML report)
* `~/.gwaln/notes/`: JSON-LD Community Notes and index metadata

### Local development

#### Set up

1. Clone the repository and navigate to `packages/plugin-gwaln`
2. Install dependencies with `npm install`

#### Build

1. Build TypeScript sources:

   ```bash
   npm run build
   ```

#### Test

* Run tests:

  ```bash
  npm test
  ```

#### Debugging

* `Analysis not found`: Check `~/.gwaln/data/wiki` and `~/.gwaln/data/grok` for missing snapshots; rerun `fetch` tool.
* `Publish timeout`: Verify the DKG node endpoint is reachable and that your node configuration has valid credentials and sufficient blockchain balance.

## Credits

Developed by Doğu Abaris, Damjan Dimitrov and contributors. The project builds on the OriginTrail ecosystem and open-source libraries noted in `package.json`.
