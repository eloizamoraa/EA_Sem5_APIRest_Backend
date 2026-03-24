import mongoose from 'mongoose';
import { config } from '../config/config';
import Organizacion from '../models/Organizacion';
import Usuario from '../models/Usuario';

const ORG_NAME = 'Org Test RBAC';

const TEST_USERS = [
    {
        name: 'Admin Test',
        email: 'admin@test.com',
        password: '123456',
        role: 'admin' as const
    },
    {
        name: 'User Test',
        email: 'user@test.com',
        password: '123456',
        role: 'user' as const
    }
];

const run = async (): Promise<void> => {
    if (!config.mongo.url) {
        throw new Error('MONGO_URI is required to run seed:rbac');
    }

    await mongoose.connect(config.mongo.url, { retryWrites: true, w: 'majority' });

    try {
        let org = await Organizacion.findOne({ name: ORG_NAME });

        if (!org) {
            org = await Organizacion.create({
                name: ORG_NAME,
                users: []
            });
        }

        for (const userData of TEST_USERS) {
            const user = await Usuario.findOneAndUpdate(
                { email: userData.email },
                {
                    $set: {
                        name: userData.name,
                        email: userData.email,
                        password: userData.password,
                        role: userData.role,
                        organizacion: org._id
                    }
                },
                { new: true, upsert: true }
            );

            await Organizacion.findByIdAndUpdate(org._id, {
                $addToSet: { users: user._id }
            });
        }

        console.log('RBAC seed completed successfully.');
        console.log('Organization:', ORG_NAME);
        console.log('Admin login -> email: admin@test.com | password: 123456');
        console.log('User login  -> email: user@test.com  | password: 123456');
        console.log('Login endpoint: POST /usuarios/login');
    } finally {
        await mongoose.disconnect();
    }
};

run().catch(async (error) => {
    console.error('RBAC seed failed:', error);

    try {
        await mongoose.disconnect();
    } catch {
        // ignore disconnect error in failure path
    }

    process.exit(1);
});
