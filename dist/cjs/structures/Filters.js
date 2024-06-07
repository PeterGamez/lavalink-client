"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EQList = exports.audioOutputsData = exports.FilterManager = void 0;
class FilterManager {
    equalizerBands = [];
    filterUpdatedState = 0;
    filters = {
        volume: false,
        vaporwave: false,
        custom: false,
        nightcore: false,
        rotation: false,
        karaoke: false,
        tremolo: false,
        vibrato: false,
        lowPass: false,
        lavalinkFilterPlugin: {
            echo: false,
            reverb: false,
        },
        lavalinkLavaDspxPlugin: {
            lowPass: false,
            highPass: false,
            normalization: false,
            echo: false,
        },
        audioOutput: "stereo",
    };
    data = {
        lowPass: {
            smoothing: 0,
        },
        karaoke: {
            level: 0,
            monoLevel: 0,
            filterBand: 0,
            filterWidth: 0,
        },
        timescale: {
            speed: 1,
            pitch: 1,
            rate: 1,
        },
        rotation: {
            rotationHz: 0,
        },
        tremolo: {
            frequency: 0,
            depth: 0,
        },
        vibrato: {
            frequency: 0,
            depth: 0,
        },
        pluginFilters: {
            "lavalink-filter-plugin": {
                echo: {
                    delay: 0,
                    decay: 0,
                },
                reverb: {
                    delays: [],
                    gains: [],
                },
            },
            "high-pass": {},
            "low-pass": {},
            normalization: {},
            echo: {},
        },
        channelMix: exports.audioOutputsData.stereo,
    };
    player;
    constructor(player) {
        this.player = player;
    }
    async applyPlayerFilters() {
        const sendData = { ...this.data };
        this.checkFiltersState();
        if (!this.filters.volume)
            delete sendData.volume;
        if (!this.filters.tremolo)
            delete sendData.tremolo;
        if (!this.filters.vibrato)
            delete sendData.vibrato;
        if (!this.filters.lavalinkFilterPlugin.echo)
            delete sendData.pluginFilters?.["lavalink-filter-plugin"]?.echo;
        if (!this.filters.lavalinkFilterPlugin.reverb)
            delete sendData.pluginFilters?.["lavalink-filter-plugin"]?.reverb;
        if (!this.filters.lavalinkLavaDspxPlugin.echo)
            delete sendData.pluginFilters?.echo;
        if (!this.filters.lavalinkLavaDspxPlugin.normalization)
            delete sendData.pluginFilters?.normalization;
        if (!this.filters.lavalinkLavaDspxPlugin.highPass)
            delete sendData.pluginFilters?.["high-pass"];
        if (!this.filters.lavalinkLavaDspxPlugin.lowPass)
            delete sendData.pluginFilters?.["low-pass"];
        if (sendData.pluginFilters?.["lavalink-filter-plugin"] && Object.values(sendData.pluginFilters?.["lavalink-filter-plugin"]).length === 0)
            delete sendData.pluginFilters["lavalink-filter-plugin"];
        if (sendData.pluginFilters && Object.values(sendData.pluginFilters).length === 0)
            delete sendData.pluginFilters;
        if (!this.filters.lowPass)
            delete sendData.lowPass;
        if (!this.filters.karaoke)
            delete sendData.karaoke;
        if (!this.filters.rotation)
            delete sendData.rotation;
        if (this.filters.audioOutput === "stereo")
            delete sendData.channelMix;
        if (Object.values(this.data.timescale).every((v) => v === 1))
            delete sendData.timescale;
        if (!this.player.node.sessionId)
            throw new Error("The Lavalink-Node is either not ready or not up to date");
        sendData.equalizer = [...this.equalizerBands];
        if (sendData.equalizer.length === 0)
            delete sendData.equalizer;
        for (const key of [...Object.keys(sendData)]) {
            if (key === "pluginFilters") {
            }
            else if (this.player.node.info && !this.player.node.info?.filters?.includes?.(key))
                delete sendData[key];
        }
        const now = performance.now();
        await this.player.node.updatePlayer({
            guildId: this.player.guildId,
            playerOptions: {
                filters: sendData,
            },
        });
        this.player.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
        if (this.player.options.instaUpdateFiltersFix === true)
            this.filterUpdatedState = 1;
        return;
    }
    checkFiltersState(oldFilterTimescale) {
        this.filters.rotation = this.data.rotation.rotationHz !== 0;
        this.filters.vibrato = this.data.vibrato.frequency !== 0 || this.data.vibrato.depth !== 0;
        this.filters.tremolo = this.data.tremolo.frequency !== 0 || this.data.tremolo.depth !== 0;
        const lavalinkFilterData = this.data.pluginFilters?.["lavalink-filter-plugin"] || { echo: { decay: this.data.pluginFilters?.echo?.decay && !this.data.pluginFilters?.echo?.echoLength ? this.data.pluginFilters.echo.decay : 0, delay: this.data.pluginFilters?.echo?.delay || 0 }, reverb: { gains: [], delays: [], ...(this.data.pluginFilters.reverb || {}) } };
        this.filters.lavalinkFilterPlugin.echo = lavalinkFilterData.echo.decay !== 0 || lavalinkFilterData.echo.delay !== 0;
        this.filters.lavalinkFilterPlugin.reverb = lavalinkFilterData.reverb?.delays?.length !== 0 || lavalinkFilterData.reverb?.gains?.length !== 0;
        this.filters.lavalinkLavaDspxPlugin.highPass = Object.values(this.data.pluginFilters["high-pass"] || {}).length > 0;
        this.filters.lavalinkLavaDspxPlugin.lowPass = Object.values(this.data.pluginFilters["low-pass"] || {}).length > 0;
        this.filters.lavalinkLavaDspxPlugin.normalization = Object.values(this.data.pluginFilters.normalization || {}).length > 0;
        this.filters.lavalinkLavaDspxPlugin.echo = Object.values(this.data.pluginFilters.echo || {}).length > 0 && typeof this.data.pluginFilters?.echo?.delay === "undefined";
        this.filters.lowPass = this.data.lowPass.smoothing !== 0;
        this.filters.karaoke = Object.values(this.data.karaoke).some((v) => v !== 0);
        if ((this.filters.nightcore || this.filters.vaporwave) && oldFilterTimescale) {
            if (oldFilterTimescale.pitch !== this.data.timescale.pitch || oldFilterTimescale.rate !== this.data.timescale.rate || oldFilterTimescale.speed !== this.data.timescale.speed) {
                this.filters.custom = Object.values(this.data.timescale).some((v) => v !== 1);
                this.filters.nightcore = false;
                this.filters.vaporwave = false;
            }
        }
        return true;
    }
    async resetFilters() {
        this.filters.lavalinkLavaDspxPlugin.echo = false;
        this.filters.lavalinkLavaDspxPlugin.normalization = false;
        this.filters.lavalinkLavaDspxPlugin.highPass = false;
        this.filters.lavalinkLavaDspxPlugin.lowPass = false;
        this.filters.lavalinkFilterPlugin.echo = false;
        this.filters.lavalinkFilterPlugin.reverb = false;
        this.filters.nightcore = false;
        this.filters.lowPass = false;
        this.filters.rotation = false;
        this.filters.tremolo = false;
        this.filters.vibrato = false;
        this.filters.karaoke = false;
        this.filters.karaoke = false;
        this.filters.volume = false;
        this.filters.audioOutput = "stereo";
        for (const [key, value] of Object.entries({
            volume: 1,
            lowPass: {
                smoothing: 0,
            },
            karaoke: {
                level: 0,
                monoLevel: 0,
                filterBand: 0,
                filterWidth: 0,
            },
            timescale: {
                speed: 1,
                pitch: 1,
                rate: 1,
            },
            pluginFilters: {
                "lavalink-filter-plugin": {
                    echo: {},
                    reverb: {},
                },
                "high-pass": {},
                "low-pass": {},
                normalization: {},
                echo: {},
            },
            rotation: {
                rotationHz: 0,
            },
            tremolo: {
                frequency: 0,
                depth: 0,
            },
            vibrato: {
                frequency: 0,
                depth: 0,
            },
            channelMix: exports.audioOutputsData.stereo,
        })) {
            this.data[key] = value;
        }
        await this.applyPlayerFilters();
        return this.filters;
    }
    async setVolume(volume) {
        if (volume < 0 || volume > 5)
            throw new SyntaxError("Volume-Filter must be between 0 and 5");
        this.data.volume = volume;
        await this.applyPlayerFilters();
        return this.filters.volume;
    }
    async setAudioOutput(type) {
        if (this.player.node.info && !this.player.node.info?.filters?.includes("channelMix"))
            throw new Error("Node#Info#filters does not include the 'channelMix' Filter (Node has it not enable)");
        if (!type || !exports.audioOutputsData[type])
            throw "Invalid audio type added, must be 'mono' / 'stereo' / 'left' / 'right'";
        this.data.channelMix = exports.audioOutputsData[type];
        this.filters.audioOutput = type;
        await this.applyPlayerFilters();
        return this.filters.audioOutput;
    }
    async setSpeed(speed = 1) {
        if (this.player.node.info && !this.player.node.info?.filters?.includes("timescale"))
            throw new Error("Node#Info#filters does not include the 'timescale' Filter (Node has it not enable)");
        if (this.filters.nightcore || this.filters.vaporwave) {
            this.data.timescale.pitch = 1;
            this.data.timescale.speed = 1;
            this.data.timescale.rate = 1;
            this.filters.nightcore = false;
            this.filters.vaporwave = false;
        }
        this.data.timescale.speed = speed;
        this.isCustomFilterActive();
        await this.applyPlayerFilters();
        return this.filters.custom;
    }
    async setPitch(pitch = 1) {
        if (this.player.node.info && !this.player.node.info?.filters?.includes("timescale"))
            throw new Error("Node#Info#filters does not include the 'timescale' Filter (Node has it not enable)");
        if (this.filters.nightcore || this.filters.vaporwave) {
            this.data.timescale.pitch = 1;
            this.data.timescale.speed = 1;
            this.data.timescale.rate = 1;
            this.filters.nightcore = false;
            this.filters.vaporwave = false;
        }
        this.data.timescale.pitch = pitch;
        this.isCustomFilterActive();
        await this.applyPlayerFilters();
        return this.filters.custom;
    }
    async setRate(rate = 1) {
        if (this.player.node.info && !this.player.node.info?.filters?.includes("timescale"))
            throw new Error("Node#Info#filters does not include the 'timescale' Filter (Node has it not enable)");
        if (this.filters.nightcore || this.filters.vaporwave) {
            this.data.timescale.pitch = 1;
            this.data.timescale.speed = 1;
            this.data.timescale.rate = 1;
            this.filters.nightcore = false;
            this.filters.vaporwave = false;
        }
        this.data.timescale.rate = rate;
        this.isCustomFilterActive();
        await this.applyPlayerFilters();
        return this.filters.custom;
    }
    async toggleRotation(rotationHz = 0.2) {
        if (this.player.node.info && !this.player.node.info?.filters?.includes("rotation"))
            throw new Error("Node#Info#filters does not include the 'rotation' Filter (Node has it not enable)");
        this.data.rotation.rotationHz = this.filters.rotation ? 0 : rotationHz;
        this.filters.rotation = !this.filters.rotation;
        return await this.applyPlayerFilters(), this.filters.rotation;
    }
    async toggleVibrato(frequency = 10, depth = 1) {
        if (this.player.node.info && !this.player.node.info?.filters?.includes("vibrato"))
            throw new Error("Node#Info#filters does not include the 'vibrato' Filter (Node has it not enable)");
        this.data.vibrato.frequency = this.filters.vibrato ? 0 : frequency;
        this.data.vibrato.depth = this.filters.vibrato ? 0 : depth;
        this.filters.vibrato = !this.filters.vibrato;
        await this.applyPlayerFilters();
        return this.filters.vibrato;
    }
    async toggleTremolo(frequency = 4, depth = 0.8) {
        if (this.player.node.info && !this.player.node.info?.filters?.includes("tremolo"))
            throw new Error("Node#Info#filters does not include the 'tremolo' Filter (Node has it not enable)");
        this.data.tremolo.frequency = this.filters.tremolo ? 0 : frequency;
        this.data.tremolo.depth = this.filters.tremolo ? 0 : depth;
        this.filters.tremolo = !this.filters.tremolo;
        await this.applyPlayerFilters();
        return this.filters.tremolo;
    }
    async toggleLowPass(smoothing = 20) {
        if (this.player.node.info && !this.player.node.info?.filters?.includes("lowPass"))
            throw new Error("Node#Info#filters does not include the 'lowPass' Filter (Node has it not enable)");
        this.data.lowPass.smoothing = this.filters.lowPass ? 0 : smoothing;
        this.filters.lowPass = !this.filters.lowPass;
        await this.applyPlayerFilters();
        return this.filters.lowPass;
    }
    lavalinkLavaDspxPlugin = {
        toggleLowPass: async (boostFactor = 1.0, cutoffFrequency = 80) => {
            if (this.player.node.info && !this.player.node.info?.plugins?.find((v) => v.name === "lavadspx-plugin"))
                throw new Error("Node#Info#plugins does not include the lavadspx plugin");
            if (this.player.node.info && !this.player.node.info?.filters?.includes("low-pass"))
                throw new Error("Node#Info#filters does not include the 'low-pass' Filter (Node has it not enable)");
            if (!this.data)
                this.data = {};
            if (!this.data.pluginFilters)
                this.data.pluginFilters = {};
            if (!this.data.pluginFilters["low-pass"])
                this.data.pluginFilters["low-pass"] = {};
            if (this.filters.lavalinkLavaDspxPlugin.lowPass) {
                delete this.data.pluginFilters["low-pass"];
            }
            else {
                this.data.pluginFilters["low-pass"] = {
                    boostFactor: boostFactor,
                    cutoffFrequency: cutoffFrequency,
                };
            }
            this.filters.lavalinkLavaDspxPlugin.lowPass = !this.filters.lavalinkLavaDspxPlugin.lowPass;
            await this.applyPlayerFilters();
            return this.filters.lavalinkLavaDspxPlugin.lowPass;
        },
        toggleHighPass: async (boostFactor = 1.0, cutoffFrequency = 80) => {
            if (this.player.node.info && !this.player.node.info?.plugins?.find((v) => v.name === "lavadspx-plugin"))
                throw new Error("Node#Info#plugins does not include the lavadspx plugin");
            if (this.player.node.info && !this.player.node.info?.filters?.includes("high-pass"))
                throw new Error("Node#Info#filters does not include the 'high-pass' Filter (Node has it not enable)");
            if (!this.data)
                this.data = {};
            if (!this.data.pluginFilters)
                this.data.pluginFilters = {};
            if (!this.data.pluginFilters["high-pass"])
                this.data.pluginFilters["high-pass"] = {};
            if (this.filters.lavalinkLavaDspxPlugin.highPass) {
                delete this.data.pluginFilters["high-pass"];
            }
            else {
                this.data.pluginFilters["high-pass"] = {
                    boostFactor: boostFactor,
                    cutoffFrequency: cutoffFrequency,
                };
            }
            this.filters.lavalinkLavaDspxPlugin.highPass = !this.filters.lavalinkLavaDspxPlugin.highPass;
            await this.applyPlayerFilters();
            return this.filters.lavalinkLavaDspxPlugin.highPass;
        },
        toggleNormalization: async (maxAmplitude = 0.75, adaptive = true) => {
            if (this.player.node.info && !this.player.node.info?.plugins?.find((v) => v.name === "lavadspx-plugin"))
                throw new Error("Node#Info#plugins does not include the lavadspx plugin");
            if (this.player.node.info && !this.player.node.info?.filters?.includes("normalization"))
                throw new Error("Node#Info#filters does not include the 'normalization' Filter (Node has it not enable)");
            if (!this.data)
                this.data = {};
            if (!this.data.pluginFilters)
                this.data.pluginFilters = {};
            if (!this.data.pluginFilters.normalization)
                this.data.pluginFilters.normalization = {};
            if (this.filters.lavalinkLavaDspxPlugin.normalization) {
                delete this.data.pluginFilters.normalization;
            }
            else {
                this.data.pluginFilters.normalization = {
                    adaptive: adaptive,
                    maxAmplitude: maxAmplitude,
                };
            }
            this.filters.lavalinkLavaDspxPlugin.normalization = !this.filters.lavalinkLavaDspxPlugin.normalization;
            await this.applyPlayerFilters();
            return this.filters.lavalinkLavaDspxPlugin.normalization;
        },
        toggleEcho: async (decay = 0.5, echoLength = 0.5) => {
            if (this.player.node.info && !this.player.node.info?.plugins?.find((v) => v.name === "lavadspx-plugin"))
                throw new Error("Node#Info#plugins does not include the lavadspx plugin");
            if (this.player.node.info && !this.player.node.info?.filters?.includes("echo"))
                throw new Error("Node#Info#filters does not include the 'echo' Filter (Node has it not enable)");
            if (!this.data)
                this.data = {};
            if (!this.data.pluginFilters)
                this.data.pluginFilters = {};
            if (!this.data.pluginFilters.echo)
                this.data.pluginFilters.echo = {};
            if (this.filters.lavalinkLavaDspxPlugin.echo) {
                delete this.data.pluginFilters.echo;
            }
            else {
                this.data.pluginFilters.echo = {
                    decay: decay,
                    echoLength: echoLength,
                };
            }
            this.filters.lavalinkLavaDspxPlugin.echo = !this.filters.lavalinkLavaDspxPlugin.echo;
            await this.applyPlayerFilters();
            return this.filters.lavalinkLavaDspxPlugin.echo;
        },
    };
    lavalinkFilterPlugin = {
        toggleEcho: async (delay = 4, decay = 0.8) => {
            if (this.player.node.info && !this.player.node.info?.plugins?.find((v) => v.name === "lavalink-filter-plugin"))
                throw new Error("Node#Info#plugins does not include the lavalink-filter-plugin plugin");
            if (this.player.node.info && !this.player.node.info?.filters?.includes("echo"))
                throw new Error("Node#Info#filters does not include the 'echo' Filter (Node has it not enable aka not installed!)");
            if (!this.data)
                this.data = {};
            if (!this.data.pluginFilters)
                this.data.pluginFilters = {};
            if (!this.data.pluginFilters["lavalink-filter-plugin"])
                this.data.pluginFilters["lavalink-filter-plugin"] = { echo: { decay: 0, delay: 0 }, reverb: { delays: [], gains: [] } };
            if (!this.data.pluginFilters["lavalink-filter-plugin"].echo)
                this.data.pluginFilters["lavalink-filter-plugin"].echo = { decay: 0, delay: 0 };
            this.data.pluginFilters["lavalink-filter-plugin"].echo.delay = this.filters.lavalinkFilterPlugin.echo ? 0 : delay;
            this.data.pluginFilters["lavalink-filter-plugin"].echo.decay = this.filters.lavalinkFilterPlugin.echo ? 0 : decay;
            this.filters.lavalinkFilterPlugin.echo = !this.filters.lavalinkFilterPlugin.echo;
            await this.applyPlayerFilters();
            return this.filters.lavalinkFilterPlugin.echo;
        },
        toggleReverb: async (delays = [0.037, 0.042, 0.048, 0.053], gains = [0.84, 0.83, 0.82, 0.81]) => {
            if (this.player.node.info && !this.player.node.info?.plugins?.find((v) => v.name === "lavalink-filter-plugin"))
                throw new Error("Node#Info#plugins does not include the lavalink-filter-plugin plugin");
            if (this.player.node.info && !this.player.node.info?.filters?.includes("reverb"))
                throw new Error("Node#Info#filters does not include the 'reverb' Filter (Node has it not enable aka not installed!)");
            if (!this.data)
                this.data = {};
            if (!this.data.pluginFilters)
                this.data.pluginFilters = {};
            if (!this.data.pluginFilters["lavalink-filter-plugin"])
                this.data.pluginFilters["lavalink-filter-plugin"] = { echo: { decay: 0, delay: 0 }, reverb: { delays: [], gains: [] } };
            if (!this.data.pluginFilters["lavalink-filter-plugin"].reverb)
                this.data.pluginFilters["lavalink-filter-plugin"].reverb = { delays: [], gains: [] };
            this.data.pluginFilters["lavalink-filter-plugin"].reverb.delays = this.filters.lavalinkFilterPlugin.reverb ? [] : delays;
            this.data.pluginFilters["lavalink-filter-plugin"].reverb.gains = this.filters.lavalinkFilterPlugin.reverb ? [] : gains;
            this.filters.lavalinkFilterPlugin.reverb = !this.filters.lavalinkFilterPlugin.reverb;
            await this.applyPlayerFilters();
            return this.filters.lavalinkFilterPlugin.reverb;
        },
    };
    async toggleNightcore(speed = 1.289999523162842, pitch = 1.289999523162842, rate = 0.9365999523162842) {
        if (this.player.node.info && !this.player.node.info?.filters?.includes("timescale"))
            throw new Error("Node#Info#filters does not include the 'timescale' Filter (Node has it not enable)");
        this.data.timescale.speed = this.filters.nightcore ? 1 : speed;
        this.data.timescale.pitch = this.filters.nightcore ? 1 : pitch;
        this.data.timescale.rate = this.filters.nightcore ? 1 : rate;
        this.filters.nightcore = !this.filters.nightcore;
        this.filters.vaporwave = false;
        this.filters.custom = false;
        await this.applyPlayerFilters();
        return this.filters.nightcore;
    }
    async toggleVaporwave(speed = 0.8500000238418579, pitch = 0.800000011920929, rate = 1) {
        if (this.player.node.info && !this.player.node.info?.filters?.includes("timescale"))
            throw new Error("Node#Info#filters does not include the 'timescale' Filter (Node has it not enable)");
        this.data.timescale.speed = this.filters.vaporwave ? 1 : speed;
        this.data.timescale.pitch = this.filters.vaporwave ? 1 : pitch;
        this.data.timescale.rate = this.filters.vaporwave ? 1 : rate;
        this.filters.vaporwave = !this.filters.vaporwave;
        this.filters.nightcore = false;
        this.filters.custom = false;
        await this.applyPlayerFilters();
        return this.filters.vaporwave;
    }
    async toggleKaraoke(level = 1, monoLevel = 1, filterBand = 220, filterWidth = 100) {
        if (this.player.node.info && !this.player.node.info?.filters?.includes("karaoke"))
            throw new Error("Node#Info#filters does not include the 'karaoke' Filter (Node has it not enable)");
        this.data.karaoke.level = this.filters.karaoke ? 0 : level;
        this.data.karaoke.monoLevel = this.filters.karaoke ? 0 : monoLevel;
        this.data.karaoke.filterBand = this.filters.karaoke ? 0 : filterBand;
        this.data.karaoke.filterWidth = this.filters.karaoke ? 0 : filterWidth;
        this.filters.karaoke = !this.filters.karaoke;
        await this.applyPlayerFilters();
        return this.filters.karaoke;
    }
    isCustomFilterActive() {
        this.filters.custom = !this.filters.nightcore && !this.filters.vaporwave && Object.values(this.data.timescale).some((d) => d !== 1);
        return this.filters.custom;
    }
    async setEQ(bands) {
        if (!Array.isArray(bands))
            bands = [bands];
        if (!bands.length || !bands.every((band) => JSON.stringify(Object.keys(band).sort()) === '["band","gain"]'))
            throw new TypeError("Bands must be a non-empty object array containing 'band' and 'gain' properties.");
        for (const { band, gain } of bands)
            this.equalizerBands[band] = { band, gain };
        if (!this.player.node.sessionId)
            throw new Error("The Lavalink-Node is either not ready or not up to date");
        const now = performance.now();
        await this.player.node.updatePlayer({
            guildId: this.player.guildId,
            playerOptions: {
                filters: { equalizer: this.equalizerBands },
            },
        });
        this.player.ping.lavalink = Math.round((performance.now() - now) / 10) / 100;
        if (this.player.options.instaUpdateFiltersFix === true)
            this.filterUpdatedState = 1;
        return this;
    }
    async clearEQ() {
        return this.setEQ(new Array(15).fill(0.0).map((gain, band) => ({ band, gain })));
    }
}
exports.FilterManager = FilterManager;
exports.audioOutputsData = {
    mono: {
        leftToLeft: 0.5,
        leftToRight: 0.5,
        rightToLeft: 0.5,
        rightToRight: 0.5,
    },
    stereo: {
        leftToLeft: 1,
        leftToRight: 0,
        rightToLeft: 0,
        rightToRight: 1,
    },
    left: {
        leftToLeft: 1,
        leftToRight: 0,
        rightToLeft: 1,
        rightToRight: 0,
    },
    right: {
        leftToLeft: 0,
        leftToRight: 1,
        rightToLeft: 0,
        rightToRight: 1,
    },
};
exports.EQList = {
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
    ],
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
    ],
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
    ],
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
    ],
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
    ],
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
    ],
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
    ],
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
    ],
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
    ],
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
    ],
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
    ],
};
