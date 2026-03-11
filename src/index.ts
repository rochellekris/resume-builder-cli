#!/usr/bin/env node
// CLI entry point. Two subcommands:
//   generate  — interactive prompts or --from-json flag
//   init      — scaffold a blank resume.json in the cwd

import { program } from "commander";
import fs from "fs";
import path from "path";
import { collectResume } from "./prompts/collect.js";
import { buildDocx } from "./builders/docx.js";
import { buildTex } from "./builders/tex.js";
import type { Resume, OutputFormat } from "./types/resume.js";

program
    .name("resume")
    .description("Build a professional resume as a .docx or .tex file")
    .version("1.0.0");

// ── generate ──────────────────────────────────────────────────────────────
const generate = program
    .command("generate")
    .description("Generate a resume");

// resume generate new
generate
    .command("new")
    .description("Generate a resume interactively via prompts")
    .option("-f, --format <format>", "Output format: docx or tex", "docx")
    .option("-o, --output <path>", "Output file path (default: ./<name>_resume.<format>)")
    .action(async (opts: { format: string; output?: string }) => {
        const resume = await collectResume();
        await buildAndSave(resume, opts.format, opts.output, /* interactive */ true);
    });

// resume generate json <path>
generate
    .command("json <path>")
    .description("Generate a resume from an existing JSON file")
    .option("-f, --format <format>", "Output format: docx or tex", "docx")
    .option("-o, --output <path>", "Output file path (default: ./<name>_resume.<format>)")
    .action(async (jsonArg: string, opts: { format: string; output?: string }) => {
        const jsonPath = path.resolve(jsonArg);
        if (!fs.existsSync(jsonPath)) {
            console.error(`❌  File not found: ${jsonPath}`);
            process.exit(1);
        }
        const resume = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as Resume;
        console.log(`�  Loaded resume from ${jsonPath}`);
        await buildAndSave(resume, opts.format, opts.output, /* interactive */ false);
    });

// ── shared build helper ───────────────────────────────────────────────────
async function buildAndSave(resume: Resume, formatStr: string, outputOpt: string | undefined, interactive: boolean) {
    const format = formatStr as OutputFormat;
    if (format !== "docx" && format !== "tex") {
        console.error(`❌  Unknown format "${format}". Use "docx" or "tex".`);
        process.exit(1);
    }

    const defaultName = resume.personal.name.toLowerCase().replace(/\s+/g, "_") + `_resume.${format}`;
    const outputPath = path.resolve(outputOpt ?? defaultName);

    if (format === "docx") {
        await buildDocx(resume, outputPath);
    } else {
        buildTex(resume, outputPath);
    }

    console.log(`\n✅  Saved: ${outputPath}`);

    if (interactive) {
        const { default: inquirer } = await import("inquirer");
        const { save } = await inquirer.prompt([
            { name: "save", message: "Save your answers to resume.json for future edits?", type: "confirm", default: true },
        ]);
        if (save) {
            const jsonOut = path.resolve("resume.json");
            fs.writeFileSync(jsonOut, JSON.stringify(resume, null, 2), "utf8");
            console.log(`💾  Saved: ${jsonOut}`);
        }
    }
}

// ── init ──────────────────────────────────────────────────────────────────
program
    .command("init")
    .description("Scaffold a blank resume.json in the current directory")
    .action(() => {
        const dest = path.resolve("resume.json");
        if (fs.existsSync(dest)) {
            console.log(`⚠️   resume.json already exists at ${dest}`);
            return;
        }
        const blank: Resume = {
            personal: { name: "", city: "", state: "", phone: "", email: "" },
            summary: "",
            experience: [],
            education: [],
            skills: [],
            projects: [],
            certifications: [],
        };
        fs.writeFileSync(dest, JSON.stringify(blank, null, 2), "utf8");
        console.log(`✅  Created resume.json — fill it in, then run: resume generate json resume.json`);
    });

program.parse();
