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
    const chatCompletion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_completion_tokens: 1200,
        messages: [
            {
                role: "system",
                content: `
             You are a professional technical resume editor.

Your job is to rewrite resume content so it aligns with a given job description while keeping the information truthful.

Rules:
- Use facts ONLY from the OLD RESUME.
- Do NOT fabricate experience, projects, or skills.
- Improve wording to match keywords from the JOB DESCRIPTION.
- Keep bullet points concise and impact-focused.
- Do not repeat information.
- Maintain a professional resume tone.
- Keep the resume suitable for a single page.

HEADER:
Full name, role title, phone, email, LinkedIn, GitHub.

EXPERIENCE:
Each job with company, role, dates, and bullet points.

PROJECTS:
Project name, tech stack, and bullet points.

SKILLS:
List of technical skills grouped by category.

EDUCATION:
Degree, institution, and years.
Give only latex output. No commentry.
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
${oldResume}`
            }
        ]
    });

    const latexCode = chatCompletion.choices[0].message.content;
    return latexCode
}

const app = express()
const port = process.env.PORT || 3000
app.use(cors({
    origin: ["chrome-extension://fagohgjmefkeimffbdneigebbjkbppcp"]
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

        res.download(`temp/resume-${id}.pdf`, (err) => {
            if (!err) {
                fs.unlinkSync(`temp/resume-${id}.pdf`);
                fs.unlinkSync(`temp/resume-${id}.tex`);
                fs.unlinkSync(`temp/resume-${id}.aux`);
                fs.unlinkSync(`temp/resume-${id}.log`);
            }
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