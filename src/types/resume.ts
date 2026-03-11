// The Resume type is the single source of truth across all builders,
// the CLI prompts, and the MCP tools. Every field is granular enough
// for Claude to target individually (e.g. endDate vs a combined "dates" string).

export interface PersonalInfo {
    name: string;
    city: string;
    state: string;
    zip?: string;
    phone: string;
    email: string;
    linkedin?: string;
    github?: string;
    website?: string;
}

export interface ExperienceEntry {
    title: string;
    company: string;
    location: string;
    startDate: string;   // e.g. "June 2022"
    endDate: string;     // e.g. "Present" or "December 2025"
    bullets: string[];
}

export interface EducationEntry {
    degree: string;
    school: string;
    location: string;
    graduationDate: string;
    gpa?: string;
    coursework?: string[];
}

export interface SkillCategory {
    category: string;   // e.g. "Languages"
    items: string[];    // e.g. ["TypeScript", "Python"]
}

export interface ProjectEntry {
    name: string;
    type: string;       // e.g. "Personal Project" | "Open Source Contributor"
    description: string;
    bullets: string[];
}

export interface Resume {
    personal: PersonalInfo;
    summary?: string;
    experience: ExperienceEntry[];
    education: EducationEntry[];
    skills: SkillCategory[];
    projects?: ProjectEntry[];
    certifications?: string[];
}

export type OutputFormat = "docx" | "tex";
