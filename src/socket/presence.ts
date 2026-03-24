import { Server, Socket } from 'socket.io';
import Logging from '../library/Logging';

export type PresenceUserPayload = {
    userId: string;
    username: string;
};

export type ActiveUser = {
    userId: string;
    username: string;
    socketCount: number;
    connectedAt: string;
};

export type PresenceStats = {
    totalUsers: number;
    totalConnections: number;
};

type SocketUserState = {
    userId: string;
    username: string;
    connectedAt: number;
};

type PresencePayloadInput =
    | PresenceUserPayload
    | {
          id?: string;
          user?: string;
          uid?: string;
          _id?: string;
          userId?: string;
          userName?: string;
          username?: string;
          name?: string;
          nombre?: string;
          email?: string;
      };

const CLIENT_EVENTS = {
    USER_CONNECTED: 'user:connected',
    USER_CONNECTED_ALT_1: 'userConnected',
    USER_CONNECTED_ALT_2: 'user-connected',
    USER_CONNECTED_ALT_3: 'usuario:conectado'
} as const;

const SERVER_EVENTS = {
    USERS_UPDATED: 'users:updated',
    STATS_UPDATED: 'presence:stats',
    PRESENCE_ERROR: 'presence:error'
} as const;

class PresenceStore {
    private socketToUser = new Map<string, SocketUserState>();
    private userToSockets = new Map<string, Set<string>>();
    private userMetadata = new Map<string, { username: string; connectedAt: number }>();

    public upsertSocket(socketId: string, payload: PresenceUserPayload): boolean {
        const userId = payload.userId?.trim();
        const username = payload.username?.trim();

        if (!userId || !username) {
            throw new Error('Invalid payload: userId and username are required.');
        }

        const existingState = this.socketToUser.get(socketId);

        if (existingState) {
            const isSameUser = existingState.userId === userId && existingState.username === username;
            if (isSameUser) {
                return false;
            }

            this.removeSocket(socketId);
        }

        const now = Date.now();

        this.socketToUser.set(socketId, {
            userId,
            username,
            connectedAt: now
        });

        const sockets = this.userToSockets.get(userId) ?? new Set<string>();
        sockets.add(socketId);
        this.userToSockets.set(userId, sockets);

        if (!this.userMetadata.has(userId)) {
            this.userMetadata.set(userId, {
                username,
                connectedAt: now
            });
        } else {
            const existingMetadata = this.userMetadata.get(userId);
            this.userMetadata.set(userId, {
                username,
                connectedAt: existingMetadata?.connectedAt ?? now
            });
        }

        return true;
    }

    public removeSocket(socketId: string): boolean {
        const currentState = this.socketToUser.get(socketId);
        if (!currentState) {
            return false;
        }

        this.socketToUser.delete(socketId);

        const sockets = this.userToSockets.get(currentState.userId);
        if (!sockets) {
            return true;
        }

        sockets.delete(socketId);

        if (sockets.size === 0) {
            this.userToSockets.delete(currentState.userId);
            this.userMetadata.delete(currentState.userId);
        } else {
            this.userToSockets.set(currentState.userId, sockets);
        }

        return true;
    }

    public getActiveUsers(): ActiveUser[] {
        const activeUsers: ActiveUser[] = [];

        for (const [userId, sockets] of this.userToSockets.entries()) {
            const metadata = this.userMetadata.get(userId);
            if (!metadata) {
                continue;
            }

            activeUsers.push({
                userId,
                username: metadata.username,
                socketCount: sockets.size,
                connectedAt: new Date(metadata.connectedAt).toISOString()
            });
        }

        return activeUsers.sort((a, b) => a.username.localeCompare(b.username));
    }

    public getStats(): PresenceStats {
        let totalConnections = 0;

        for (const sockets of this.userToSockets.values()) {
            totalConnections += sockets.size;
        }

        return {
            totalUsers: this.userToSockets.size,
            totalConnections
        };
    }
}

const normalizePayload = (payload: PresencePayloadInput | undefined): PresenceUserPayload | null => {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const rawUserId =
        'userId' in payload
            ? payload.userId
            : 'id' in payload
              ? payload.id
                            : 'uid' in payload
                                ? payload.uid
                                : '_id' in payload
                                    ? payload._id
              : 'user' in payload
                ? payload.user
                : undefined;

    const rawUsername =
        'username' in payload
            ? payload.username
                        : 'userName' in payload
                            ? payload.userName
            : 'name' in payload
              ? payload.name
                            : 'nombre' in payload
                                ? payload.nombre
                                : 'email' in payload
                                    ? payload.email
              : undefined;

    const userId = typeof rawUserId === 'string' ? rawUserId.trim() : '';
        const usernameFromPayload = typeof rawUsername === 'string' ? rawUsername.trim() : '';
        const username = usernameFromPayload || userId;

        if (!userId) {
        return null;
    }

    return { userId, username };
};

const payloadFromHandshake = (socket: Socket): PresenceUserPayload | null => {
    const authPayload = normalizePayload(socket.handshake.auth as PresencePayloadInput | undefined);
    if (authPayload) {
        return authPayload;
    }

    const query = socket.handshake.query;

    const userId = typeof query.userId === 'string' ? query.userId.trim() : '';
    const usernameFromQuery =
        typeof query.username === 'string'
            ? query.username.trim()
            : typeof query.userName === 'string'
              ? query.userName.trim()
              : typeof query.nombre === 'string'
                ? query.nombre.trim()
                : '';

    const username = usernameFromQuery || userId;

    if (!userId) {
        return null;
    }

    return { userId, username };
};

export const registerPresenceGateway = (io: Server): void => {
    const store = new PresenceStore();

    const broadcastUsers = (): void => {
        const activeUsers = store.getActiveUsers();
        const stats = store.getStats();

        io.emit(SERVER_EVENTS.USERS_UPDATED, activeUsers);
        io.emit(SERVER_EVENTS.STATS_UPDATED, stats);
        Logging.info(
            `Presence updated. Active users: ${stats.totalUsers}, active connections: ${stats.totalConnections}`
        );
    };

    io.on('connection', (socket: Socket) => {
        Logging.info(`Socket connected: ${socket.id}`);

        const registerUser = (input: PresencePayloadInput): void => {
            const normalized = normalizePayload(input);

            if (!normalized) {
                socket.emit(SERVER_EVENTS.PRESENCE_ERROR, 'Invalid payload: userId and username are required.');
                return;
            }

            try {
                const changed = store.upsertSocket(socket.id, normalized);
                if (changed) {
                    broadcastUsers();
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Presence error';
                socket.emit(SERVER_EVENTS.PRESENCE_ERROR, message);
                Logging.warning(`Presence error for socket ${socket.id}: ${message}`);
            }
        };

        const handshakePayload = payloadFromHandshake(socket);
        if (handshakePayload) {
            registerUser(handshakePayload);
        }

        socket.emit(SERVER_EVENTS.USERS_UPDATED, store.getActiveUsers());
        socket.emit(SERVER_EVENTS.STATS_UPDATED, store.getStats());

        socket.on(CLIENT_EVENTS.USER_CONNECTED, (payload: PresencePayloadInput) => registerUser(payload));
        socket.on(CLIENT_EVENTS.USER_CONNECTED_ALT_1, (payload: PresencePayloadInput) => registerUser(payload));
        socket.on(CLIENT_EVENTS.USER_CONNECTED_ALT_2, (payload: PresencePayloadInput) => registerUser(payload));
        socket.on(CLIENT_EVENTS.USER_CONNECTED_ALT_3, (payload: PresencePayloadInput) => registerUser(payload));

        socket.on('disconnect', () => {
            const changed = store.removeSocket(socket.id);
            Logging.info(`Socket disconnected: ${socket.id}`);

            if (changed) {
                broadcastUsers();
            }
        });
    });
};
