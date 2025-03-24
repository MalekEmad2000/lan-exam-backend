import express from 'express';
import { StudentValidationMiddleware } from '../../controller/middleware/validations/students_validation_middleware';
import { StudentController } from '../../controller/students/students_controller';

const routes = express.Router({ mergeParams: true });
const studentController = new StudentController();

// get all students in exam
routes.get('/', studentController.getAllStudentsInExam.bind(studentController));
// get student answers in exam

// Add students to exam
routes.post(
  '/',
  StudentValidationMiddleware.validateAddStudentsBody,
  studentController.addStudentsToExam.bind(studentController)
);

// get all students answers in exam
routes.get(
  '/answers',
  studentController.getAllStudentsAnswers.bind(studentController)
);

routes.use('/:student_id', StudentValidationMiddleware.validateStudentId);

// get student answers in exam
routes.get(
  '/:student_id/answers',
  studentController.getStudentAnswers.bind(studentController)
);

// Update student data in exam
routes.put(
  '/:student_id',
  StudentValidationMiddleware.validateStudentUpdateBody,
  studentController.updateStudentInExam.bind(studentController)
);

// delete student from exam
routes.delete(
  '/:student_id',
  StudentValidationMiddleware.authDeleteStudentFromExam,
  studentController.deleteStudentFromExam.bind(studentController)
);

export default routes;
