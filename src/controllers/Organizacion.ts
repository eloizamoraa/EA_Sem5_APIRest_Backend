import { NextFunction, Request, Response } from 'express';
import OrganizacionService from '../services/Organizacion';

const createOrganizacion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const savedOrganizacion = await OrganizacionService.createOrganizacion(req.body);
        return res.status(201).json(savedOrganizacion);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readOrganizacion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizacion = await OrganizacionService.getOrganizacion(req.params.organizacionId);
        return organizacion ? res.status(200).json(organizacion) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizaciones = await OrganizacionService.getAllOrganizaciones();
        return res.status(200).json(organizaciones);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const updateOrganizacion = async (req: Request, res: Response, next: NextFunction) => {
    const organizacionId = req.params.organizacionId;

    try {
        const organizacion = await OrganizacionService.updateOrganizacion(organizacionId, req.body);
        return organizacion ? res.status(200).json(organizacion) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const deleteOrganizacion = async (req: Request, res: Response, next: NextFunction) => {
    const organizacionId = req.params.organizacionId;

    try {
        const organizacion = await OrganizacionService.deleteOrganizacion(organizacionId);
        return organizacion ? res.status(201).json(organizacion) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};
const getOrganizacionUsers = async (
    req: Request<{ organizacionId: string }>,
    res: Response
): Promise<void> => {
    try {
        const { organizacionId } = req.params;

        const users = await OrganizacionService.getOrganizacionUsers(organizacionId);

        if (!users) {
            res.status(404).json({ message: 'organizacion not found' });
            return;
        }

        res.status(200).json(users);

    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const addUsuarioToOrganizacion = async (
    req: Request<{ organizacionId: string; usuarioId: string }>,
    res: Response
): Promise<void> => {
    try {
        const { organizacionId, usuarioId } = req.params;
        const usuario = await OrganizacionService.addUserToOrganizacion(organizacionId, usuarioId);

        if (!usuario) {
            res.status(404).json({ message: 'organizacion or usuario not found' });
            return;
        }

        res.status(200).json(usuario);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const removeUsuarioFromOrganizacion = async (
    req: Request<{ organizacionId: string; usuarioId: string }>,
    res: Response
): Promise<void> => {
    try {
        const { organizacionId, usuarioId } = req.params;
        const usuario = await OrganizacionService.removeUserFromOrganizacion(organizacionId, usuarioId);

        if (!usuario) {
            res.status(404).json({ message: 'organizacion or usuario not found' });
            return;
        }

        res.status(200).json(usuario);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


export default {
    createOrganizacion,
    readOrganizacion,
    readAll,
    updateOrganizacion,
    deleteOrganizacion,
    getOrganizacionUsers,
    addUsuarioToOrganizacion,
    removeUsuarioFromOrganizacion
};
