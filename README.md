# Highgo MCP Server (瀚高数据库 MCP 服务)

这是一个基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 实现的瀚高数据库 (Highgo Database) 服务。它允许 AI 智能体（如 Claude Desktop, Gemini CLI 等）直接连接、查询和分析瀚高数据库中的数据。

## 特性

- **SQL 执行**: 支持执行任意 SQL 语句，包括瀚高特有的 SM3 加密和语法。
- **Schema 管理**: 支持通过 `search_path` 动态切换工作 schema。
- **元数据查询**: 快速列出库中的表结构、字段类型及注释。
- **独立分发**: 支持通过 `npx` 直接运行，无需全局安装。

## 快速开始

### 1. 前置条件

- 已安装 Node.js (建议 v18+)
- 瀚高数据库的连接信息

### 2. 数据库配置

在项目根目录下创建一个 `.env` 文件，或者在运行环境中设置以下环境变量：

```env
HIGHGO_HOST=172.22.*.*
HIGHGO_PORT=5866
HIGHGO_USER=用户名
HIGHGO_PASSWORD=您的密码
HIGHGO_DATABASE=数据库名
```

### 3. 使用 npx 运行 (推荐)

如果您在本地开发，可以直接在项目目录运行：

```bash
npx .
```

如果您已将其发布到 NPM 或作为 Git 依赖引用，可以远程运行：

```bash
npx highgo-mcp-server
```

## 在 AI 智能体中配置

### Claude Desktop
修改您的 `claude_desktop_config.json` 文件：

```json
{
  "mcpServers": {
    "highgo": {
      "command": "npx",
      "args": ["-y", "/path/to/highgo-test"],
      "env": {
        "HIGHGO_HOST": "172.22.*.*",
        "HIGHGO_USER": "用户名",
        "HIGHGO_PASSWORD": "您的密码",
        "HIGHGO_DATABASE": "数据库名"
      }
    }
  }
}
```

### Gemini CLI
在配置文件中添加类似的条目。

## 可用工具 (Tools)

1. **`query`**: 执行 SQL 查询。
   - 参数: `sql` (必填), `search_path` (可选)。
2. **`list_tables`**: 查看指定 Schema 下的所有表。
   - 参数: `schema` (默认 "public")。
3. **`describe_table`**: 查看表的详细列信息。
   - 参数: `table_name` (必填), `schema` (默认 "public")。

## 本地开发

```bash
# 安装依赖
npm install

# 本地链接以便测试
npm link

# 直接运行
node bin/mcp-server.js
```

## 许可证

ISC
