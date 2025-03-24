import express from 'express';
import { ExamValidationMiddleware } from '../../../controller/middleware/validations/exam_validation_middleware';
import ExamSectionsController from '../../../controller/exams/exams_sections_controller';
import { QuestionsValidationMiddleware } from '../../../controller/middleware/validations/questions_validation_middleware';

const routes = express.Router({ mergeParams: true });
const sectionController = new ExamSectionsController();

routes.get('/', sectionController.getAllExamSections.bind(sectionController));

// create new section
routes.post(
  '/',
  ExamValidationMiddleware.validateExamOwner,
  ExamValidationMiddleware.authExamEndDelete,
  ExamValidationMiddleware.validateSectionBody,
  sectionController.addExamSection.bind(sectionController)
);

routes.use('/:section_id', ExamValidationMiddleware.validateSectionId);
// add questions to section
routes.post(
  '/:section_id',
  ExamValidationMiddleware.validateExamOwner,
  ExamValidationMiddleware.authExamEndDelete,
  ExamValidationMiddleware.validateSectionQuestion,
  sectionController.addQuestionToSection.bind(sectionController)
);
// add questions from question bank to section
routes.post(
  '/:section_id/add_from_bank',
  ExamValidationMiddleware.validateExamOwner,
  ExamValidationMiddleware.authExamEndDelete,
  QuestionsValidationMiddleware.validateQuestionBankIds,
  sectionController.addQuestionFromBankToSection.bind(sectionController)
);

routes.get(
  '/:section_id',
  sectionController.getExamSection.bind(sectionController)
);
routes.delete(
  '/:section_id',
  ExamValidationMiddleware.authExamEndDelete,
  sectionController.deleteExamSection.bind(sectionController)
);
routes.put(
  '/:section_id',
  ExamValidationMiddleware.validateExamOwner,
  ExamValidationMiddleware.authExamEndDelete,
  ExamValidationMiddleware.validateSectionBody,
  sectionController.updateExamSection.bind(sectionController)
);

// Section Questions
// validate question id
routes.use(
  '/:section_id/:question_id',
  QuestionsValidationMiddleware.validateSectionQuestionId
);
// Delete question from section
routes.delete(
  '/:section_id/:question_id',
  ExamValidationMiddleware.validateExamOwner,
  ExamValidationMiddleware.authExamEndDelete,
  sectionController.deleteSectionQuestion.bind(sectionController)
);

// update question in section
routes.put(
  '/:section_id/:question_id',
  ExamValidationMiddleware.validateExamOwner,
  ExamValidationMiddleware.authExamEndDelete,
  ExamValidationMiddleware.validateSectionQuestionUpdate,
  sectionController.updateSectionQuestion.bind(sectionController)
);
export default routes;
