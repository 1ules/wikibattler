import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getCollection, getCard } from './cards.controller.js';

export const cardsRouter: ExpressRouter = Router();

cardsRouter.get('/', requireAuth, getCollection);
cardsRouter.get('/:id', requireAuth, getCard);
