import express from 'express';
import { ProfessorValidationMiddleware } from '../../controller/middleware/validations/prof_validation_middleware';
import ProfessorAuthController from '../../controller/professor/professor_auth_controller';

const routes = express.Router();

const ProfessorAuth = new ProfessorAuthController();

routes.post(
  '/login',
  ProfessorValidationMiddleware.validateLoginBody,
  ProfessorAuth.professorLogin.bind(ProfessorAuth)
);

routes.post(
  '/signup',
  ProfessorValidationMiddleware.validateSignUpBody,
  ProfessorAuth.adminSignUp.bind(ProfessorAuth)
);
export default routes;
