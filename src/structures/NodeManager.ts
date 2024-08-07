import { EventEmitter } from "stream";

import { LavalinkManager } from "./LavalinkManager";
import { LavalinkNode, LavalinkNodeOptions } from "./Node";
import { DestroyReasons, DestroyReasonsType } from "./Player";
import { LavalinkPlayer, MiniMap } from "./Utils";

type LavalinkNodeIdentifier = string;

export interface NodeManagerEvents {
    /**
     * Emitted when a Node is created.
     * @event Manager.nodeManager#create
     */
    create: (node: LavalinkNode) => void;

    /**
     * Emitted when a Node is destroyed.
     * @event Manager.nodeManager#destroy
     */
    destroy: (node: LavalinkNode, destroyReason?: DestroyReasonsType) => void;

    /**
     * Emitted when a Node is connected.
     * @event Manager.nodeManager#connect
     */
    connect: (node: LavalinkNode) => void;

    /**
     * Emitted when a Node is reconnecting.
     * @event Manager.nodeManager#reconnecting
     */
    reconnecting: (node: LavalinkNode) => void;

    /**
     * Emitted when a Node is disconnects.
     * @event Manager.nodeManager#disconnect
     */
    disconnect: (node: LavalinkNode, reason: { code?: number; reason?: string }) => void;

    /**
     * Emitted when a Node is error.
     * @event Manager.nodeManager#error
     */
    error: (node: LavalinkNode, error: Error, payload?: unknown) => void;

    /**
     * Emits every single Node event.
     * @event Manager.nodeManager#raw
     */
    raw: (node: LavalinkNode, payload: unknown) => void;

    /**
     * Emits when the node connects resumed. You then need to create all players within this event for your usecase.
     * Aka for that you need to be able to save player data like vc channel + text channel in a db and then sync it again
     * @event Manager.nodeManager#nodeResumed
     */
    resumed: (node: LavalinkNode, paylaod: { resumed: true; sessionId: string; op: "ready" }, players: LavalinkPlayer[]) => void;
}

export declare interface NodeManager {
    /** @private */
    on<U extends keyof NodeManagerEvents>(event: U, listener: NodeManagerEvents[U]): this;
    /** @private */
    emit<U extends keyof NodeManagerEvents>(event: U, ...args: Parameters<NodeManagerEvents[U]>): boolean;
    /** @private */
    removeAllListeners(event?: keyof NodeManagerEvents): this;
    /** @private */
    LavalinkManager: LavalinkManager;
}

export class NodeManager extends EventEmitter {
    public nodes: MiniMap<string, LavalinkNode> = new MiniMap();
    constructor(LavalinkManager: LavalinkManager) {
        super();
        this.LavalinkManager = LavalinkManager;
        if (this.LavalinkManager.options.nodes) this.LavalinkManager.options.nodes.forEach((node) => this.createNode(node));
    }
    /**
     * Disconnects all Nodes from lavalink ws sockets
     * @param deleteAllNodes if the nodes should also be deleted from nodeManager.nodes
     * @returns amount of disconnected Nodes
     */
    public async disconnectAll(deleteAllNodes = false) {
        if (!this.nodes.size) throw new Error("There are no nodes to disconnect (no nodes in the nodemanager)");
        if (!this.nodes.filter((v) => v.connected).size) throw new Error("There are no nodes to disconnect (all nodes disconnected)");
        let counter = 0;
        for (const node of [...this.nodes.values()]) {
            if (!node.connected) continue;
            await node.destroy(DestroyReasons.DisconnectAllNodes, deleteAllNodes);
            counter++;
        }
        return counter;
    }
    /**
     * Connects all not connected nodes
     * @returns Amount of connected Nodes
     */
    public async connectAll() {
        if (!this.nodes.size) throw new Error("There are no nodes to connect (no nodes in the nodemanager)");
        if (!this.nodes.filter((v) => !v.connected).size) throw new Error("There are no nodes to connect (all nodes connected)");
        let counter = 0;
        for (const node of [...this.nodes.values()]) {
            if (node.connected) continue;
            await node.connect();
            counter++;
        }
        return counter;
    }
    /**
     * Forcefully reconnects all nodes
     * @returns amount of nodes
     */
    public async reconnectAll() {
        if (!this.nodes.size) throw new Error("There are no nodes to reconnect (no nodes in the nodemanager)");
        let counter = 0;
        for (const node of [...this.nodes.values()]) {
            const sessionId = node.sessionId ? `${node.sessionId}` : undefined;
            await node.destroy(DestroyReasons.ReconnectAllNodes, false);
            await node.connect(sessionId);
            counter++;
        }
        return counter;
    }
    public createNode(options: LavalinkNodeOptions) {
        if (this.nodes.has(options.id || `${options.host}:${options.port}`)) return this.nodes.get(options.id || `${options.host}:${options.port}`)!;
        const newNode = new LavalinkNode(options, this);
        this.nodes.set(newNode.id, newNode);
        return newNode;
    }
    public leastUsedNodes(sortType: "memory" | "cpuLavalink" | "cpuSystem" | "calls" | "playingPlayers" | "players" = "players"): LavalinkNode[] {
        switch (sortType) {
            case "memory":
                {
                    return [...this.nodes.values()].filter((node) => node.connected).sort((a, b) => (a.stats?.memory?.used || 0) - (b.stats?.memory?.used || 0)); // sort after memor
                }
                break;
            case "cpuLavalink":
                {
                    return [...this.nodes.values()].filter((node) => node.connected).sort((a, b) => (a.stats?.cpu?.lavalinkLoad || 0) - (b.stats?.cpu?.lavalinkLoad || 0)); // sort after memor
                }
                break;
            case "cpuSystem":
                {
                    return [...this.nodes.values()].filter((node) => node.connected).sort((a, b) => (a.stats?.cpu?.systemLoad || 0) - (b.stats?.cpu?.systemLoad || 0)); // sort after memor
                }
                break;
            case "calls":
                {
                    return [...this.nodes.values()].filter((node) => node.connected).sort((a, b) => a.calls - b.calls); // client sided sorting
                }
                break;
            case "playingPlayers":
                {
                    return [...this.nodes.values()].filter((node) => node.connected).sort((a, b) => (a.stats?.playingPlayers || 0) - (b.stats?.playingPlayers || 0));
                }
                break;
            case "players":
                {
                    return [...this.nodes.values()].filter((node) => node.connected).sort((a, b) => (a.stats?.players || 0) - (b.stats?.players || 0));
                }
                break;
            default:
                {
                    return [...this.nodes.values()].filter((node) => node.connected).sort((a, b) => (a.stats?.players || 0) - (b.stats?.players || 0));
                }
                break;
        }
    }

    public deleteNode(node: LavalinkNodeIdentifier | LavalinkNode) {
        const decodeNode = typeof node === "string" ? this.nodes.get(node) : node || this.leastUsedNodes()[0];
        if (!decodeNode) throw new Error("Node was not found");
        decodeNode.destroy(DestroyReasons.NodeDeleted);
        this.nodes.delete(decodeNode.id);
        return;
    }
}
