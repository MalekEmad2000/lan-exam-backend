import express from 'express';
import ProfessorAuthRoutes from './professor-auth/index';
import CoursesApi from './courses/index';
import ExamRoutes from './exams/index';
import QuestionRoutes from './questions/index';
import { ProfessorValidationMiddleware } from '../controller/middleware/validations/prof_validation_middleware';
import ProfessorRoutes from './professor-profiles';

const routes = express.Router();

routes.use('/auth', ProfessorAuthRoutes);

routes.use('/', ProfessorValidationMiddleware.authProfessor);

// only authenticated professors can access the routes below
routes.use('/professors', ProfessorRoutes);

routes.use('/exams', ExamRoutes);
routes.use('/question_bank', QuestionRoutes);

// some routes in courses are only accessible by admin
routes.use('/courses', CoursesApi);

export default routes;
