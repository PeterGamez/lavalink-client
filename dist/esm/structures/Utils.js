import { DefaultSources, SourceLinksRegexes } from "./LavalinkManagerStatics";
export const TrackSymbol = Symbol("LC-Track");
export const UnresolvedTrackSymbol = Symbol("LC-Track-Unresolved");
export const QueueSymbol = Symbol("LC-Queue");
export const NodeSymbol = Symbol("LC-Node");
export class ManagerUitls {
    constructor(LavalinkManager) {
        this.manager = LavalinkManager;
    }
    buildTrack(data, requester) {
        const encoded = data.encoded || data.encoded;
        if (!encoded)
            throw new RangeError("Argument 'data.encoded' / 'data.encoded' / 'data.track' must be present.");
        if (!data.info)
            data.info = {};
        try {
            const r = {
                encoded,
                info: {
                    identifier: data.info?.identifier,
                    title: data.info?.title,
                    author: data.info?.author,
                    duration: data.info?.length,
                    artworkUrl: data.info?.artworkUrl || data.pluginInfo?.artworkUrl || data.plugin?.artworkUrl,
                    uri: data.info?.uri,
                    sourceName: data.info?.sourceName,
                    isSeekable: data.info?.isSeekable,
                    isStream: data.info?.isStream,
                    isrc: data.info?.isrc,
                },
                pluginInfo: data.pluginInfo || data.plugin || {},
                requester: typeof this.manager.options?.playerOptions?.requesterTransformer === "function" ? this.manager.options?.playerOptions?.requesterTransformer(data?.requester || requester) : requester,
            };
            Object.defineProperty(r, TrackSymbol, { configurable: true, value: true });
            return r;
        }
        catch (error) {
            throw new RangeError(`Argument "data" is not a valid track: ${error.message}`);
        }
    }
    /**
     * Validate if a data is equal to a node
     * @param data
     */
    isNode(data) {
        if (!data)
            return false;
        const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(data));
        console.log("isNode, keys", keys);
        if (!keys.length)
            return false;
        // all required functions
        if (!["connect", "destroy", "destroyPlayer", "fetchAllPlayers", "fetchInfo", "fetchPlayer", "fetchStats", "fetchVersion", "request", "updatePlayer", "updateSession"].every(v => keys.includes(v)))
            return false;
        // all properties
        return true;
    }
    /**
     * Validate if a data is equal to node options
     * @param data
     */
    isNodeOptions(data) {
        if (!data || typeof data !== "object" || Array.isArray(data))
            return false;
        if (typeof data.host !== "string" || !data.host.length)
            return false;
        if (typeof data.port !== "number" || isNaN(data.port) || data.port < 0 || data.port > 65535)
            return false;
        if (typeof data.authorization !== "string" || !data.authorization.length)
            return false;
        if ("secure" in data && typeof data.secure !== "boolean")
            return false;
        if ("sessionId" in data && typeof data.sessionId !== "string")
            return false;
        if ("id" in data && typeof data.id !== "string")
            return false;
        if ("regions" in data && (!Array.isArray(data.regions) || !data.regions.every(v => typeof v === "string")))
            return false;
        if ("poolOptions" in data && typeof data.poolOptions !== "object")
            return false;
        if ("retryAmount" in data && (typeof data.retryAmount !== "number" || isNaN(data.retryAmount) || data.retryAmount <= 0))
            return false;
        if ("retryDelay" in data && (typeof data.retryDelay !== "number" || isNaN(data.retryDelay) || data.retryDelay <= 0))
            return false;
        if ("requestTimeout" in data && (typeof data.requestTimeout !== "number" || isNaN(data.requestTimeout) || data.requestTimeout <= 0))
            return false;
        return true;
    }
    /**
     * Validate if a data is euqal to a track
     * @param data the Track to validate
     * @returns
     */
    isTrack(data) {
        return typeof data?.encoded === "string" && typeof data?.info === "object";
    }
    validatedQuery(queryString, node) {
        if (!node.info)
            throw new Error("No Lavalink Node was provided");
        if (!node.info.sourceManagers?.length)
            throw new Error("Lavalink Node, has no sourceManagers enabled");
        // missing links: beam.pro local getyarn.io clypit pornhub reddit ocreamix soundgasm
        if ((SourceLinksRegexes.YoutubeMusicRegex.test(queryString) || SourceLinksRegexes.YoutubeRegex.test(queryString)) && !node.info.sourceManagers.includes("youtube")) {
            throw new Error("Lavalink Node has not 'youtube' enabled");
        }
        if ((SourceLinksRegexes.SoundCloudMobileRegex.test(queryString) || SourceLinksRegexes.SoundCloudRegex.test(queryString)) && !node.info.sourceManagers.includes("soundcloud")) {
            throw new Error("Lavalink Node has not 'soundcloud' enabled");
        }
        if (SourceLinksRegexes.bandcamp.test(queryString) && !node.info.sourceManagers.includes("bandcamp")) {
            throw new Error("Lavalink Node has not 'bandcamp' enabled");
        }
        if (SourceLinksRegexes.TwitchTv.test(queryString) && !node.info.sourceManagers.includes("twitch")) {
            throw new Error("Lavalink Node has not 'twitch' enabled");
        }
        if (SourceLinksRegexes.vimeo.test(queryString) && !node.info.sourceManagers.includes("vimeo")) {
            throw new Error("Lavalink Node has not 'vimeo' enabled");
        }
        if (SourceLinksRegexes.tiktok.test(queryString) && !node.info.sourceManagers.includes("tiktok")) {
            throw new Error("Lavalink Node has not 'tiktok' enabled");
        }
        if (SourceLinksRegexes.mixcloud.test(queryString) && !node.info.sourceManagers.includes("mixcloud")) {
            throw new Error("Lavalink Node has not 'mixcloud' enabled");
        }
        if (SourceLinksRegexes.AllSpotifyRegex.test(queryString) && !node.info.sourceManagers.includes("spotify")) {
            throw new Error("Lavalink Node has not 'spotify' enabled");
        }
        if (SourceLinksRegexes.appleMusic.test(queryString) && !node.info.sourceManagers.includes("applemusic")) {
            throw new Error("Lavalink Node has not 'applemusic' enabled");
        }
        if (SourceLinksRegexes.AllDeezerRegex.test(queryString) && !node.info.sourceManagers.includes("deezer")) {
            throw new Error("Lavalink Node has not 'deezer' enabled");
        }
        if (SourceLinksRegexes.AllDeezerRegex.test(queryString) && node.info.sourceManagers.includes("deezer") && !node.info.sourceManagers.includes("http")) {
            throw new Error("Lavalink Node has not 'http' enabled, which is required to have 'deezer' to work");
        }
        if (SourceLinksRegexes.musicYandex.test(queryString) && !node.info.sourceManagers.includes("yandexmusic")) {
            throw new Error("Lavalink Node has not 'yandexmusic' enabled");
        }
        const hasSource = queryString.split(":")[0];
        if (queryString.split(" ").length <= 1 || !queryString.split(" ")[0].includes(":"))
            return;
        const source = DefaultSources[hasSource];
        if (!source)
            throw new Error(`Lavalink Node SearchQuerySource: '${hasSource}' is not available`);
        if (source === "amsearch" && !node.info.sourceManagers.includes("applemusic")) {
            throw new Error("Lavalink Node has not 'applemusic' enabled, which is required to have 'amsearch' work");
        }
        if (source === "dzisrc" && !node.info.sourceManagers.includes("deezer")) {
            throw new Error("Lavalink Node has not 'deezer' enabled, which is required to have 'dzisrc' work");
        }
        if (source === "dzsearch" && !node.info.sourceManagers.includes("deezer")) {
            throw new Error("Lavalink Node has not 'deezer' enabled, which is required to have 'dzsearch' work");
        }
        if (source === "dzisrc" && node.info.sourceManagers.includes("deezer") && !node.info.sourceManagers.includes("http")) {
            throw new Error("Lavalink Node has not 'http' enabled, which is required to have 'dzisrc' to work");
        }
        if (source === "dzsearch" && node.info.sourceManagers.includes("deezer") && !node.info.sourceManagers.includes("http")) {
            throw new Error("Lavalink Node has not 'http' enabled, which is required to have 'dzsearch' to work");
        }
        if (source === "scsearch" && !node.info.sourceManagers.includes("soundcloud")) {
            throw new Error("Lavalink Node has not 'soundcloud' enabled, which is required to have 'scsearch' work");
        }
        if (source === "speak" && !node.info.sourceManagers.includes("speak")) {
            throw new Error("Lavalink Node has not 'speak' enabled, which is required to have 'speak' work");
        }
        if (source === "tts" && !node.info.sourceManagers.includes("tts")) {
            throw new Error("Lavalink Node has not 'tts' enabled, which is required to have 'tts' work");
        }
        if (source === "ftts" && !node.info.sourceManagers.includes("ftts")) {
            console.log(node.info.sourceManagers);
            throw new Error("Lavalink Node has not 'ftts' enabled, which is required to have 'ftts' work");
        }
        if (source === "ymsearch" && !node.info.sourceManagers.includes("yandexmusic")) {
            throw new Error("Lavalink Node has not 'yandexmusic' enabled, which is required to have 'ymsearch' work");
        }
        if (source === "ytmsearch" && !node.info.sourceManagers.includes("youtube")) {
            throw new Error("Lavalink Node has not 'youtube' enabled, which is required to have 'ytmsearch' work");
        }
        if (source === "ytsearch" && !node.info.sourceManagers.includes("youtube")) {
            throw new Error("Lavalink Node has not 'youtube' enabled, which is required to have 'ytsearch' work");
        }
        return;
    }
}
export class MiniMap extends Map {
    constructor(data = []) {
        super(data);
    }
    filter(fn, thisArg) {
        if (typeof thisArg !== 'undefined')
            fn = fn.bind(thisArg);
        const results = new this.constructor[Symbol.species]();
        for (const [key, val] of this) {
            if (fn(val, key, this))
                results.set(key, val);
        }
        return results;
    }
    /**
     * The sort method sorts the items of a collection in place and returns it.
     * The sort is not necessarily stable in Node 10 or older.
     * The default sort order is according to string Unicode code points.
     *
     * @param compareFunction Specifies a function that defines the sort order.
     * If omitted, the collection is sorted according to each character's Unicode code point value, according to the string conversion of each element.
     *
     * @example
     * collection.sort((userA, userB) => userA.createdTimestamp - userB.createdTimestamp);
     */
    sort(compareFunction = MiniMap.defaultSort) {
        const entries = [...this.entries()];
        entries.sort((a, b) => compareFunction(a[1], b[1], a[0], b[0]));
        // Perform clean-up
        super.clear();
        // Set the new entries
        for (const [k, v] of entries) {
            super.set(k, v);
        }
        return this;
    }
    toJSON() {
        // toJSON is called recursively by JSON.stringify.
        return [...this.values()];
    }
    static defaultSort(firstValue, secondValue) {
        return Number(firstValue > secondValue) || Number(firstValue === secondValue) - 1;
    }
    map(fn, thisArg) {
        if (typeof thisArg !== 'undefined')
            fn = fn.bind(thisArg);
        const iter = this.entries();
        return Array.from({ length: this.size }, () => {
            const [key, value] = iter.next().value;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return fn(value, key, this);
        });
    }
}
export async function queueTrackEnd(queue, addBackToQueue = false) {
    if (queue.current) { // if there was a current Track -> Add it
        queue.previous.unshift(queue.current);
        if (queue.previous.length > queue.options.maxPreviousTracks)
            queue.previous.splice(queue.options.maxPreviousTracks, queue.previous.length);
    }
    // change the current Track to the next upcoming one
    queue.current = queue.tracks.shift() || null;
    // and if repeatMode == queue, add it back to the queue!
    if (addBackToQueue && queue.current)
        queue.tracks.push(queue.current);
    // save it in the DB
    await queue.utils.save();
    // return the new current Track
    return queue.current;
}