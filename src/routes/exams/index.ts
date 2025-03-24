import express from 'express';
import ExamController from '../../controller/exams/exams_controller';
import { ExamValidationMiddleware } from '../../controller/middleware/validations/exam_validation_middleware';
import ExamSectionsApi from './sections/exam_sections';
import StudentsRoutes from '../students/index';

const routes = express.Router({ mergeParams: true });
const examController = new ExamController();

routes.get('/', examController.getAllProfessorExams.bind(examController));
// Add Exam to list of professor's exams
routes.post(
  '/',
  ExamValidationMiddleware.validateExamBody,
  examController.addExam.bind(examController)
);

// import exam
routes.post('/import', 
// ExamValidationMiddleware.validateImportExam,
examController.importExam.bind(examController));

// check if professor owns exam or he is admin
routes.use('/:exam_id', ExamValidationMiddleware.validateExamId);
// get exam by id
routes.get('/:exam_id', examController.getExam.bind(examController));

// exam stats
routes.get('/:exam_id/stats', examController.getExamStats.bind(examController));


// get exam logs
routes.get('/:exam_id/logs', examController.getExamLogs.bind(examController));

// export exam
routes.get('/:exam_id/export', examController.exportExam.bind(examController));

// update exam
routes.put(
  '/:exam_id',
  ExamValidationMiddleware.authExamEndDelete,
  ExamValidationMiddleware.validateExamBody,
  examController.updateExam.bind(examController)
);
// Delete exam
routes.delete(
  '/:exam_id',
  ExamValidationMiddleware.authExamDelete,
  examController.deleteExam.bind(examController)
);

// start exam
routes.put('/:exam_id/start', examController.startExam.bind(examController));
// end exam
routes.put('/:exam_id/end', examController.endExam.bind(examController));

// get students grades
routes.get(
  '/:exam_id/grades',
  examController.getExamGrades.bind(examController)
);

routes.use('/:exam_id/sections', ExamSectionsApi);

// students in exam routes
routes.use('/:exam_id/students', StudentsRoutes);

export default routes;
