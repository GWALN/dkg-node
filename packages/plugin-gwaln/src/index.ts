import { defineDkgPlugin, registerMcpMiddleware } from "@dkg/plugins";
import type { ZodRawShape, ZodTypeAny } from "zod";
import { createPaymentMiddleware } from "./lib/x402";
import {
  analyzeHandler,
  AnalyzeInputSchema,
  analyzeTool,
} from "./tools/analyze";
import { fetchHandler, FetchInputSchema, fetchTool } from "./tools/fetch";
import { lookupHandler, LookupInputSchema, lookupTool } from "./tools/lookup";
import { notesHandler, NotesInputSchema, notesTool } from "./tools/notes";
import {
  publishHandler,
  PublishInputSchema,
  publishTool,
} from "./tools/publish";
import { queryHandler, QueryInputSchema, queryTool } from "./tools/query";
import { showHandler, ShowInputSchema, showTool } from "./tools/show";
import { createToolLogger } from "./tools/utils";

// Helper to extract shape from Zod schema (handles ZodObject and ZodEffects)
const extractShape = (schema: ZodTypeAny): ZodRawShape => {
  if ("shape" in schema) {
    return schema.shape as ZodRawShape;
  }
  if ("_def" in schema && "schema" in schema._def) {
    return extractShape(schema._def.schema);
  }
  if ("_def" in schema && "innerType" in schema._def) {
    return extractShape(schema._def.innerType);
  }
  return {};
};

export default defineDkgPlugin(async (_, mcp) => {
  const logger = createToolLogger();

  registerMcpMiddleware(
    await createPaymentMiddleware({
      description: "GWALN MCP tools",
    })
  );

  mcp.registerTool(
    "fetch",
    {
      title: fetchTool.title,
      description: fetchTool.description,
      inputSchema: extractShape(FetchInputSchema),
    },
    async (input) => {
      const validated = FetchInputSchema.parse(input);
      return await fetchHandler(validated);
    }
  );
  mcp.registerTool(
    "analyze",
    {
      title: analyzeTool.title,
      description: analyzeTool.description,
      inputSchema: extractShape(AnalyzeInputSchema),
    },
    async (input) => {
      const validated = AnalyzeInputSchema.parse(input);
      return await analyzeHandler(validated, logger);
    }
  );
  mcp.registerTool(
    "notes",
    {
      title: notesTool.title,
      description: notesTool.description,
      inputSchema: extractShape(NotesInputSchema),
    },
    async (input) => {
      const validated = NotesInputSchema.parse(input);
      return await notesHandler(validated);
    }
  );
  mcp.registerTool(
    "publish",
    {
      title: publishTool.title,
      description: publishTool.description,
      inputSchema: extractShape(PublishInputSchema),
    },
    async (input) => {
      const validated = PublishInputSchema.parse(input);
      return await publishHandler(validated);
    }
  );
  mcp.registerTool(
    "query",
    {
      title: queryTool.title,
      description: queryTool.description,
      inputSchema: extractShape(QueryInputSchema),
    },
    async (input) => {
      const validated = QueryInputSchema.parse(input);
      return await queryHandler(validated);
    }
  );
  mcp.registerTool(
    "show",
    {
      title: showTool.title,
      description: showTool.description,
      inputSchema: extractShape(ShowInputSchema),
    },
    async (input) => {
      const validated = ShowInputSchema.parse(input);
      return await showHandler(validated);
    }
  );
  mcp.registerTool(
    "lookup",
    {
      title: lookupTool.title,
      description: lookupTool.description,
      inputSchema: extractShape(LookupInputSchema),
    },
    async (input) => {
      const validated = LookupInputSchema.parse(input);
      return await lookupHandler(validated);
    }
  );
});
