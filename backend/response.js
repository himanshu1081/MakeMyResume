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

async function importantPoints(jobdescription) {
    const chatCompletion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        temperature: 0.2,
        max_completion_tokens: 700,
        messages: [
            {
                role: "system",
                content: `You are given a jobdescription from linkedIn. You have to find revevant key points from the jd and return important parts from it which will later be given to an api for better resume building via latex code.`
            },
            {
                role: "user",
                content: `JOB DESCRIPTION: ${jobdescription}`
            }
        ]
    });

    return chatCompletion.choices[0].message.content;
}
function sanitizeLatex(latex) {

    // fix common LLM mistakes
    latex = latex.replace(/\\titleformat{section}/g, "\\titleformat{\\\\section}");
    latex = latex.replace(/\\titlespacing{section}/g, "\\titlespacing{\\\\section}");

    // ensure document exists
    if (!latex.includes("\\begin{document}")) {
        throw new Error("Invalid LaTeX: missing document start");
    }

    if (!latex.includes("\\end{document}")) {
        throw new Error("Invalid LaTeX: missing document end");
    }

    return latex;
}

async function getLatex(oldResume, jobdescription, linkedInUrl = "", githubUrl = "") {
    const chatCompletion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_completion_tokens: 1200,
        messages: [
            {
                role: "system",
                content: `You are a professional technical resume writer and LaTeX formatter.

Extract facts ONLY from OLD RESUME.
Escape all LaTeX special characters if present in the job description.
Rewrite bullet points to align with job description keywords while preserving original meaning.
Do NOT fabricate information.
Tailor wording to match JOB DESCRIPTION keywords.
links for the github and linkedin is given as well,if not provided then dont add it to the resume.
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
Education
Use the format for the resume given below.
Format:
\\documentclass[10pt, letterpaper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.5in]{geometry}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{xcolor}

% Formatting
\titleformat{\section}{\large\bfseries}{}{0pt}{}[\titlerule]
\titlespacing{\section}{0pt}{12pt}{6pt}
\setlist[itemize]{itemsep=3pt, topsep=4pt, leftmargin=*}
\setlength{\parindent}{0pt}
\setlength{\parskip}{4pt}
\pagestyle{empty}
\\usepackage{hyperref}

\hypersetup{
    colorlinks=true,
    urlcolor=blue,
    linkcolor=blue
}
\begin{document}

% Header
\begin{center}
    {\huge \textbf{Himanshu Chaudhary}} \\
    \vspace{6pt}
    Full Stack Developer \\
    \vspace{6pt}
   \href{tel:+916398776703}{+91 6398776703} \textbar\ 
\href{mailto:himanshuatwork02@gmail.com}{himanshuatwork02@gmail.com} \textbar\ 
\href{https://www.linkedin.com/in/himanshu1081/}{LinkedIn} \textbar\ 
\href{https://github.com/himanshu1081}{GitHub}
\end{center}

% Experience
\section*{Experience}

\textbf{Junior Full Stack Developer (AI Implementation)} \hfill Aug 2025 -- Present \\
Mindmesh Consulting Ltd (UK-based Agency)
\begin{itemize}
    \item Assisted in implementing AI-powered chatbot solutions for client websites under senior developer guidance.
    \item Integrated LLM APIs into existing web applications to enable automated customer query handling.
    \item Developed backend routes and frontend UI components for chatbot interaction workflows.
    \item Tested, debugged, and deployed chatbot features across multiple client projects.
\end{itemize}

\textbf{Freelance Frontend Developer} \hfill Feb 2026 -- Present \\
Balkan Cleaning - \href{https://www.balkancleaning.co.uk/}{Live}
\begin{itemize}
    \item Developed and deployed a production business website for a UK-based client.
    \item Built responsive UI using Vite + React and handled full deployment lifecycle.
\end{itemize}


\textbf{Full Stack Developer Intern (Frontend-Focused)} \hfill Jun 2025 -- Jul 2025 \\
Innovation House Technology Private Limited
\begin{itemize}
    \item Built MERN stack features with primary focus on React-based frontend development.
    \item Integrated frontend with REST APIs using Node.js and Express.
\end{itemize}




% Projects
% Projects
\section*{Projects}

\textbf{Vexa -- AI Chat Application (Gen AI)} \hfill Nov 2025 -- Present \\
Tech Stack: Next.js, Supabase, OpenAI API \\
\href{https://vexa4ai.vercel.app/}{Live} \;|\; 
\href{https://github.com/himanshu1081/vexa}{GitHub}
\begin{itemize}
    \item Built an AI-powered chat application with real-time responses.
    \item Implemented infinite scrolling for chat history, optimizing message fetching and reducing redundant database reads.
    \item Integrated Supabase for authentication and persistent chat storage.
\end{itemize}

\textbf{Vastora -- YouTube-like Video Streaming Platform} \hfill Jun 2025 -- Aug 2025 \\
Tech Stack: MERN Stack (MongoDB, Express.js, React.js, Node.js), JWT \\
\href{https://vastora.vercel.app/}{Live} \;|\; 
\href{https://github.com/himanshu1081/vastora}{GitHub}
\begin{itemize}
    \item Developed a full-stack video streaming platform with authentication and protected routes using JWT.
    \item Optimized data retrieval using MongoDB aggregation pipelines.
\end{itemize}

% Technical Skills
\section*{Technical Skills}

\textbf{Frontend:} React.js, Next.js, JavaScript, TypeScript, HTML5, CSS3, Tailwind CSS \\
\textbf{Backend:} Node.js, Express.js, REST APIs \\
\textbf{AI \& APIs:} OpenAI API, LLM Integration, Chatbot Architecture \\
\textbf{Databases:} MongoDB, MySQL, PostgreSQL, Supabase \\
\textbf{DevOps \& Tools:} Linux(Basics), Git, CI/CD Fundamentals, Vercel, AWS (Basics)

% Education
\section*{Education}

\textbf{Bachelor of Computer Applications (BCA)} \hfill 2023 -- 2026 \\
Jaypee Institute of Information Technology, Noida Sector 62, Uttar Pradesh

\end{document}`
            },
            {
                role: "user",
                content: `
                JOB DESCRIPTION:${jobdescription}
                LinkedIn Url :${linkedInUrl}
                Github Url :${githubUrl}

OLD RESUME:
${oldResume}`
            }
        ]
    });

    const latexCode = chatCompletion.choices[0].message.content;
    return sanitizeLatex(latexCode);
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

        //getting important points from the jd.
        const important_points = await importantPoints(req.body.jobdescription)
        const latex = await getLatex(oldResume.text, important_points, req.body.linkedInUrl, req.body.githubUrl)
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