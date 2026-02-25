import h from "../../../api/h.js";
import { effect, computed } from "../../../api/signals.js";
import safeAsync from "../../../api/safeAsync.js"
import { getTaskById, updateSubtask, updateTask } from "../../../db/tables/tasks/services.js";
import { pomodoroTimer } from "../store.js";
import { createProgress } from "../../createProgress.js";
import { toast } from "../../../api/toast.js";
import { refreshVisibleTaskSignal } from "../../refreshTasksView.js";


export function renderProgressCard(rerenderTasks) {
    const {
        isBreak,
        progress,
        currentTime,
        playingTaskId,
        iteration,
        sessionPlan,
        planMeta,
        skipBreaks
    } = pomodoroTimer.state;

    const totalFocusSessions = computed(() =>
        sessionPlan().filter(s => s.type === "focus").length
    );
    const totalBreakSessions = computed(() =>
        sessionPlan().filter(s => s.type === "break").length
    );

    const currentFocusCount = computed(() =>
        sessionPlan().slice(0, iteration()).filter(s => s.type === "focus").length
    );
    const currentBreakCount = computed(() =>
        sessionPlan().slice(0, iteration()).filter(s => s.type === "break").length
    );

    const wrapper = h("section", {
        class: "pomodoro-screen--progress-card",
        "aria-labelledby": "pomodoro-progress-title"
    });

    const sessionTitle = h("h3", { id: "pomodoro-progress-title" });
    const sessionDesc = h("p", { class: "pomodoro-screen--progress-card__description" });

    effect(() => {
        const is_break = isBreak();
        const is_break_skipped = skipBreaks();
        sessionTitle.textContent = is_break ? "Pause" : "Période de concentration";
        sessionDesc.textContent = is_break
            ? "Profitez de votre pause pour vous détendre."
            : is_break_skipped
                ? "Vous êtes en pleine session de travail."
                : "Vous êtes en pleine session de travail. Restez concentré jusqu’à la prochaine pause.";
    });

    const planNotice = h("p", { class: "pomodoro-progress-notice visually-hidden", "aria-live": "polite" });

    effect(() => {
        const meta = planMeta();
        if (!meta) {
            planNotice.classList.add("visually-hidden");
            planNotice.textContent = "";
            return;
        }
        if (meta.reason === "breaks_skipped") {
            planNotice.textContent = "Les pauses sont ignorées car le temps est trop court ou l'option 'ignorer les pauses' est activée.";
            planNotice.classList.remove("visually-hidden");
        } else if (meta.reason === "short_time_single_focus") {
            planNotice.textContent = "Le temps total est trop court pour des pauses. Une seule session de concentration sera utilisée.";
            planNotice.classList.remove("visually-hidden");
        } else {
            planNotice.classList.add("visually-hidden");
            planNotice.textContent = "";
        }
    });

    const progressBar = createProgress({ type: "bar", smooth: true });
    const taskCompletionProgressBar = createProgress({
        type: "circular",
        size: "sm",
        smooth: true
    });

    effect(() => {
        progressBar.setValue(progress());
    });

    const taskSection = h("div", {
        class: "pomodoro-screen--progress-card__task"
    });

    let lastTaskId = null;
    let shownCount = 0;

    async function renderSubtasks(taskId) {
        const task = await getTaskById(taskId);
        const subtasks = task.subtasks || [];
        const uncompleted = subtasks.filter(s => !s.checked);

        shownCount = Math.min(3, uncompleted.length);
        const visibleSubs = uncompleted.slice(0, shownCount);

        const ul = h("ul", { class: "task-list" }, ...visibleSubs.map((sub, i) =>
            h("li", {},
                h("fieldset", { class: "checkbox checkbox--sm" },
                    h("label", { class: "checkbox__label", for: `subtask-timer-${taskId}-${i}` },
                        h("input", {
                            id: `subtask-timer-${taskId}-${i}`,
                            type: "checkbox",
                            class: "checkbox__input",
                            onchange: safeAsync(async () => {
                                const confirmCheck = window.confirm("Confirmer la complétion de cette sous-tâche ?");
                                if (!confirmCheck) return;
                                await updateSubtask(taskId, subtasks.indexOf(sub), true)
                                await renderSubtasks(taskId);
                            })
                        }),
                        h("span", { class: "checkbox__custom", "aria-hidden": "true" }),
                        h("span", { class: "checkbox__text" }, sub.text)
                    )
                )
            )
        ));

        const checked = subtasks.filter(s => s.checked).length;
        const total = subtasks.length;
        taskCompletionProgressBar.setValue(total === 0 ? 0 : Math.floor((checked / total) * 100));
        taskCompletionProgressBar.el.classList.toggle("visually-hidden", total === 0);

        const section = h("div", { class: "pomodoro-screen--progress-card__task--section" },
            h("h3", { class: "task-heading" }, task.title),
            ul
        );

        if (total > 0 && checked === total) {
            const confirm = h("button", {
                class: "button button--compact button--primary-outline",
                type: "button",
                "aria-label": "Marquer comme terminée",
                onclick: safeAsync(async () => {
                    await updateTask(taskId, { status: "done" });
                    pomodoroTimer.reset();
                    rerenderTasks();
                    await refreshVisibleTaskSignal();
                    toast.success("Tâche marquée comme terminée.");
                })
            }, h("span", { class: "button_content" }, "Marquer comme terminée"));
            section.append(confirm);
        }

        taskSection.innerHTML = "";
        taskSection.append(section, taskCompletionProgressBar.el);
    }

    effect(() => {
        const taskId = playingTaskId();
        taskSection.classList.toggle("visually-hidden", !taskId);

        if (!taskId) {
            taskSection.innerHTML = "";
            return;
        }

        if (taskId !== lastTaskId) {
            lastTaskId = taskId;
            renderSubtasks(taskId);
        }
    });

    const focusCounter = h("span", {});
    const focusSessionsComponent = h("p", { class: "progress-list_item", "aria-live": "polite" },
        h("span", { "aria-label": "Période de concentration terminée sur X" }, "Session focus : "),
        focusCounter
    );
    const breakCounter = h("span", {});
    const breakSessionsComponent = h("p", { class: "progress-list_item", "aria-live": "polite" },
        h("span", { "aria-label": "Pause terminée sur X" }, "Pause : "),
        breakCounter
    );
    const remainingTimeComponent = h("p", { class: "progress-list_item", "aria-live": "polite" });

    const list = h("div", { class: "pomodoro-screen--progress-card__progress-list" },
        focusSessionsComponent, breakSessionsComponent, remainingTimeComponent
    );

    effect(() => {
        focusCounter.innerHTML = totalFocusSessions() <= 1
            ? "Session unique"
            : `${currentFocusCount()} / ${totalFocusSessions()}`;
    });

    effect(() => {
        const totalBreaks = totalBreakSessions();
        const currentBreaks = currentBreakCount();
        breakCounter.innerHTML = totalBreaks <= 1
            ? "Pause unique"
            : `${currentBreaks} / ${totalBreaks}`;
        breakSessionsComponent.classList.toggle("visually-hidden", totalBreaks === 0);
    });

    effect(() => {
        const isBreakPhase = isBreak();
        const prog = progress();
        const timeLeft = currentTime();
        const shouldShowReminder = !isBreakPhase && timeLeft > 60 && prog > 50;

        if (shouldShowReminder) {
            remainingTimeComponent.textContent = `Dans ${Math.ceil(timeLeft / 60)}min, vous aurez une pause.`;
            remainingTimeComponent.classList.remove("visually-hidden");
        } else {
            remainingTimeComponent.classList.add("visually-hidden");
            remainingTimeComponent.textContent = "";
        }
    });

    wrapper.append(
        h("header", { class: "pomodoro-screen--progress-card__header" }, sessionTitle, sessionDesc),
        progressBar.el,
        h("div", { class: "pomodoro-screen--progress-card__content" }, taskSection, list, planNotice)
    );

    return wrapper;
}