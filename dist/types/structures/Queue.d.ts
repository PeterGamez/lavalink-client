import { Track, UnresolvedTrack } from "./Track";
export interface StoredQueue {
    current: Track | null;
    previous: Track[];
    tracks: Track[];
}
export interface QueueStoreManager {
    /** @async get a Value (MUST RETURN UNPARSED!) */
    get: (guildId: string) => Promise<string>;
    /** @async Set a value inside a guildId (MUST BE UNPARSED) */
    set: (guildId: string, stringifiedQueueData: string) => Promise<void | string | boolean>;
    /** @async Delete a Database Value based of it's guildId */
    delete: (guildId: string) => Promise<void | string | boolean>;
    /** @async Parse the saved value back to the Queue (IF YOU DON'T NEED PARSING/STRINGIFY, then just return the value) */
    parse: (stringifiedQueueData: string) => Promise<StoredQueue>;
    /** @async Transform the value(s) inside of the QueueStoreManager (IF YOU DON'T NEED PARSING/STRINGIFY, then just return the value) */
    stringify: (parsedQueueData: StoredQueue) => Promise<string>;
}
export interface ManagerQueueOptions {
    /** Maximum Amount of tracks for the queue.previous array. Set to 0 to not save previous songs. Defaults to 25 Tracks */
    maxPreviousTracks?: number;
    /** Custom Queue Store option */
    queueStore?: QueueStoreManager;
    /** Custom Queue Watcher class */
    queueChangesWatcher?: QueueChangesWatcher;
}
export interface QueueSaver {
    /** @private */
    _: QueueStoreManager;
    /** @private */
    options: {
        maxPreviousTracks: number;
    };
}
export declare class QueueSaver {
    constructor(options: ManagerQueueOptions);
    get(guildId: string): Promise<StoredQueue>;
    delete(guildId: string): Promise<string | boolean | void>;
    set(guildId: string, parsedQueueData: StoredQueue): Promise<string | boolean | void>;
    sync(guildId: string): Promise<StoredQueue>;
}
export declare class DefaultQueueStore implements QueueStoreManager {
    private data;
    constructor();
    get(guildId: any): Promise<string>;
    set(guildId: any, stringifiedQueueData: any): Promise<any>;
    delete(guildId: any): Promise<boolean>;
    parse(stringifiedQueueData: any): Promise<any>;
    stringify(parsedQueueData: any): Promise<any>;
}
export interface QueueChangesWatcher {
    /** get a Value (MUST RETURN UNPARSED!) */
    tracksAdd: (guildId: string, tracks: (Track | UnresolvedTrack)[], position: number, oldStoredQueue: StoredQueue, newStoredQueue: StoredQueue) => any;
    /** Set a value inside a guildId (MUST BE UNPARSED) */
    tracksRemoved: (guildId: string, tracks: (Track | UnresolvedTrack)[], position: number, oldStoredQueue: StoredQueue, newStoredQueue: StoredQueue) => any;
    /** Set a value inside a guildId (MUST BE UNPARSED) */
    shuffled: (guildId: string, oldStoredQueue: StoredQueue, newStoredQueue: StoredQueue) => any;
}
export declare class Queue {
    readonly tracks: (Track | UnresolvedTrack)[];
    readonly previous: Track[];
    current: Track | null;
    options: {
        maxPreviousTracks: number;
    };
    private readonly guildId;
    private readonly QueueSaver;
    private managerUtils;
    private queueChanges;
    constructor(guildId: string, data?: Partial<StoredQueue>, QueueSaver?: QueueSaver, queueOptions?: ManagerQueueOptions);
    /**
     * Utils for a Queue
     */
    utils: {
        /**
         * Save the current cached Queue on the database/server (overides the server)
         */
        save: () => Promise<string | boolean | void>;
        /**
         * Sync the current queue database/server with the cached one
         * @returns {void}
         */
        sync: (override?: boolean, dontSyncCurrent?: boolean) => Promise<void>;
        destroy: () => Promise<string | boolean | void>;
        /**
         * @returns {{current:Track|null, previous:Track[], tracks:Track[]}}The Queue, but in a raw State, which allows easier handling for the QueueStoreManager
         */
        toJSON: () => StoredQueue;
        /**
         * Get the Total Duration of the Queue-Songs summed up
         * @returns {number}
         */
        totalDuration: () => number;
    };
    /**
     * Shuffles the current Queue, then saves it
     * @returns Amount of Tracks in the Queue
     */
    shuffle(): Promise<number>;
    /**
     * Add a Track to the Queue, and after saved in the "db" it returns the amount of the Tracks
     * @param {Track | Track[]} TrackOrTracks
     * @param {number} index At what position to add the Track
     * @returns {number} Queue-Size (for the next Tracks)
     */
    add(TrackOrTracks: Track | UnresolvedTrack | (Track | UnresolvedTrack)[], index?: number): any;
    /**
     * Splice the tracks in the Queue
     * @param {number} index Where to remove the Track
     * @param {number} amount How many Tracks to remove?
     * @param {Track | Track[]} TrackOrTracks Want to Add more Tracks?
     * @returns {Track} Spliced Track
     */
    splice(index: number, amount: number, TrackOrTracks?: Track | UnresolvedTrack | (Track | UnresolvedTrack)[]): any;
}
