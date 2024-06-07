import { ManagerUtils, MiniMap, QueueSymbol } from "./Utils";
export class QueueSaver {
    constructor(options) {
        this._ = options?.queueStore || new DefaultQueueStore();
        this.options = {
            maxPreviousTracks: options?.maxPreviousTracks || 25,
        };
    }
    async get(guildId) {
        return await this._.parse(await this._.get(guildId));
    }
    async delete(guildId) {
        return await this._.delete(guildId);
    }
    async set(guildId, value) {
        return await this._.set(guildId, await this._.stringify(value));
    }
    async sync(guildId) {
        return await this.get(guildId);
    }
}
export class DefaultQueueStore {
    data = new MiniMap();
    constructor() { }
    async get(guildId) {
        return await this.data.get(guildId);
    }
    async set(guildId, stringifiedValue) {
        return await this.data.set(guildId, stringifiedValue);
    }
    async delete(guildId) {
        return await this.data.delete(guildId);
    }
    async stringify(value) {
        return value;
    }
    async parse(value) {
        return value;
    }
}
export class Queue {
    tracks = [];
    previous = [];
    current = null;
    options = { maxPreviousTracks: 25 };
    guildId = "";
    QueueSaver = null;
    managerUtils = new ManagerUtils();
    queueChanges;
    constructor(guildId, data = {}, QueueSaver, queueOptions) {
        this.queueChanges = queueOptions.queueChangesWatcher || null;
        this.guildId = guildId;
        this.QueueSaver = QueueSaver;
        this.options.maxPreviousTracks = this.QueueSaver?.options?.maxPreviousTracks ?? this.options.maxPreviousTracks;
        this.current = this.managerUtils.isTrack(data.current) ? data.current : null;
        this.previous = Array.isArray(data.previous) && data.previous.some((track) => this.managerUtils.isTrack(track) || this.managerUtils.isUnresolvedTrack(track)) ? data.previous.filter((track) => this.managerUtils.isTrack(track) || this.managerUtils.isUnresolvedTrack(track)) : [];
        this.tracks = Array.isArray(data.tracks) && data.tracks.some((track) => this.managerUtils.isTrack(track) || this.managerUtils.isUnresolvedTrack(track)) ? data.tracks.filter((track) => this.managerUtils.isTrack(track) || this.managerUtils.isUnresolvedTrack(track)) : [];
        Object.defineProperty(this, QueueSymbol, { configurable: true, value: true });
    }
    utils = {
        save: async () => {
            if (this.previous.length > this.options.maxPreviousTracks)
                this.previous.splice(this.options.maxPreviousTracks, this.previous.length);
            return await this.QueueSaver.set(this.guildId, this.utils.toJSON());
        },
        sync: async (override = true, dontSyncCurrent = true) => {
            const data = await this.QueueSaver.get(this.guildId);
            if (!data)
                return console.log("No data found to sync for guildId: ", this.guildId);
            if (!dontSyncCurrent && !this.current && this.managerUtils.isTrack(data.current))
                this.current = data.current;
            if (Array.isArray(data.tracks) && data?.tracks.length && data.tracks.some((track) => this.managerUtils.isTrack(track) || this.managerUtils.isUnresolvedTrack(track)))
                this.tracks.splice(override ? 0 : this.tracks.length, override ? this.tracks.length : 0, ...data.tracks.filter((track) => this.managerUtils.isTrack(track) || this.managerUtils.isUnresolvedTrack(track)));
            if (Array.isArray(data.previous) && data?.previous.length && data.previous.some((track) => this.managerUtils.isTrack(track) || this.managerUtils.isUnresolvedTrack(track)))
                this.previous.splice(0, override ? this.tracks.length : 0, ...data.previous.filter((track) => this.managerUtils.isTrack(track) || this.managerUtils.isUnresolvedTrack(track)));
            await this.utils.save();
            return;
        },
        destroy: async () => {
            return await this.QueueSaver.delete(this.guildId);
        },
        toJSON: () => {
            if (this.previous.length > this.options.maxPreviousTracks)
                this.previous.splice(this.options.maxPreviousTracks, this.previous.length);
            return {
                current: this.current ? { ...this.current } : null,
                previous: this.previous ? [...this.previous] : [],
                tracks: this.tracks ? [...this.tracks] : [],
            };
        },
        totalDuration: () => {
            return this.tracks.reduce((acc, cur) => acc + (cur.info.duration || 0), this.current?.info.duration || 0);
        },
    };
    async shuffle() {
        const oldStored = typeof this.queueChanges?.shuffled === "function" ? this.utils.toJSON() : null;
        if (this.tracks.length <= 1)
            return this.tracks.length;
        if (this.tracks.length == 2) {
            [this.tracks[0], this.tracks[1]] = [this.tracks[1], this.tracks[0]];
        }
        else {
            for (let i = this.tracks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
            }
        }
        if (typeof this.queueChanges?.shuffled === "function")
            this.queueChanges.shuffled(this.guildId, oldStored, this.utils.toJSON());
        await this.utils.save();
        return this.tracks.length;
    }
    async add(TrackOrTracks, index) {
        if (typeof index === "number" && index >= 0 && index < this.tracks.length)
            return await this.splice(index, 0, ...(Array.isArray(TrackOrTracks) ? TrackOrTracks : [TrackOrTracks]).filter((v) => this.managerUtils.isTrack(v) || this.managerUtils.isUnresolvedTrack(v)));
        const oldStored = typeof this.queueChanges?.tracksAdd === "function" ? this.utils.toJSON() : null;
        this.tracks.push(...(Array.isArray(TrackOrTracks) ? TrackOrTracks : [TrackOrTracks]).filter((v) => this.managerUtils.isTrack(v) || this.managerUtils.isUnresolvedTrack(v)));
        if (typeof this.queueChanges?.tracksAdd === "function")
            try {
                this.queueChanges.tracksAdd(this.guildId, (Array.isArray(TrackOrTracks) ? TrackOrTracks : [TrackOrTracks]).filter((v) => this.managerUtils.isTrack(v) || this.managerUtils.isUnresolvedTrack(v)), this.tracks.length, oldStored, this.utils.toJSON());
            }
            catch (e) {
            }
        await this.utils.save();
        return this.tracks.length;
    }
    async splice(index, amount, TrackOrTracks) {
        const oldStored = typeof this.queueChanges?.tracksAdd === "function" || typeof this.queueChanges?.tracksRemoved === "function" ? this.utils.toJSON() : null;
        if (!this.tracks.length) {
            if (TrackOrTracks)
                return await this.add(TrackOrTracks);
            return null;
        }
        if (TrackOrTracks && typeof this.queueChanges?.tracksAdd === "function")
            try {
                this.queueChanges.tracksAdd(this.guildId, (Array.isArray(TrackOrTracks) ? TrackOrTracks : [TrackOrTracks]).filter((v) => this.managerUtils.isTrack(v) || this.managerUtils.isUnresolvedTrack(v)), index, oldStored, this.utils.toJSON());
            }
            catch (e) {
            }
        let spliced = TrackOrTracks ? this.tracks.splice(index, amount, ...(Array.isArray(TrackOrTracks) ? TrackOrTracks : [TrackOrTracks]).filter((v) => this.managerUtils.isTrack(v) || this.managerUtils.isUnresolvedTrack(v))) : this.tracks.splice(index, amount);
        spliced = Array.isArray(spliced) ? spliced : [spliced];
        if (typeof this.queueChanges?.tracksRemoved === "function")
            try {
                this.queueChanges.tracksRemoved(this.guildId, spliced, index, oldStored, this.utils.toJSON());
            }
            catch (e) {
            }
        await this.utils.save();
        return spliced.length === 1 ? spliced[0] : spliced;
    }
}
