export enum TaskStatus {
    UNFINISHED = "unfinished",
    IN_PROGRESS = "in_progress",
    TEMP_FINISHED = "temp_finished",
    DONE = "done"
}

export interface SubTask {
    text: string;
    checked: boolean;
}

export interface Task {
    id?: number;
    title: string;
    dueDate?: string;
    groupId?: number | null;
    noteId?: number | null;
    subtasks?: SubTask[];
    status?: TaskStatus;
    createdAt?: string;
}

export interface FilteredTasksOptions {
    includeToday?: boolean;
    includeUndated?: boolean;
}


export declare function addTask(taskData: Omit<Task, "id">): Promise<Task>;

export declare function updateTask(id: number, updatedData: Partial<Task>): Promise<Task>;

export declare function updateSubtask(taskId: number, index: number, newCheckedState: boolean): Promise<Task>;

export declare function deleteTask(id: number): Promise<void>;

export declare function getTaskById(id: number): Promise<Task | undefined>;

export declare function getAllTasks(): Promise<Task[]>;

export declare function getTasksByDate(date: string): Promise<Task[]>;

export declare function getAllDuoDateTasks(): Promise<Task[]>;

export declare function getTasksByTitle(title: string): Promise<Task[]>;

export declare function getTasksByStatus(status: TaskStatus | TaskStatus[]): Promise<Task[]>;

export declare function getTasksByGroupId(groupId: number): Promise<Task[]>;

export declare function getFilteredTasks(options: FilteredTasksOptions): Promise<Task[]>;

export declare function getTasksCount(): Promise<number>;