export interface Group {
    id?: number;
    key: string;
    label: string;
    icon?: string;
    color?: string;
}

export type GroupUpdate = Partial<Omit<Group, "id" | "key">> & {
    key?: string;
};

export declare function addGroup(groupData: Group): Promise<Group>;

export declare function updateGroup(id: number, updatedData: GroupUpdate): Promise<Group>;

export declare function deleteGroup(id: number): Promise<void>;

export declare function getGroupById(id: number): Promise<Group | undefined>;

export declare function getGroupByKey(key: string): Promise<Group | undefined>;

export declare function doesGroupKeyExist(key: string): Promise<boolean>;

export declare function getAllGroups(): Promise<Group[]>;

export declare function getGroupsCount(): Promise<number>;
