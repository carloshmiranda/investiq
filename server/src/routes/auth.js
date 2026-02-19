import { Router } from 'express';

const router = Router();

// Stubs — implemented in items 1.1 and 1.2
router.post('/register', (_req, res) => res.status(501).json({ error: 'Not implemented yet' }));
router.post('/login',    (_req, res) => res.status(501).json({ error: 'Not implemented yet' }));
router.post('/refresh',  (_req, res) => res.status(501).json({ error: 'Not implemented yet' }));
router.post('/logout',   (_req, res) => res.status(501).json({ error: 'Not implemented yet' }));

export default router;
