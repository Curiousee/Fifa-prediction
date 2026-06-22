import { Router } from 'express';
import {
  getGeneralComments,
  getMatchComments,
  postComment,
  deleteComment,
} from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/general', getGeneralComments);
router.get('/match/:matchId', getMatchComments);
router.post('/', postComment);
router.delete('/:id', deleteComment);

export default router;
