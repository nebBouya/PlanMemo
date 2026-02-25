import safeAsync from "../api/safeAsync.js";
import { toast } from "../api/toast.js";
import { getGroupsCount } from "../db/tables/groups/services.js";
import { getNotesCount } from "../db/tables/notes/services.js";
import { getTasksByDate, getTasksByStatus, getTasksCount } from "../db/tables/tasks/services.js";
import { splitDate } from "../services/tokens.js";
import { currentUser } from "./init.js";

function openPrintableResume(contentHTML, title = "Résumé") {
    const printWindow = window.open("", "_blank", "width=800,height=600");

    if (!printWindow) {
        return alert("Impossible d'ouvrir la fenêtre d'impression.");
    }

    printWindow.document.write(`
        <html>
            <head>
                <title>${title}</title>
                <style>
                    body {
                        font-family: sans-serif;
                        padding: 2rem;
                        line-height: 1.6;
                        box-sizing: border-box;
                        margin: 0;
                    }
                    h1, h2 {
                        margin-top: 1.5rem;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 1rem;
                    }
                    td, th {
                        padding: 0.5rem;
                        border: 1px solid #ccc;
                    }
                    ul {
                        padding-left: 1.2rem;
                    }

                    @page {
                        size: A4;
                        margin: 20mm;
                    }

                    @media print {
                        html, body {
                            width: 210mm;
                            height: 297mm;
                            margin: 0;
                            padding: 0;
                            zoom: 100%;
                        }

                        button {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <button onclick="window.print()">🖨️ Imprimer</button>
                ${contentHTML}
            </body>
        </html>
    `);

    printWindow.document.close();
}

function generateResumeHTML(userData) {
    return `
        <h1>Résumé de productivité</h1>
        <p><strong>Nom :</strong> ${userData.fullName}</p>
        <p><strong>Date :</strong> ${userData.date.toLocaleDateString()}</p>

        <h2>Statistiques générales</h2>
        <ul>
            <li>Tâches totales : ${userData.totalTasks}</li>
            <li>Tâches actives : ${userData.activeTasks}</li>
            <li>Tâches terminées : ${userData.doneTasks}</li>
            <li>Notes : ${userData.notesCount}</li>
            <li>Groupes de tâches : ${userData.groupsCount}</li>
        </ul>

        <h2>Tâches d'aujourd'hui</h2>
        <table>
            <tr><th>✅</th><th>Titre</th></tr>
            ${userData.todayTasks.map(task => `
                <tr>
                    <td>${task.status === "done" ? "☑️" : "☐"}</td>
                    <td>${task.title}</td>
                </tr>
            `).join("")}
        </table>

        <h2>Tâches terminées</h2>
        <ul>
            ${userData.doneList.map(task => `<li>${task.title}</li>`).join("")}
        </ul>
    `;
}

async function collectUserStats() {
    const date = new Date();
    const today = splitDate(date);
    const { firstName, lastName } = currentUser();

    try {
        const [
            totalTasks,
            todayTasks,
            doneList,
            notesCount,
            groupsCount
        ] = await Promise.all([
            getTasksCount(),
            getTasksByDate(today),
            getTasksByStatus(["done", "temp_finished"]),
            getNotesCount(),
            getGroupsCount()
        ]);

        if (
            !Array.isArray(todayTasks) ||
            !Array.isArray(doneList) ||
            typeof totalTasks !== "number" ||
            typeof notesCount !== "number" ||
            typeof groupsCount !== "number"
        ) {
            throw new Error("Stat data is invalid.");
        }

        return {
            fullName: `${firstName} ${lastName}`,
            totalTasks,
            activeTasks: todayTasks.length,
            doneTasks: doneList.length,
            notesCount,
            groupsCount,
            todayTasks,
            doneList,
            date
        };
    } catch (err) {
        throw new Error(`Failed to collect user statistics: ${err.message}`);
    }
}


export const exportSummary = safeAsync(async () => {
    const stats = await collectUserStats();
    const resumeHTML = generateResumeHTML(stats);
    openPrintableResume(resumeHTML);
}, () => {
    toast.error("Impossible d'exporter le résumé. Veuillez réessayer.");
});
