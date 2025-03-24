import { Request, Response } from 'express';
import { ResponseMessages } from '../../constants/error_messages';
import { StatusCodes } from '../../constants/status_codes';
import { Question } from '../../models/question';
import { QuestionModel } from '../../models/question';
import {
  QuestionChoice,
  QuestionChoiceModel,
} from '../../models/question_choices';

export class QuestionController {
  questionModel: QuestionModel;
  choiceModel: QuestionChoiceModel;
  constructor() {
    this.questionModel = new QuestionModel();
    this.choiceModel = new QuestionChoiceModel();
  }
  async createQuestion(req: Request, res: Response) {
    try {
      const prof_id = res.locals.user.id;
      const question: Question = req.body;
      question.professor_id = prof_id;
      const newQuestion: Question = await this.questionModel.createQuestion(
        question
      );
      newQuestion.choices = [];
      return res.status(StatusCodes.CREATED).json({
        status: ResponseMessages.CREATED,
        message: ResponseMessages.QUESTION_CREATED,
        data: newQuestion,
      });
    } catch (e) {
      const errorMessage = (e as Error).message ?? ResponseMessages.ERROR;
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
    }
  }

  async getQuestion(req: Request, res: Response) {
    try {
      const profId: number = parseInt(res.locals.user.id);
      const questionId: number = parseInt(req.params.questionId);
      let question: Question = res.locals.question;
      if (!question) {
        question = await this.questionModel.getQuestion(questionId, profId);
      }

      return res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.QUESTION_UPDATED,
        data: question,
      });
    } catch (e) {
      const errorMessage = (e as Error).message ?? ResponseMessages.ERROR;
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
      return;
    }
  }

  async updateQuestion(req: Request, res: Response) {
    try {
      const prof_id: number = parseInt(res.locals.user.id);
      const questionId: number = parseInt(req.params.question_id);
      const question: Question = req.body;
      question.id = questionId;
      question.professor_id = prof_id;
      const updatedQuestion: Question = await this.questionModel.updateQuestion(
        question
      );
      
      return res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.QUESTION_UPDATED,
        data: updatedQuestion,
      });
    } catch (e) {
      const errorMessage = (e as Error).message ?? ResponseMessages.ERROR;
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
      return;
    }
  }

  async deleteQuestion(req: Request, res: Response) {
    try {
      const profId: number = parseInt(res.locals.user.id);
      const questionId: number = parseInt(req.params.question_id);

      await this.questionModel.deleteProfessorQuestion(questionId, profId);

      return res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.QUESTION_DELETED,
      });
    } catch (e) {
      const errorMessage = (e as Error).message ?? ResponseMessages.ERROR;
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
      return;
    }
  }
  async getAllQuestions(req: Request, res: Response) {
    try {
      const prof_id = res.locals.user.id;
      const courseId: string = req.query.course_id as string;
      let questions: Question[] = [];
      if (courseId) {
        questions = await this.questionModel.getQuestionsByCourseId(
          prof_id,
          courseId as string
        );
      } else {
        questions = await this.questionModel.getQuestionBank(prof_id);
      }

      // get choices for each question
      for (let i = 0; i < questions.length; i++) {
        const choices: QuestionChoice[] =
          await this.choiceModel.getQuestionChoices(questions[i].id!);
        questions[i].choices = choices;
      }

      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.QUESTION_BANK_FETCHED,
        data: questions,
      });
    } catch (e) {
      const errorMessage = (e as Error).message ?? ResponseMessages.ERROR;
      console.log(errorMessage);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
      return;
    }
  }
}
