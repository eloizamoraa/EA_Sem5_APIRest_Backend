import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import UsuarioService from '../services/Usuario';
import { config } from '../config/config';
import { AuthTokenPayload } from '../middleware/Auth';
import Logging from '../library/Logging';

const createUsuario = async (req: Request, res: Response, next: NextFunction) => {
   

    try {
       const savedUsuario = await UsuarioService.createUsuario(req.body);
        return res.status(201).json(savedUsuario);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readUsuario = async (req: Request, res: Response, next: NextFunction) => {
    const usuarioId = req.params.usuarioId;

    try {
        const usuario = await UsuarioService.getUsuario(usuarioId);
        return usuario ? res.status(200).json(usuario) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const usuarios = await UsuarioService.getAllUsuarios();
        return res.status(200).json(usuarios);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const updateUsuario = async (req: Request, res: Response, next: NextFunction) => {
    const usuarioId = req.params.usuarioId;
    try {
        const updatedUsuario = await UsuarioService.updateUsuario(usuarioId, req.body);
        return updatedUsuario ? res.status(201).json(updatedUsuario) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        Logging.error(error);
        return res.status(500).json({ error });
    }
};


const deleteUsuario = async (req: Request, res: Response, next: NextFunction) => {
    const usuarioId = req.params.usuarioId;

    try {
        const usuario = await UsuarioService.deleteUsuario(usuarioId);
        return usuario ? res.status(201).json(usuario) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    try {
        const usuario = await UsuarioService.getUsuarioByEmail(email);

        if (!usuario) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (usuario.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const payload: AuthTokenPayload = {
            userId: String(usuario._id),
            email: usuario.email,
            role: usuario.role,
            name: usuario.name
        };

        const signOptions: jwt.SignOptions = {
            expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn']
        };

        const token = jwt.sign(payload, config.jwt.secret as jwt.Secret, signOptions);

        return res.status(200).json({
            token,
            user: {
                userId: payload.userId,
                email: payload.email,
                name: payload.name,
                role: payload.role
            }
        });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const profile = async (req: Request, res: Response, next: NextFunction) => {
    const authUser = res.locals.authUser as AuthTokenPayload | undefined;

    if (!authUser) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const usuario = await UsuarioService.getUsuario(authUser.userId);

        if (!usuario) {
            return res.status(404).json({ message: 'not found' });
        }

        return res.status(200).json({
            userId: String(usuario._id),
            email: usuario.email,
            name: usuario.name,
            role: usuario.role,
            organizacion: usuario.organizacion
        });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const admin = async (req: Request, res: Response, next: NextFunction) => {
    const authUser = res.locals.authUser as AuthTokenPayload | undefined;

    return res.status(200).json({
        message: 'Admin access granted',
        user: authUser
    });
};

export default { createUsuario, readUsuario, readAll, updateUsuario, deleteUsuario, login, profile, admin };
