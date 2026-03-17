import mongoose from 'mongoose';
import Organizacion, { IOrganizacionModel, IOrganizacion } from '../models/Organizacion';
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



export default { createOrganizacion, getOrganizacion, getAllOrganizaciones, updateOrganizacion, deleteOrganizacion, listAllOrganizations, getOrganizationWithUsers };
