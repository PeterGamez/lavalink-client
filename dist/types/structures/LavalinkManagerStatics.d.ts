import { ClientCustomSearchPlatformUtils, LavalinkSearchPlatform, SearchPlatform, SourcesRegex } from "./Utils";
export declare const DefaultSources: Record<SearchPlatform, LavalinkSearchPlatform | ClientCustomSearchPlatformUtils>;
export declare const LavalinkPlugins: {
    DuncteBot_Plugin: string;
    GoogleCloudTTS: string;
    LavaSrc: string;
    LavaSearch: string;
    LavalinkFilterPlugin: string;
    YoutubeSource: string;
};
export declare const SourceLinksRegexes: Record<SourcesRegex, RegExp>;
