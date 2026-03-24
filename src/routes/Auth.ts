import express from 'express';
import usuarioController from '../controllers/Usuario';
import { Schemas, ValidateJoi } from '../middleware/Joi';
import { authorizeRoles, verifyToken } from '../middleware/Auth';

const router = express.Router();

router.post('/login', ValidateJoi(Schemas.usuario.login), usuarioController.login);
router.get('/profile', verifyToken, usuarioController.profile);
router.get('/admin', verifyToken, authorizeRoles('admin'), usuarioController.admin);

export default router;
