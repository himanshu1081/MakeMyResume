import express from "express"
import OpenAI from "openai";
import multer from "multer";
import dotenv from "dotenv"
import { PDFParse } from 'pdf-parse';
import fs from "fs"
import { Groq } from 'groq-sdk';
dotenv.config()

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


async function getLatex(oldResume, jobdescription) {
    const chatCompletion = await groq.chat.completions.create({
        model: "groq/compound",
        temperature: 0.2,
        max_completion_tokens: 1200,
        messages: [
            {
                role: "system",
                content: `You are a professional technical resume writer and LaTeX formatter.

Extract facts ONLY from OLD RESUME.
Do NOT fabricate information.
Tailor wording to match JOB DESCRIPTION keywords.
Keep resume strictly one page.
Output ONLY valid LaTeX.
No markdown.
No explanations.
No comments.
Use 10pt article class.
Margin 0.5in.
Use only: geometry, titlesec, enumitem, hyperref.
No unusual spacing commands.
Tight formatting.
Structure:
Header
Experience
Projects
Technical Skills
Education`
            },
            {
                role: "user",
                content: `JOB DESCRIPTION:
${jobdescription}

OLD RESUME:
${oldResume}`
            }
        ]
    });

    const latexCode = chatCompletion.choices[0].message.content;
    return latexCode;
}

const app = express()
const port = 3000

app.use(express.urlencoded({ extended: false }))

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
        const filepath = req.file.path;

        const buffer = fs.readFileSync(filepath);

        const parser = new PDFParse({ data: buffer });

        const oldResume = await parser.getText();
        await parser.destroy();
        const latex = getLatex(oldResume.text,req.body.jobdescription)
        fs.unlinkSync(filepath)
        buildPDF(latex)

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "PDF extraction failed" });
    }
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})