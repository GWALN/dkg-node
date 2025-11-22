import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import { v7 as uuidv7 } from "uuid";

export const registerMcp = (
  api: express.Router,
  getServer: () => McpServer,
  middleware?: express.RequestHandler[]
) => {
  const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

  const handleSessionRequest: express.RequestHandler = async (req, res) => {
    const sessionId = req.headers["mcp-session-id"]?.toString() ?? "";
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send("Invalid or missing session ID");
    } else {
      const transport = transports[sessionId];
      await transport.handleRequest(req, res);
    }
  };

  const postHandlers: express.RequestHandler[] = [];
  if (middleware) {
    postHandlers.push(...middleware);
  }
  postHandlers.push(async (req, res) => {
    const sessionId = req.headers["mcp-session-id"]?.toString() ?? "";
    let transport = transports[sessionId];
    if (!transport && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => uuidv7(),
        onsessioninitialized: (sessionId) => {
          transports[sessionId] = transport!;
        },
      });
      transport.onerror = console.error.bind(console);
      transport.onclose = () => {
        if (transport?.sessionId) {
          delete transports[transport.sessionId];
        }
      };
      await getServer().connect(transport);
    }
    if (!transport) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: null,
      });
    } else {
      await transport.handleRequest(req, res, req.body);
    }
  });

  api.get("/mcp", handleSessionRequest);
  api.post("/mcp", ...postHandlers);
  api.delete("/mcp", handleSessionRequest);
};
