import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUsuario {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    organizacion: mongoose.Types.ObjectId | string | null;
}

export interface IUsuarioModel extends IUsuario, Document {}

const UsuarioSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
        organizacion: { type: Schema.Types.ObjectId, required: false, default: null, ref: 'Organizacion' }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export default mongoose.model<IUsuarioModel>('Usuario', UsuarioSchema);
