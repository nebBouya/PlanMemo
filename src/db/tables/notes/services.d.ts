export interface Note {
    id?: number;
    title: string;
    content: string;
    color: string;
    createdAt: string;
}

export declare function addNote(noteData: Omit<Note, "id">): Promise<number>;

export declare function updateNote(id: number, updatedData: Partial<Note>): Promise<void>;

export declare function deleteNote(id: number): Promise<void>;

export declare function getNoteById(id: number): Promise<Note | undefined>;

export declare function getAllNotes(): Promise<Note[]>;

export declare function getNotesByDate(date: string): Promise<Note[]>;

export declare function getNotesCount(): Promise<number>;
