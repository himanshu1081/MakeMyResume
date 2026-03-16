import express from "express"
import multer from "multer";
import dotenv from "dotenv"
import { PDFParse } from 'pdf-parse';
import fs from "fs"
import { Groq } from 'groq-sdk';
import { exec } from "child_process";
import { promisify } from "util";
import cors from "cors"
dotenv.config()


const execAsync = promisify(exec)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

if (!fs.existsSync("temp")) {
    fs.mkdirSync("temp");
}

async function getPDF(latex) {
    const id = Date.now();
    fs.writeFileSync(`temp/resume-${id}.tex`, latex)
    await execAsync(`pdflatex -interaction=nonstopmode -output-directory=temp temp/resume-${id}.tex`)
    console.log("file created")
    return { id }
}


async function getLatex(oldResume, jobdescription, linkedInUrl = "", githubUrl = "") {

    oldResume = oldResume.slice(0, 8000)
    jobdescription = jobdescription.slice(0, 4000)

    const latexTemplate = `
\\documentclass[10pt,letterpaper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.5in]{geometry}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}

\\titleformat{\\section}{\\large\\bfseries}{}{0pt}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{12pt}{6pt}
\\setlist[itemize]{itemsep=3pt, topsep=4pt, leftmargin=*}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{4pt}
\\pagestyle{empty}

\\begin{document}

\\begin{center}
{\\huge \\textbf{NAME}} \\\\
ROLE \\\\
PHONE | EMAIL | LINKEDIN | GITHUB
\\end{center}

\\section*{Experience}
EXPERIENCE

\\section*{Projects}
PROJECTS

\\section*{Technical Skills}
SKILLS

\\section*{Education}
EDUCATION

\\end{document}
`;

    const chatCompletion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.15,
        max_completion_tokens: 1200,
        messages: [
            {
                role: "system",
                content: `
You are a professional technical resume writer and LaTeX formatter.

Your task is to tailor a resume to match a job description.

STRICT RULES:

- Extract facts ONLY from OLD RESUME.
- NEVER fabricate companies, projects, roles, or skills.
- Rewrite wording to better match JOB DESCRIPTION keywords.
- Keep resume concise and one-page friendly.
- Bullet points must be short and impact-focused.

LATEX RULES:

- Output ONLY valid LaTeX.
- No markdown.
- No explanations.
- No comments.

CRITICAL INSTRUCTION:

You MUST reuse the EXACT LaTeX template provided.

DO NOT modify:
- documentclass
- packages
- formatting
- section layout

ONLY replace the following placeholders:

NAME  
ROLE  
PHONE  
EMAIL  
LINKEDIN  
GITHUB  
EXPERIENCE  
PROJECTS  
SKILLS  
EDUCATION

Each experience should contain 3–4 bullet points.
Each project should contain 2–3 bullet points.

Return the COMPLETE LaTeX document.

TEMPLATE:
${latexTemplate}
`
            },
            {
                role: "user",
                content: `
JOB DESCRIPTION:
${jobdescription}

LINKEDIN:
${linkedInUrl}

GITHUB:
${githubUrl}

OLD RESUME:
${oldResume}
`
            }
        ]
    });

    return chatCompletion.choices[0].message.content;
}

const app = express()
const port = process.env.PORT || 3000
app.use(cors({
    origin: ["chrome-extension://fagohgjmefkeimffbdneigebbjkbppcp", ""]
}
))
app.use(express.urlencoded({ extended: false }))

if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf')
    }
})
const upload = multer({ storage })


app.post('/getresume', upload.single("oldResume"), async (req, res) => {
    try {
        console.log("hit server")
        const filepath = req.file.path;

        const buffer = fs.readFileSync(filepath);

        const parser = new PDFParse({ data: buffer });

        const oldResume = await parser.getText();
        console.log("old resume fetched")
        await parser.destroy();

        const latex = await getLatex(oldResume.text, req.body.jobdescription, req.body.linkedInUrl, req.body.githubUrl)
        console.log("latex code recevied from grok")
        fs.unlinkSync(filepath)
        const { id } = await getPDF(latex);
        console.log("sending file:", `temp/resume-${id}.pdf`)
        res.download(`temp/resume-${id}.pdf`, (err) => {
            if (err) {
                console.error("Download error:", err)
                return
            }

            setTimeout(() => {
                fs.unlinkSync(`temp/resume-${id}.pdf`)
                fs.unlinkSync(`temp/resume-${id}.tex`)
                fs.unlinkSync(`temp/resume-${id}.aux`)
                fs.unlinkSync(`temp/resume-${id}.log`)
            }, 5000)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "PDF extraction failed" });
    }
})

app.get('/cronJob', (req, res) => {
    res.sendStatus(200);
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})