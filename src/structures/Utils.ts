import { LavalinkFilterData } from "./Filters";
import { LavalinkManager } from "./LavalinkManager";
import { NodeStats } from "./Node";
import { PlayOptions } from "./Player";
import { LavalinkTrackDataInfoExtended, PluginDataInfo, Track } from "./Track";

export const TrackSymbol = Symbol("LC-Track");
export const QueueSymbol = Symbol("LC-Queue");
export const NodeSymbol = Symbol("LC-Node");

export type LavalinkSearchPlatform = "ytsearch" | "ytmsearch" | "scsearch" | "spsearch" | "sprec" | "amsearch" | "dzsearch" | "dzisrc" | "sprec" | "ymsearch" | "speak" | "tts";
export type ClientSearchPlatform = "youtube" | "youtube music" | "soundcloud" | "ytm" | "yt" | "sc" | "am" | "sp" | "sprec" | "spsuggestion" | "ds" | "dz" | "deezer" | "yandex" | "yandexmusic";
export type SearchPlatform = LavalinkSearchPlatform | ClientSearchPlatform;

export type SourcesRegex = "YoutubeRegex" | "YoutubeMusicRegex" | "SoundCloudRegex" | "SoundCloudMobileRegex" | "DeezerTrackRegex" | "DeezerArtistRegex" | "DeezerEpisodeRegex" | "DeezerMixesRegex" | "DeezerPageLinkRegex" | "DeezerPlaylistRegex" | "DeezerAlbumRegex" | "AllDeezerRegex" | "AllDeezerRegexWithoutPageLink" | "SpotifySongRegex" | "SpotifyPlaylistRegex" | "SpotifyArtistRegex" | "SpotifyEpisodeRegex" | "SpotifyShowRegex" | "SpotifyAlbumRegex" | "AllSpotifyRegex" | "mp3Url" | "m3uUrl" | "m3u8Url" | "mp4Url" | "m4aUrl" | "wavUrl" | "aacpUrl" | "tiktok" | "mixcloud" | "musicYandex" | "radiohost" | "bandcamp" | "appleMusic" | "TwitchTv" | "vimeo"

export interface PlaylistInfo {
    /** The playlist name. */
    name: string;
    /** The Playlist Author */
    author?: string;
    /** The Playlist Thumbnail */
    thumbnail?: string;
    /** A Uri to the playlist */
    uri?: string;
    /** The playlist selected track. */
    selectedTrack: Track | null;
    /** The duration of the entire playlist. (calcualted) */
    duration: number;
  }
export interface SearchResult {
    loadType: LoadTypes,
    exception: Exception | null,
    pluginInfo: PluginDataInfo,
    playlist: PlaylistInfo | null,
    tracks: Track[]
}

export interface ManagerUitls {
    /** @private */
    manager: LavalinkManager;
}

export class ManagerUitls {
    constructor(LavalinkManager: LavalinkManager) {
        this.manager = LavalinkManager;
    }

    buildTrack(data, requester) {
        const encodedTrack = data.encoded || data.encodedTrack || typeof data.track === "string" ? data.track : undefined;
        if (!encodedTrack) throw new RangeError("Argument 'data.encoded' / 'data.encodedTrack' / 'data.track' must be present.");
        if (!data.info) data.info = {} as Partial<LavalinkTrackDataInfoExtended>;
        try {
            const r = {
                info: {
                    identifier: data.info?.identifier,
                    title: data.info?.title,
                    author: data.info?.author,
                    duration: data.info?.duration,
                    artworkUrl: data.info?.artworkUrl || ["youtube.", "youtu.be"].some(d => data.info?.uri?.includes?.(d)) ? `https://img.youtube.com/vi/${data.info?.identifier}/mqdefault.jpg` : undefined,
                    uri: data.info?.uri,
                    sourceName: data.info?.sourceName,
                    isSeekable: data.info?.isSeekable,
                    isStream: data.info?.isStream,
                    isrc: data.info?.isrc,
                    requester: data.info?.requester || requester,
                },
                pluginInfo: data.pluginInfo || data.plugin || {},
                encodedTrack
            } as Track;
            Object.defineProperty(r, TrackSymbol, { configurable: true, value: true });
            return r;
        } catch (error) {
            throw new RangeError(`Argument "data" is not a valid track: ${error.message}`);
        }
    }
}

export type PlayerEvents =
    | TrackStartEvent
    | TrackEndEvent
    | TrackStuckEvent
    | TrackExceptionEvent
    | WebSocketClosedEvent;

export type Severity = "COMMON" | "SUSPICIOUS" | "FAULT";

export interface Exception {
    severity: Severity;
    message: string;
    cause: string;
}

export interface PlayerEvent {
    op: "event";
    type: PlayerEventType;
    guildId: string;
}
export interface TrackStartEvent extends PlayerEvent {
    type: "TrackStartEvent";
    track: string;
}

export interface TrackEndEvent extends PlayerEvent {
    type: "TrackEndEvent";
    track: string;
    reason: TrackEndReason;
}

export interface TrackExceptionEvent extends PlayerEvent {
    type: "TrackExceptionEvent";
    exception?: Exception;
    error: string;
}

export interface TrackStuckEvent extends PlayerEvent {
    type: "TrackStuckEvent";
    thresholdMs: number;
}

export interface WebSocketClosedEvent extends PlayerEvent {
    type: "WebSocketClosedEvent";
    code: number;
    byRemote: boolean;
    reason: string;
}
export type LoadTypes =
    | "track"
    | "playlist"
    | "search"
    | "error"
    | "empty";

export type State =
    | "CONNECTED"
    | "CONNECTING"
    | "DISCONNECTED"
    | "DISCONNECTING"
    | "DESTROYING";


export type PlayerEventType =
    | "TrackStartEvent"
    | "TrackEndEvent"
    | "TrackExceptionEvent"
    | "TrackStuckEvent"
    | "WebSocketClosedEvent";

export type TrackEndReason =
    | "FINISHED"
    | "LOAD_FAILED"
    | "STOPPED"
    | "REPLACED"
    | "CLEANUP";

export interface InvalidLavalinkRestRequest {
    timestamp: number;
    status: number;
    error: string;
    message?: string;
    path: string;
}
export interface LavalinkPlayerVoice {
    token: string;
    endpoint: string;
    sessionId: string;
    connected?: boolean;
    ping?: number
}
export interface LavalinkPlayerVoiceOptions extends Omit<LavalinkPlayerVoice, 'connected' | 'ping'> { }

export interface Address {
    address: string;
    failingTimestamp: number;
    failingTime: string;
}

export interface RoutePlanner {
    class?: string;
    details?: {
        ipBlock: {
            type: string;
            size: string;
        },
        failingAddresses: Address[]
    }
    rotateIndex?: string;
    ipIndex?: string;
    currentAddress?: string;
    blockIndex?: string;
    currentAddressIndex?: string;
}

export interface Session {
    resumingKey?: string;
    timeout: number;
}

export interface GuildShardPayload {
    /** The OP code */
    op: number;
    d: {
        guild_id: string;
        channel_id: string | null;
        self_mute: boolean;
        self_deaf: boolean;
    };
}


export interface PlayerUpdateInfo {
    guildId: string;
    playerOptions: PlayOptions;
    noReplace?: boolean;
}
export interface LavalinkPlayer {
    guildId: string;
    track?: {
        encoded?: string;
        info: {
            identifier: string;

            title: string;
            author: string;
            length: number;
            artworkUrl: string | null;

            uri: string;
            sourceName: string;


            isSeekable: boolean;
            isStream: boolean;
            isrc: string | null;
            position?: number;
        };
    };
    volume: number;
    paused: boolean;
    voice: LavalinkPlayerVoice;
    filters: Partial<LavalinkFilterData>;
}

export interface VoiceState {
    op: "voiceUpdate";
    guildId: string;
    event: VoiceServer;
    sessionId?: string;
    guild_id: string;
    user_id: string;
    session_id: string;
    channel_id: string;
}

export interface VoiceServer {
    token: string;
    guild_id: string;
    endpoint: string;
}

export interface VoicePacket {
    t?: "VOICE_SERVER_UPDATE" | "VOICE_STATE_UPDATE";
    d: VoiceState | VoiceServer;
}

export interface NodeMessage extends NodeStats {
    type: PlayerEventType;
    op: "stats" | "playerUpdate" | "event";
    guildId: string;
}