#!/usr/bin/env node

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const { Client } = require('../drivers/highgodb');
const path = require('path');

// 尝试从当前目录加载 .env 文件
require('dotenv').config();

const config = {
  host: process.env.HIGHGO_HOST || '172.22.4.59',
  port: parseInt(process.env.HIGHGO_PORT || '5866'),
  user: process.env.HIGHGO_USER || 'sysdba',
  password: process.env.HIGHGO_PASSWORD || 'YantaiHg2025@',
  database: process.env.HIGHGO_DATABASE || 'data_trade',
};

const server = new Server(
  {
    name: "highgo-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 定义可用工具
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "query",
        description: "在瀚高数据库上执行 SQL 查询。支持查询和修改操作。可以使用 search_path 切换 schema。",
        inputSchema: {
          type: "object",
          properties: {
            sql: { type: "string", description: "要执行的 SQL 语句" },
            search_path: { type: "string", description: "可选：设置 search_path (例如: 'opet_meishan, public')" }
          },
          required: ["sql"],
        },
      },
      {
        name: "list_tables",
        description: "列出指定 schema 中的所有表。",
        inputSchema: {
          type: "object",
          properties: {
            schema: { type: "string", description: "Schema 名称，默认为 'public'", default: "public" }
          }
        },
      },
      {
        name: "describe_table",
        description: "获取表的列信息和数据类型。",
        inputSchema: {
          type: "object",
          properties: {
            table_name: { type: "string", description: "表名" },
            schema: { type: "string", description: "Schema 名称", default: "public" }
          },
          required: ["table_name"],
        },
      }
    ],
  };
});

// 实现工具调用逻辑
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const client = new Client(config);
  try {
    await client.connect();

    switch (request.params.name) {
      case "query": {
        const { sql, search_path } = request.params.arguments;
        if (search_path) {
          await client.query(`SET search_path TO ${search_path};`);
        }
        const res = await client.query(sql);
        return {
          content: [{ type: "text", text: JSON.stringify(res.rows || res, null, 2) }],
        };
      }

      case "list_tables": {
        const schema = request.params.arguments.schema || 'public';
        const res = await client.query(
          "SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE';",
          [schema]
        );
        return {
          content: [{ type: "text", text: res.rows.map(r => r.table_name).join('\n') }],
        };
      }

      case "describe_table": {
        const { table_name, schema = 'public' } = request.params.arguments;
        const res = await client.query(
          "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 AND table_schema = $2 ORDER BY ordinal_position;",
          [table_name, schema]
        );
        return {
          content: [{ type: "text", text: JSON.stringify(res.rows, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  } finally {
    try {
      await client.end();
    } catch (e) {
      // 忽略关闭连接时的错误
    }
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
