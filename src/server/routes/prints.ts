import express from 'express';
import {
  getPrints,
  getCompletedPrints,
  createPrint,
  updatePrintStatus,
  reorderPrints,
  deletePrint
} from '../controllers/prints.js';

const router = express.Router();

router.get('/', getPrints);
router.get('/completed', getCompletedPrints);
router.post('/', createPrint);
router.patch('/:id/status', updatePrintStatus);
router.patch('/reorder', reorderPrints);
router.delete('/:id', deletePrint);

export default router;