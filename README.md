# resume-builder-cli

A CLI tool that walks you through building a resume and exports it as a `.docx` or `.tex` file. Also ships as an **MCP server** so Claude can build and edit your resume via natural language in VS Code or Claude Desktop.

---

## Prerequisites

- **Node.js 18+** — install via [nodejs.org](https://nodejs.org) or `brew install node`

---

## Quick Start

```bash
git clone https://github.com/rochellekris/resume-builder-cli.git
cd resume-builder-cli
npm install
npm run build
```

---

## CLI Usage

After building, link the CLI globally so you can use the `resume` command anywhere:

```bash
npm run build
npm link
```

### Interactive mode

```bash
resume generate new
```

### From a JSON file

```bash
resume generate json resume.json
resume generate json resume.json --format tex
resume generate json resume.json --format docx --output my_resume.docx
```

### Scaffold a blank resume.json

```bash
resume init
```

### Generate sample resume (Jordan Hayes)

```bash
npm run generate-sample
```

---

## Output Formats

| Format | Description |
|--------|-------------|
| `.docx` | Microsoft Word — open in Word, Google Docs, or Pages |
| `.tex` | LaTeX — compile with `pdflatex` or paste into [Overleaf](https://overleaf.com) |

---

## MCP Server (Claude Integration)

The MCP server lets Claude read and edit your resume via natural language.

### Setup for VS Code (Copilot)

1. Build the project: `npm run build`
2. The `.mcp.json` in the repo root is already configured — VS Code picks it up automatically.

### Setup for Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "resume": {
      "command": "node",
      "args": ["/absolute/path/to/resume-builder-cli/dist/mcp/server.js"]
    }
  }
}
```

### Available MCP Tools

| Tool | What it does |
|------|-------------|
| `load_resume` | Reads `resume.json` from the workspace |
| `update_section` | Updates a single field by dot-notation path |
| `export_resume` | Re-renders `resume.json` to `.docx` or `.tex` |
| `build_resume` | One-shot: accepts a full Resume JSON object and exports it |

### Example Claude prompts

- *"Load my resume and show me my experience section"*
- *"Change the end date of Brightly to December 2025"*
- *"Add a new bullet to my Vantage Labs job: 'Reduced deploy time by 50%'"*
- *"Update my email to jordan@newdomain.com"*
- *"Export my resume as a .tex file"*

Claude calls `load_resume` → `update_section` → `export_resume` in sequence, targeting exactly the field you described.

---

## resume.json Schema

`startDate` and `endDate` are **separate fields** so Claude can target either one independently.

```json
{
  "personal": { "name": "", "city": "", "state": "", "phone": "", "email": "" },
  "summary": "...",
  "experience": [
    {
      "title": "", "company": "", "location": "",
      "startDate": "June 2022", "endDate": "Present",
      "bullets": []
    }
  ],
  "education": [{ "degree": "", "school": "", "location": "", "graduationDate": "" }],
  "skills": [{ "category": "Languages", "items": [] }],
  "projects": [{ "name": "", "type": "", "description": "", "bullets": [] }],
  "certifications": []
}
```

---

## Project Structure

```
src/
├── index.ts              # CLI entry point (Commander.js)
├── types/resume.ts       # Shared TypeScript types
├── builders/
│   ├── docx.ts           # .docx generator
│   └── tex.ts            # .tex generator
├── prompts/collect.ts    # Interactive Inquirer.js prompts
└── mcp/server.ts         # MCP server (stdio transport)

sample/
├── jordan_hayes_resume.json   # Sample resume (source of truth)
├── jordan_hayes_resume.docx   # Generated .docx
├── jordan_hayes_resume.tex    # Generated .tex
└── generate_sample.py         # Original Python prototype
```

---

## Development

```bash
npm run dev       # Watch mode
npm run build     # Compile TypeScript
npm run mcp       # Start MCP server manually
resume --help     # View all commands
```

> **Note:** The `.gitignore` excludes root-level generated files (`*.docx`, `*.pdf`, `*.tex`, `resume.json`) and LaTeX build artifacts. The `sample/` files are committed intentionally as reference output.
