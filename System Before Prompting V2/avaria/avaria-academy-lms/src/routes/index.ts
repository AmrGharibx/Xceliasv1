import { Router } from 'express';
import { traineeController } from '../controllers/index';

const router = Router();

// Define routes for Trainee management
router.get('/trainees', traineeController.getAllTrainees);
router.post('/trainees', traineeController.createTrainee);
router.get('/trainees/:id', traineeController.getTraineeById);
router.put('/trainees/:id', traineeController.updateTrainee);
router.delete('/trainees/:id', traineeController.deleteTrainee);

// Additional routes can be defined here for Batch, Attendance, and Assessment

export default router;