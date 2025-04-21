import { Router } from 'express';
import { getProfile } from '../controllers/profileController';

const router = Router();

// Здесь передаешь обработчик на роут
router.get('/profile/:steamId', getProfile);

export default router;
