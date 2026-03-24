import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import { AddressInfo } from 'net';
import { config } from './config/config';
import Logging from './library/Logging';
import organizacionRoutes from './routes/Organizacion';
import usuarioRoutes from './routes/Usuario';
import authRoutes from './routes/Auth';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { Server as SocketIOServer } from 'socket.io';
import { registerPresenceGateway } from './socket/presence';

const router = express();

// Keep current query behavior explicit and silence Mongoose 7 deprecation warning.
mongoose.set('strictQuery', true);

/** Connect to Mongo */
mongoose
    .connect(config.mongo.url, { retryWrites: true, w: 'majority' })
    .then(() => {
        Logging.info('Mongo connected successfully.');
        StartServer();
    })
    .catch((error) => Logging.error(error));

/** Only Start Server if Mongoose Connects */
const StartServer = () => {
    /** Log the request */
    router.use((req, res, next) => {
        Logging.info(
            `Incomming - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`
        );

        res.on('finish', () => {
            Logging.info(
                `Result - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}] - STATUS: [${res.statusCode}]`
            );
        });

        next();
    });

    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());

    /** Rules of our API */
    router.use(cors());

    /** Swagger */
    router.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    /** Routes */
    router.use('/organizaciones', organizacionRoutes);
    router.use('/usuarios', usuarioRoutes);
    router.use('/auth', authRoutes);

    /** Healthcheck */
    router.get('/ping', (req, res, next) => res.status(200).json({ hello: 'world' }));

    /** Ignore browser favicon requests */
    router.get('/favicon.ico', (req, res, next) => res.status(204).end());

    /** Error handling */
    router.use((req, res, next) => {
        const error = new Error('Not found');

        Logging.error(error);

        res.status(404).json({
            message: error.message
        });
    });

    const httpServer = http.createServer(router);
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    registerPresenceGateway(io);

    httpServer.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
            Logging.error(`Port ${config.server.port} is already in use. Stop the running process or change SERVER_PORT.`);
            process.exit(1);
        }

        Logging.error(error);
        process.exit(1);
    });

    httpServer.listen(config.server.port, () => {
        const address = httpServer.address() as AddressInfo | null;
        Logging.info(`Server is running on port ${address?.port ?? config.server.port}`);
    });
};