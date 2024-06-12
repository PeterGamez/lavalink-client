import { FilterManager } from "./Filters";
import { Queue, QueueSaver } from "./Queue";
import { queueTrackEnd } from "./Utils";
export const DestroyReasons = {
    QueueEmpty: "QueueEmpty",
    NodeDestroy: "NodeDestroy",
    NodeDeleted: "NodeDeleted",
    LavalinkNoVoice: "LavalinkNoVoice",
    NodeReconnectFail: "NodeReconnectFail",
    Disconnected: "Disconnected",
    PlayerReconnectFail: "PlayerReconnectFail",
    ChannelDeleted: "ChannelDeleted",
    DisconnectAllNodes: "DisconnectAllNodes",
    ReconnectAllNodes: "ReconnectAllNodes",
};
export class Player {
    guildId;
    voiceChannelId = null;
    textChannelId = null;
    playing = false;
    paused = false;
    repeatMode = "off";
    ping = {
        lavalink: 0,
        ws: 0,
    };
    volume = 100;
    lavalinkVolume = 100;
    position = 0;
    lastPosition = 0;
    createdTimeStamp;
    connected = false;
    voice = {
        endpoint: null,
        sessionId: null,
        token: null,
    };
    data = {};
    constructor(options, LavalinkManager) {
        this.options = options;
        this.filterManager = new FilterManager(this);
        this.LavalinkManager = LavalinkManager;
        this.guildId = this.options.guildId;
        this.voiceChannelId = this.options.voiceChannelId;
        this.textChannelId = this.options.textChannelId || null;
        this.node = typeof this.options.node === "string" ? this.LavalinkManager.nodeManager.nodes.get(this.options.node) : this.options.node;
        if (!this.node || typeof this.node.request !== "function") {
            const least = this.LavalinkManager.nodeManager.leastUsedNodes();
            this.node = least.filter((v) => (options.vcRegion ? v.options?.regions?.includes(options.vcRegion) : true))[0] || least[0] || null;
        }
        if (!this.node)
            throw new Error("No available Node was found, please add a LavalinkNode to the Manager via Manager.NodeManager#createNode");
        if (typeof options.volume === "number" && !isNaN(options.volume))
            this.volume = Number(options.volume);
        this.volume = Math.round(Math.max(Math.min(this.volume, 1000), 0));
        this.lavalinkVolume = Math.round(Math.max(Math.min(Math.round(this.LavalinkManager.options.playerOptions.volumeDecrementer ? this.volume * this.LavalinkManager.options.playerOptions.volumeDecrementer : this.volume), 1000), 0));
        this.LavalinkManager.emit("playerCreate", this);
        this.queue = new Queue(this.guildId, {}, new QueueSaver(this.LavalinkManager.options.queueOptions), this.LavalinkManager.options.queueOptions);
    }
    set(key, value) {
        this.data[key] = value;
        return this;
    }
    get(key) {
        return this.data[key];
    }
    clearData() {
        const toKeep = Object.keys(this.data).filter((v) => v.startsWith("internal_"));
        for (const key in this.data) {
            if (toKeep.includes(key))
                continue;
            delete this.data[key];
        }
        return this;
    }
    getAllData() {
        return Object.fromEntries(Object.entries(this.data).filter((v) => !v[0].startsWith("internal_")));
    }
    async play(options = {}) {
        if (this.get("internal_queueempty")) {
            clearTimeout(this.get("internal_queueempty"));
            this.set("internal_queueempty", undefined);
        }
        let replaced = false;
        if (options?.clientTrack && (this.LavalinkManager.utils.isTrack(options?.clientTrack) || this.LavalinkManager.utils.isUnresolvedTrack(options.clientTrack))) {
            if (this.LavalinkManager.utils.isUnresolvedTrack(options.clientTrack))
                await options.clientTrack.resolve(this);
            if (typeof options.track.userData === "object")
                options.clientTrack.userData = { ...(options?.clientTrack.userData || {}), ...(options.track.userData || {}) };
            await this.queue.add(options?.clientTrack, 0);
            return await this.skip();
        }
        else if (options?.track?.encoded) {
            const track = await this.node.decode.singleTrack(options.track?.encoded, options.track?.requester || this.queue?.current?.requester || this.queue.previous?.[0]?.requester || this.queue.tracks?.[0]?.requester || this.LavalinkManager.options.client);
            if (typeof options.track.userData === "object")
                track.userData = { ...(track.userData || {}), ...(options.track.userData || {}) };
            if (track) {
                replaced = true;
                this.queue.add(track, 0);
                await queueTrackEnd(this);
            }
        }
        else if (options?.track?.identifier) {
            const res = await this.search({
                query: options?.track?.identifier,
            }, options?.track?.requester || this.queue?.current?.requester || this.queue.previous?.[0]?.requester || this.queue.tracks?.[0]?.requester || this.LavalinkManager.options.client);
            if (typeof options.track.userData === "object")
                res.tracks[0].userData = { ...(res.tracks[0].userData || {}), ...(options.track.userData || {}) };
            if (res.tracks[0]) {
                replaced = true;
                this.queue.add(res.tracks[0], 0);
                await queueTrackEnd(this);
            }
        }
        if (!this.queue.current && this.queue.tracks.length)
            await queueTrackEnd(this);
        if (this.queue.current && this.LavalinkManager.utils.isUnresolvedTrack(this.queue.current)) {
            try {
                await this.queue.current.resolve(this);
                if (typeof options.track.userData === "object")
                    this.queue.current.userData = { ...(this.queue.current.userData || {}), ...(options.track.userData || {}) };
            }
            catch (error) {
                this.LavalinkManager.emit("trackError", this, this.queue.current, error);
                if (options && "clientTrack" in options)
                    delete options.clientTrack;
                if (options && "track" in options)
                    delete options.track;
                if (this.LavalinkManager.options?.autoSkipOnResolveError === true && this.queue.tracks[0])
                    return this.play(options);
                return this;
            }
        }
        if (!this.queue.current)
            throw new Error(`There is no Track in the Queue, or provided in the PlayOptions`);
        if (typeof options?.volume === "number" && !isNaN(options?.volume)) {
            this.volume = Math.max(Math.min(options?.volume, 500), 0);
            let vol = Number(this.volume);
            if (this.LavalinkManager.options.playerOptions.volumeDecrementer)
                vol *= this.LavalinkManager.options.playerOptions.volumeDecrementer;
            this.lavalinkVolume = Math.round(vol);
            options.volume = this.lavalinkVolume;
        }
        const finalOptions = Object.fromEntries(Object.entries({
            track: {
                encoded: this.queue.current?.encoded || null,
                userData: options?.track?.userData || {},
            },
            volume: this.lavalinkVolume,
            position: options?.position ?? 0,
            endTime: options?.endTime ?? undefined,
            filters: options?.filters ?? undefined,
            paused: options?.paused ?? undefined,
            voice: options?.voice ?? undefined,
        }).filter((v) => typeof v[1] !== "undefined"));
        if ((typeof finalOptions.position !== "undefined" && isNaN(finalOptions.position)) || (typeof finalOptions.position === "number" && (finalOptions.position < 0 || finalOptions.position >= this.queue.current.info.duration)))
            throw new Error("PlayerOption#position must be a positive number, less than track's duration");
        if ((typeof finalOptions.volume !== "undefined" && isNaN(finalOptions.volume)) || (typeof finalOptions.volume === "number" && finalOptions.volume < 0))
            throw new Error("PlayerOption#volume must be a positive number");
        if ((typeof finalOptions.endTime !== "undefined" && isNaN(finalOptions.endTime)) || (typeof finalOptions.endTime === "number" && (finalOptions.endTime < 0 || finalOptions.endTime >= this.queue.current.info.duration)))
            throw new Error("PlayerOption#endTime must be a positive number, less than track's duration");
        if (typeof finalOptions.position === "number" && typeof finalOptions.endTime === "number" && finalOptions.endTime < finalOptions.position)
            throw new Error("PlayerOption#endTime must be bigger than PlayerOption#position");
        const now = performance.now();
        await this.node.updatePlayer({
            guildId: this.guildId,
            noReplace: replaced ? replaced : options?.noReplace ?? false,
            playerOptions: finalOptions,
        });
        this.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
        return this;
    }
    async setVolume(volume, ignoreVolumeDecrementer = false) {
        volume = Number(volume);
        if (isNaN(volume))
            throw new TypeError("Volume must be a number.");
        this.volume = Math.round(Math.max(Math.min(volume, 1000), 0));
        this.lavalinkVolume = Math.round(Math.max(Math.min(Math.round(this.LavalinkManager.options.playerOptions.volumeDecrementer && !ignoreVolumeDecrementer ? this.volume * this.LavalinkManager.options.playerOptions.volumeDecrementer : this.volume), 1000), 0));
        const now = performance.now();
        if (this.LavalinkManager.options.playerOptions.applyVolumeAsFilter) {
            await this.node.updatePlayer({ guildId: this.guildId, playerOptions: { filters: { volume: this.lavalinkVolume / 100 } } });
        }
        else {
            await this.node.updatePlayer({ guildId: this.guildId, playerOptions: { volume: this.lavalinkVolume } });
        }
        this.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
        return this;
    }
    async lavaSearch(query, requestUser) {
        return this.node.lavaSearch(query, requestUser);
    }
    async setSponsorBlock(segments = ["sponsor", "selfpromo"]) {
        return this.node.setSponsorBlock(this, segments);
    }
    async getSponsorBlock() {
        return this.node.getSponsorBlock(this);
    }
    async deleteSponsorBlock() {
        return this.node.deleteSponsorBlock(this);
    }
    async search(query, requestUser) {
        const Query = this.LavalinkManager.utils.transformQuery(query);
        return this.node.search(Query, requestUser);
    }
    async lavaLyrics(skipTrackSource = false) {
        const encoded = this.queue.current?.encoded;
        if (!encoded)
            throw new Error("No track is currently playing");
        return this.node.lavaLyrics(encoded, skipTrackSource);
    }
    async pause() {
        if (this.paused && !this.playing)
            throw new Error("Player is already paused - not able to pause.");
        this.paused = true;
        const now = performance.now();
        await this.node.updatePlayer({ guildId: this.guildId, playerOptions: { paused: true } });
        this.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
        return this;
    }
    async resume() {
        if (!this.paused)
            throw new Error("Player isn't paused - not able to resume.");
        this.paused = false;
        const now = performance.now();
        await this.node.updatePlayer({ guildId: this.guildId, playerOptions: { paused: false } });
        this.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
        return this;
    }
    async seek(position) {
        if (!this.queue.current)
            return undefined;
        position = Number(position);
        if (isNaN(position))
            throw new RangeError("Position must be a number.");
        if (!this.queue.current.info.isSeekable || this.queue.current.info.isStream)
            throw new RangeError("Current Track is not seekable / a stream");
        if (position < 0 || position > this.queue.current.info.duration)
            position = Math.max(Math.min(position, this.queue.current.info.duration), 0);
        this.position = position;
        this.lastPosition = position;
        const now = performance.now();
        await this.node.updatePlayer({ guildId: this.guildId, playerOptions: { position } });
        this.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
        return this;
    }
    async setRepeatMode(repeatMode) {
        if (!["off", "track", "queue"].includes(repeatMode))
            throw new RangeError("Repeatmode must be either 'off', 'track', or 'queue'");
        this.repeatMode = repeatMode;
        return this;
    }
    async skip(skipTo = 0, throwError = true) {
        if (!this.queue.tracks.length && (throwError || (typeof skipTo === "boolean" && skipTo === true)))
            throw new RangeError("Can't skip more than the queue size");
        if (typeof skipTo === "number" && skipTo > 1) {
            if (skipTo > this.queue.tracks.length)
                throw new RangeError("Can't skip more than the queue size");
            await this.queue.splice(0, skipTo - 1);
        }
        if (!this.playing)
            return await this.play();
        const now = performance.now();
        this.set("internal_skipped", true);
        await this.node.updatePlayer({ guildId: this.guildId, playerOptions: { track: { encoded: null } } });
        this.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
        return this;
    }
    async stopPlaying(clearQueue = true, executeAutoplay = false) {
        this.set("internal_stopPlaying", true);
        if (this.queue.tracks.length && clearQueue === true)
            await this.queue.splice(0, this.queue.tracks.length);
        if (executeAutoplay === false)
            this.set("internal_autoplayStopPlaying", true);
        else
            this.set("internal_autoplayStopPlaying", undefined);
        const now = performance.now();
        await this.node.updatePlayer({ guildId: this.guildId, playerOptions: { track: { encoded: null } } });
        this.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
        return this;
    }
    async connect() {
        if (!this.options.voiceChannelId)
            throw new RangeError("No Voice Channel id has been set. (player.options.voiceChannelId)");
        await this.LavalinkManager.options.sendToShard(this.guildId, {
            op: 4,
            d: {
                guild_id: this.guildId,
                channel_id: this.options.voiceChannelId,
                self_mute: this.options.selfMute ?? false,
                self_deaf: this.options.selfDeaf ?? true,
            },
        });
        this.voiceChannelId = this.options.voiceChannelId;
        return this;
    }
    async changeVoiceState(data) {
        if (this.options.voiceChannelId === data.voiceChannelId)
            throw new RangeError("New Channel can't be equal to the old Channel.");
        await this.LavalinkManager.options.sendToShard(this.guildId, {
            op: 4,
            d: {
                guild_id: this.guildId,
                channel_id: data.voiceChannelId,
                self_mute: data.selfMute ?? this.options.selfMute ?? false,
                self_deaf: data.selfDeaf ?? this.options.selfDeaf ?? true,
            },
        });
        this.options.voiceChannelId = data.voiceChannelId;
        this.options.selfMute = data.selfMute;
        this.options.selfDeaf = data.selfDeaf;
        this.voiceChannelId = data.voiceChannelId;
        return this;
    }
    async disconnect(force = false) {
        if (!force && !this.options.voiceChannelId)
            throw new RangeError("No Voice Channel id has been set. (player.options.voiceChannelId)");
        await this.LavalinkManager.options.sendToShard(this.guildId, {
            op: 4,
            d: {
                guild_id: this.guildId,
                channel_id: null,
                self_mute: false,
                self_deaf: false,
            },
        });
        this.voiceChannelId = null;
        return this;
    }
    async destroy(reason, disconnect = true) {
        if (this.LavalinkManager.options.advancedOptions?.debugOptions.playerDestroy.debugLog)
            console.log(`Lavalink-Client-Debug | PlayerDestroy [::] destroy Function, [guildId ${this.guildId}] - Destroy-Reason: ${String(reason)}`);
        if (this.get("internal_destroystatus") === true) {
            if (this.LavalinkManager.options.advancedOptions?.debugOptions.playerDestroy.debugLog)
                console.log(`Lavalink-Client-Debug | PlayerDestroy [::] destroy Function, [guildId ${this.guildId}] - Already destroying somewhere else..`);
            return;
        }
        this.set("internal_destroystatus", true);
        if (disconnect)
            await this.disconnect(true);
        else
            this.set("internal_destroywithoutdisconnect", true);
        await this.queue.utils.destroy();
        this.LavalinkManager.deletePlayer(this.guildId);
        await this.node.destroyPlayer(this.guildId);
        if (this.LavalinkManager.options.advancedOptions?.debugOptions.playerDestroy.debugLog)
            console.log(`Lavalink-Client-Debug | PlayerDestroy [::] destroy Function, [guildId ${this.guildId}] - Player got destroyed successfully`);
        this.LavalinkManager.emit("playerDestroy", this, reason);
        return this;
    }
    async changeNode(newNode) {
        const updateNode = typeof newNode === "string" ? this.LavalinkManager.nodeManager.nodes.get(newNode) : newNode;
        if (!updateNode)
            throw new Error("Could not find the new Node");
        const data = this.toJSON();
        await this.node.destroyPlayer(this.guildId);
        this.node = updateNode;
        const now = performance.now();
        await this.node.updatePlayer({
            guildId: this.guildId,
            noReplace: false,
            playerOptions: {
                position: data.position,
                volume: Math.round(Math.max(Math.min(data.volume, 1000), 0)),
                paused: data.paused,
                filters: { ...data.filters, equalizer: data.equalizer },
                voice: this.voice,
                track: this.queue.current ?? undefined,
            },
        });
        this.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
        return this.node.id;
    }
    toJSON() {
        return {
            guildId: this.guildId,
            options: this.options,
            voiceChannelId: this.voiceChannelId,
            textChannelId: this.textChannelId,
            position: this.position,
            lastPosition: this.lastPosition,
            volume: this.volume,
            lavalinkVolume: this.lavalinkVolume,
            repeatMode: this.repeatMode,
            paused: this.paused,
            playing: this.playing,
            createdTimeStamp: this.createdTimeStamp,
            filters: this.filterManager?.data || {},
            equalizer: this.filterManager?.equalizerBands || [],
            nodeId: this.node?.id,
            ping: this.ping,
        };
    }
}
