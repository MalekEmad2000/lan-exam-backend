import express from 'express';
import { ProfessorValidationMiddleware } from '../../controller/middleware/validations/prof_validation_middleware';
import ProfessorAuthController from '../../controller/professor/professor_auth_controller';

const routes = express.Router();

const profController: ProfessorAuthController = new ProfessorAuthController();

routes.get(
  '/',
  ProfessorValidationMiddleware.authAdmin,
  profController.getAllProfessors.bind(profController)
);
routes.post(
  '/',
  ProfessorValidationMiddleware.authAdmin,
  ProfessorValidationMiddleware.validateCreateProfessorBody,
  profController.createProfessor.bind(profController)
);

routes.put(
  '/:prof_id',
  ProfessorValidationMiddleware.validateUpdateBody,
  profController.updateProfessor.bind(profController)
);

routes.delete(
  '/:prof_id',
  ProfessorValidationMiddleware.authAdmin,
  profController.deleteProfessor.bind(profController)
);

export default routes;
