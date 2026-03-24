import mongoose from 'mongoose';
import Organizacion, { IOrganizacionModel, IOrganizacion } from '../models/Organizacion';
import Usuario, { IUsuarioModel } from '../models/Usuario';
import '../models/Usuario'; 

const createOrganizacion = async (data: Partial<IOrganizacion>): Promise<IOrganizacionModel> => {
    const organizacion = new Organizacion({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });
    return await organizacion.save();
};

const getOrganizacion = async (organizacionId: string): Promise<IOrganizacionModel | null> => {
    return await Organizacion.findById(organizacionId);
};

export const getOrganizationWithUsers = async (id: string): Promise<IOrganizacion | null> => {
    return await Organizacion.findById(id)
        .populate('users') // Fetch user details instead of just IDs
        .lean();
};

const getAllOrganizaciones = async (): Promise<IOrganizacion[]> => {
    return await Organizacion.find()
        .populate('users')
        .lean();
};

const getOrganizacionUsers = async (organizacionId: string): Promise<IUsuarioModel[] | null> => {
    const organizacion = await Organizacion.findById(organizacionId).populate('users');

    if (!organizacion) {
        return null;
    }

    return organizacion.users as IUsuarioModel[];
};

const addUserToOrganizacion = async (
    organizacionId: string,
    usuarioId: string
): Promise<IUsuarioModel | null> => {
    const [organizacion, usuario] = await Promise.all([
        Organizacion.findById(organizacionId),
        Usuario.findById(usuarioId)
    ]);

    if (!organizacion || !usuario) {
        return null;
    }

    const previousOrganizacionId = usuario.organizacion ? String(usuario.organizacion) : undefined;

    if (previousOrganizacionId && previousOrganizacionId !== organizacionId) {
        await Organizacion.findByIdAndUpdate(previousOrganizacionId, {
            $pull: { users: usuario._id }
        });
    }

    usuario.organizacion = organizacion._id;
    await usuario.save();

    await Organizacion.findByIdAndUpdate(organizacionId, {
        $addToSet: { users: usuario._id }
    });

    return usuario;
};

const removeUserFromOrganizacion = async (
    organizacionId: string,
    usuarioId: string
): Promise<IUsuarioModel | null> => {
    const [organizacion, usuario] = await Promise.all([
        Organizacion.findById(organizacionId),
        Usuario.findById(usuarioId)
    ]);

    if (!organizacion || !usuario) {
        return null;
    }

    await Organizacion.findByIdAndUpdate(organizacionId, {
        $pull: { users: usuario._id }
    });

    if (usuario.organizacion && String(usuario.organizacion) === organizacionId) {
        usuario.organizacion = null;
        await usuario.save();
    }

    return usuario;
};

const updateOrganizacion = async (organizacionId: string, data: Partial<IOrganizacion>): Promise<IOrganizacionModel | null> => {
    const organizacion = await Organizacion.findById(organizacionId);
    if (organizacion) {
        organizacion.set(data);
        return await organizacion.save();
    }
    return null;
};

const deleteOrganizacion = async (organizacionId: string): Promise<IOrganizacionModel | null> => {
    return await Organizacion.findByIdAndDelete(organizacionId);
};
export const listAllOrganizations = async (): Promise<IOrganizacion[]> => {
    return await Organizacion.find()
        .populate('users') // Fetch user details instead of just IDs
        .lean();           
};



export default {
    createOrganizacion,
    getOrganizacion,
    getAllOrganizaciones,
    getOrganizacionUsers,
    addUserToOrganizacion,
    removeUserFromOrganizacion,
    updateOrganizacion,
    deleteOrganizacion,
    listAllOrganizations,
    getOrganizationWithUsers
};
