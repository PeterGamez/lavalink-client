import type { AudioOutputs, ChannelMixFilter, EQBand } from "./Types/Filters";

export enum DebugEvents {
    SetSponsorBlock = "SetSponsorBlock",
    DeleteSponsorBlock = "DeleteSponsorBlock",
    TrackEndReplaced = "TrackEndReplaced",

    AutoplayExecution = "AutoplayExecution",
    AutoplayNoSongsAdded = "AutoplayNoSongsAdded",
    AutoplayThresholdSpamLimiter = "AutoplayThresholdSpamLimiter",
    TriggerQueueEmptyInterval = "TriggerQueueEmptyInterval",
    QueueEnded = "QueueEnded",
    TrackStartNewSongsOnly = "TrackStartNewSongsOnly",
    TrackStartNoTrack = "TrackStartNoTrack",

    ResumingFetchingError = "ResumingFetchingError",

    PlayerUpdateNoPlayer = "PlayerUpdateNoPlayer",
    PlayerUpdateFilterFixApply = "PlayerUpdateFilterFixApply",
    PlayerUpdateSuccess = "PlayerUpdateSuccess",

    HeartBeatTriggered = "HeartBeatTriggered",
    NoSocketOnDestroy = "NoSocketOnDestroy",
    SocketTerminateHeartBeatTimeout = "SocketTerminateHeartBeatTimeout",

    TryingConnectWhileConnected = "TryingConnectWhileConnected",

    LavaSearchNothingFound = "LavaSearchNothingFound",
    SearchNothingFound = "SearchNothingFound",

    ValidatingBlacklistLinks = "ValidatingBlacklistLinks",
    ValidatingWhitelistLinks = "ValidatingWhitelistLinks",

    TrackErrorMaxTracksErroredPerTime = "TrackErrorMaxTracksErroredPerTime",
    TrackStuckMaxTracksErroredPerTime = "TrackStuckMaxTracksErroredPerTime",

    PlayerDestroyingSomewhereElse = "PlayerDestroyingSomewhereElse",
    PlayerCreateNodeNotFound = "PlayerCreateNodeNotFound",
    PlayerPlayQueueEmptyTimeoutClear = "PlayerPlayQueueEmptyTimeoutClear",
    PlayerPlayWithTrackReplace = "PlayerPlayWithTrackReplace",
    PlayerPlayUnresolvedTrack = "PlayerPlayUnresolvedTrack",
    PlayerPlayUnresolvedTrackFailed = "PlayerPlayUnresolvedTrackFailed",
    PlayerVolumeAsFilter = "PlayerVolumeAsFilter",
    BandcampSearchLokalEngine = "BandcampSearchLokalEngine",
    PlayerChangeNode = "PlayerChangeNode",

    BuildTrackError = "BuildTrackError",
    TransformRequesterFunctionFailed = "TransformRequesterFunctionFailed",
    GetClosestTrackFailed = "GetClosestTrackFailed",
    PlayerDeleteInsteadOfDestroy = "PlayerDeleteInsteadOfDestroy",
    FailedToConnectToNodes = "FailedToConnectToNodes",
    NoAudioDebug = "NoAudioDebug",
    PlayerAutoReconnect = "PlayerAutoReconnect",
}

export enum DestroyReasons {
    QueueEmpty = "QueueEmpty",
    NodeDestroy = "NodeDestroy",
    NodeDeleted = "NodeDeleted",
    LavalinkNoVoice = "LavalinkNoVoice",
    NodeReconnectFail = "NodeReconnectFail",
    Disconnected = "Disconnected",
    PlayerReconnectFail = "PlayerReconnectFail",
    ChannelDeleted = "ChannelDeleted",
    DisconnectAllNodes = "DisconnectAllNodes",
    ReconnectAllNodes = "ReconnectAllNodes",

    TrackErrorMaxTracksErroredPerTime = "TrackErrorMaxTracksErroredPerTime",
    TrackStuckMaxTracksErroredPerTime = "TrackStuckMaxTracksErroredPerTime",
}

export enum DisconnectReasons {
    Disconnected = "Disconnected",
    DisconnectAllNodes = "DisconnectAllNodes",
}

export const validSponsorBlocks = ["sponsor", "selfpromo", "interaction", "intro", "outro", "preview", "music_offtopic", "filler"];

/**  The audio Outputs Data map declaration */
export const audioOutputsData: Record<AudioOutputs, ChannelMixFilter> = {
    mono: {
        // totalLeft: 1, totalRight: 1
        leftToLeft: 0.5, //each channel should in total 0 | 1, 0 === off, 1 === on, 0.5+0.5 === 1
        leftToRight: 0.5,
        rightToLeft: 0.5,
        rightToRight: 0.5,
    },
    stereo: {
        // totalLeft: 1, totalRight: 1
        leftToLeft: 1,
        leftToRight: 0,
        rightToLeft: 0,
        rightToRight: 1,
    },
    left: {
        // totalLeft: 1, totalRight: 0
        leftToLeft: 1,
        leftToRight: 0,
        rightToLeft: 1,
        rightToRight: 0,
    },
    right: {
        // totalLeft: 0, totalRight: 1
        leftToLeft: 0,
        leftToRight: 1,
        rightToLeft: 0,
        rightToRight: 1,
    },
};

export const EQList = {
    /** A Bassboost Equalizer, so high it distorts the audio */
    BassboostEarrape: [
        { band: 0, gain: 0.6 * 0.375 },
        { band: 1, gain: 0.67 * 0.375 },
        { band: 2, gain: 0.67 * 0.375 },
        { band: 3, gain: 0.4 * 0.375 },
        { band: 4, gain: -0.5 * 0.375 },
        { band: 5, gain: 0.15 * 0.375 },
        { band: 6, gain: -0.45 * 0.375 },
        { band: 7, gain: 0.23 * 0.375 },
        { band: 8, gain: 0.35 * 0.375 },
        { band: 9, gain: 0.45 * 0.375 },
        { band: 10, gain: 0.55 * 0.375 },
        { band: 11, gain: -0.6 * 0.375 },
        { band: 12, gain: 0.55 * 0.375 },
        { band: 13, gain: -0.5 * 0.375 },
        { band: 14, gain: -0.75 * 0.375 },
    ] as EQBand[],
    /** A High and decent Bassboost Equalizer */
    BassboostHigh: [
        { band: 0, gain: 0.6 * 0.25 },
        { band: 1, gain: 0.67 * 0.25 },
        { band: 2, gain: 0.67 * 0.25 },
        { band: 3, gain: 0.4 * 0.25 },
        { band: 4, gain: -0.5 * 0.25 },
        { band: 5, gain: 0.15 * 0.25 },
        { band: 6, gain: -0.45 * 0.25 },
        { band: 7, gain: 0.23 * 0.25 },
        { band: 8, gain: 0.35 * 0.25 },
        { band: 9, gain: 0.45 * 0.25 },
        { band: 10, gain: 0.55 * 0.25 },
        { band: 11, gain: -0.6 * 0.25 },
        { band: 12, gain: 0.55 * 0.25 },
        { band: 13, gain: -0.5 * 0.25 },
        { band: 14, gain: -0.75 * 0.25 },
    ] as EQBand[],
    /** A decent Bassboost Equalizer */
    BassboostMedium: [
        { band: 0, gain: 0.6 * 0.1875 },
        { band: 1, gain: 0.67 * 0.1875 },
        { band: 2, gain: 0.67 * 0.1875 },
        { band: 3, gain: 0.4 * 0.1875 },
        { band: 4, gain: -0.5 * 0.1875 },
        { band: 5, gain: 0.15 * 0.1875 },
        { band: 6, gain: -0.45 * 0.1875 },
        { band: 7, gain: 0.23 * 0.1875 },
        { band: 8, gain: 0.35 * 0.1875 },
        { band: 9, gain: 0.45 * 0.1875 },
        { band: 10, gain: 0.55 * 0.1875 },
        { band: 11, gain: -0.6 * 0.1875 },
        { band: 12, gain: 0.55 * 0.1875 },
        { band: 13, gain: -0.5 * 0.1875 },
        { band: 14, gain: -0.75 * 0.1875 },
    ] as EQBand[],
    /** A slight Bassboost Equalizer */
    BassboostLow: [
        { band: 0, gain: 0.6 * 0.125 },
        { band: 1, gain: 0.67 * 0.125 },
        { band: 2, gain: 0.67 * 0.125 },
        { band: 3, gain: 0.4 * 0.125 },
        { band: 4, gain: -0.5 * 0.125 },
        { band: 5, gain: 0.15 * 0.125 },
        { band: 6, gain: -0.45 * 0.125 },
        { band: 7, gain: 0.23 * 0.125 },
        { band: 8, gain: 0.35 * 0.125 },
        { band: 9, gain: 0.45 * 0.125 },
        { band: 10, gain: 0.55 * 0.125 },
        { band: 11, gain: -0.6 * 0.125 },
        { band: 12, gain: 0.55 * 0.125 },
        { band: 13, gain: -0.5 * 0.125 },
        { band: 14, gain: -0.75 * 0.125 },
    ] as EQBand[],
    /** Makes the Music slightly "better" */
    BetterMusic: [
        { band: 0, gain: 0.25 },
        { band: 1, gain: 0.025 },
        { band: 2, gain: 0.0125 },
        { band: 3, gain: 0 },
        { band: 4, gain: 0 },
        { band: 5, gain: -0.0125 },
        { band: 6, gain: -0.025 },
        { band: 7, gain: -0.0175 },
        { band: 8, gain: 0 },
        { band: 9, gain: 0 },
        { band: 10, gain: 0.0125 },
        { band: 11, gain: 0.025 },
        { band: 12, gain: 0.25 },
        { band: 13, gain: 0.125 },
        { band: 14, gain: 0.125 },
    ] as EQBand[],
    /** Makes the Music sound like rock music / sound rock music better */
    Rock: [
        { band: 0, gain: 0.3 },
        { band: 1, gain: 0.25 },
        { band: 2, gain: 0.2 },
        { band: 3, gain: 0.1 },
        { band: 4, gain: 0.05 },
        { band: 5, gain: -0.05 },
        { band: 6, gain: -0.15 },
        { band: 7, gain: -0.2 },
        { band: 8, gain: -0.1 },
        { band: 9, gain: -0.05 },
        { band: 10, gain: 0.05 },
        { band: 11, gain: 0.1 },
        { band: 12, gain: 0.2 },
        { band: 13, gain: 0.25 },
        { band: 14, gain: 0.3 },
    ] as EQBand[],
    /** Makes the Music sound like Classic music / sound Classic music better */
    Classic: [
        { band: 0, gain: 0.375 },
        { band: 1, gain: 0.35 },
        { band: 2, gain: 0.125 },
        { band: 3, gain: 0 },
        { band: 4, gain: 0 },
        { band: 5, gain: 0.125 },
        { band: 6, gain: 0.55 },
        { band: 7, gain: 0.05 },
        { band: 8, gain: 0.125 },
        { band: 9, gain: 0.25 },
        { band: 10, gain: 0.2 },
        { band: 11, gain: 0.25 },
        { band: 12, gain: 0.3 },
        { band: 13, gain: 0.25 },
        { band: 14, gain: 0.3 },
    ] as EQBand[],
    /** Makes the Music sound like Pop music / sound Pop music better */
    Pop: [
        { band: 0, gain: 0.2635 },
        { band: 1, gain: 0.22141 },
        { band: 2, gain: -0.21141 },
        { band: 3, gain: -0.1851 },
        { band: 4, gain: -0.155 },
        { band: 5, gain: 0.21141 },
        { band: 6, gain: 0.22456 },
        { band: 7, gain: 0.237 },
        { band: 8, gain: 0.237 },
        { band: 9, gain: 0.237 },
        { band: 10, gain: -0.05 },
        { band: 11, gain: -0.116 },
        { band: 12, gain: 0.192 },
        { band: 13, gain: 0 },
    ] as EQBand[],
    /** Makes the Music sound like Electronic music / sound Electronic music better */
    Electronic: [
        { band: 0, gain: 0.375 },
        { band: 1, gain: 0.35 },
        { band: 2, gain: 0.125 },
        { band: 3, gain: 0 },
        { band: 4, gain: 0 },
        { band: 5, gain: -0.125 },
        { band: 6, gain: -0.125 },
        { band: 7, gain: 0 },
        { band: 8, gain: 0.25 },
        { band: 9, gain: 0.125 },
        { band: 10, gain: 0.15 },
        { band: 11, gain: 0.2 },
        { band: 12, gain: 0.25 },
        { band: 13, gain: 0.35 },
        { band: 14, gain: 0.4 },
    ] as EQBand[],
    /** Boosts all Bands slightly for louder and fuller sound */
    FullSound: [
        { band: 0, gain: 0.25 + 0.375 },
        { band: 1, gain: 0.25 + 0.025 },
        { band: 2, gain: 0.25 + 0.0125 },
        { band: 3, gain: 0.25 + 0 },
        { band: 4, gain: 0.25 + 0 },
        { band: 5, gain: 0.25 + -0.0125 },
        { band: 6, gain: 0.25 + -0.025 },
        { band: 7, gain: 0.25 + -0.0175 },
        { band: 8, gain: 0.25 + 0 },
        { band: 9, gain: 0.25 + 0 },
        { band: 10, gain: 0.25 + 0.0125 },
        { band: 11, gain: 0.25 + 0.025 },
        { band: 12, gain: 0.25 + 0.375 },
        { band: 13, gain: 0.25 + 0.125 },
        { band: 14, gain: 0.25 + 0.125 },
    ] as EQBand[],
    /** Boosts basses + lower highs for a pro gaming sound */
    Gaming: [
        { band: 0, gain: 0.35 },
        { band: 1, gain: 0.3 },
        { band: 2, gain: 0.25 },
        { band: 3, gain: 0.2 },
        { band: 4, gain: 0.15 },
        { band: 5, gain: 0.1 },
        { band: 6, gain: 0.05 },
        { band: 7, gain: -0.0 },
        { band: 8, gain: -0.05 },
        { band: 9, gain: -0.1 },
        { band: 10, gain: -0.15 },
        { band: 11, gain: -0.2 },
        { band: 12, gain: -0.25 },
        { band: 13, gain: -0.3 },
        { band: 14, gain: -0.35 },
    ] as EQBand[],
};
