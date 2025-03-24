import express from 'express';
import { CoursesController } from '../../controller/courses/courses_controller';
import { CoursesValidationMiddleware } from '../../controller/middleware/validations/courses_validation_middleware';
import { ProfessorValidationMiddleware } from '../../controller/middleware/validations/prof_validation_middleware';

const routes = express.Router({ mergeParams: true });
const coursesController = new CoursesController();

// only authenticated professors can access this route

routes.get('/', coursesController.getAllCourses.bind(coursesController));

// only admin can add a course
routes.post(
  '/',
  ProfessorValidationMiddleware.authAdmin,
  CoursesValidationMiddleware.validateCourseBody,
  coursesController.addCourse.bind(coursesController)
);

routes.get(
  '/:course_id',
  CoursesValidationMiddleware.validateCourseId,
  coursesController.getCourse.bind(coursesController)
);

// only admin can update or delete a course
routes.use(
  '/:course_id',
  ProfessorValidationMiddleware.authAdmin,
  CoursesValidationMiddleware.validateCourseId
);

routes.put(
  '/:course_id',
  CoursesValidationMiddleware.validateCourseBody,
  coursesController.updateCourse.bind(coursesController)
);
routes.delete(
  '/:course_id',
  coursesController.deleteCourse.bind(coursesController)
);

export default routes;
