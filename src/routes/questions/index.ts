import express from 'express';
import { QuestionsValidationMiddleware } from '../../controller/middleware/validations/questions_validation_middleware';
import { QuestionController } from '../../controller/questions/questions_controller';
const routes = express.Router({ mergeParams: true });
const questionController = new QuestionController();

// professor only have acces to his own questions and public questions
routes.get('/', questionController.getAllQuestions.bind(questionController));

// professor can create questions
routes.post(
  '/',
  QuestionsValidationMiddleware.validateQuestionBody,
  questionController.createQuestion.bind(questionController)
);

// validate existance of question_id on all routes below
routes.use(
  '/:question_id',
  QuestionsValidationMiddleware.validateQuestionBankId
);

// professor can see his questions and public questions
routes.get(
  '/:question_id',
  questionController.getQuestion.bind(questionController)
);

// professor can update his own questions only
routes.put(
  '/:question_id',
  QuestionsValidationMiddleware.validateQuestionBody,
  QuestionsValidationMiddleware.checkPrivilege,
  questionController.updateQuestion.bind(questionController)
);
routes.delete(
  '/:question_id',
  QuestionsValidationMiddleware.checkPrivilege,
  questionController.deleteQuestion.bind(questionController)
);

export default routes;
