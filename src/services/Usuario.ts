import mongoose from 'mongoose';
import Usuario, { IUsuarioModel, IUsuario } from '../models/Usuario';
import Organizacion from '../models/Organizacion';

const createUsuario = async (data: Partial<IUsuario>): Promise<IUsuarioModel> => {
    const usuario = new Usuario({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });

    const savedUser = await usuario.save();

    if (savedUser.organizacion) {
        await Organizacion.findByIdAndUpdate(savedUser.organizacion, {
            $addToSet: { users: savedUser._id } 
        });
    }

    return savedUser;
};

const getUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
    return await Usuario.findById(usuarioId).populate('organizacion');
};

const getAllUsuarios = async (): Promise<IUsuarioModel[]> => {
    return await Usuario.find().populate('organizacion');
};

const getUsuarioByEmail = async (email: string): Promise<IUsuarioModel | null> => {
    return await Usuario.findOne({ email });
};

const updateUsuario = async (usuarioId: string, data: Partial<IUsuario>): Promise<IUsuarioModel | null> => {
    const existingUser = await Usuario.findById(usuarioId);

    if (!existingUser) {
        return null;
    }

    const previousOrganizacionId = existingUser.organizacion ? String(existingUser.organizacion) : undefined;
    const hasOrganizacionUpdate = Object.prototype.hasOwnProperty.call(data, 'organizacion');
    const nextOrganizacionId = hasOrganizacionUpdate && data.organizacion ? String(data.organizacion) : undefined;

    const updatedUser = await Usuario.findByIdAndUpdate(usuarioId, { $set: data }, { new: true, runValidators: true });

    if (!updatedUser) {
        return null;
    }

    if (hasOrganizacionUpdate && previousOrganizacionId !== nextOrganizacionId) {
        if (previousOrganizacionId) {
            await Organizacion.findByIdAndUpdate(previousOrganizacionId, {
                $pull: { users: updatedUser._id }
            });
        }

        if (nextOrganizacionId) {
            await Organizacion.findByIdAndUpdate(nextOrganizacionId, {
                $addToSet: { users: updatedUser._id }
            });
        }
    }

    return updatedUser;
};

const deleteUsuario = async (usuarioId: string): Promise<IUsuarioModel | null> => {
    const deletedUser = await Usuario.findByIdAndDelete(usuarioId);

    if (deletedUser?.organizacion) {
        await Organizacion.findByIdAndUpdate(deletedUser.organizacion, {
            $pull: { users: deletedUser._id }
        });
    }

    return deletedUser;
};

export default { createUsuario, getUsuario, getAllUsuarios, getUsuarioByEmail, updateUsuario, deleteUsuario };