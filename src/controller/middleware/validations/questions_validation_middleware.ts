import { ResponseMessages } from '../../../constants/error_messages';
import { StatusCodes } from '../../../constants/status_codes';
import { Difficulty, Question, QuestionModel } from '../../../models/question';
import { Request, Response, NextFunction } from 'express';
import { SectionQuestionModel } from '../../../models/section_questions';

export class QuestionsValidationMiddleware {
  static validateQuestionBody(req: Request, res: Response, next: NextFunction) {
    const question: Question = req.body;
    if (!QuestionsValidationMiddleware.validateQuestion(question)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.QUESTION_BODY_ERROR,
      });
      return;
    }
    next();
  }

  static async checkPrivilege(req: Request, res: Response, next: NextFunction) {
    const questionId: number = parseInt(req.params.question_id);
    const profId: number = parseInt(res.locals.user.id);
    const questionModel: QuestionModel = new QuestionModel();
    try {
      const q: Question = await questionModel.findProfessorQuestionById(
        profId,
        questionId
      );
      if (!q) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: ResponseMessages.UNAUTHORIZED,
          message: ResponseMessages.UNAUTHORIZED_QUESTION_UPDATE,
        });
      }

      next();
    } catch (err) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: ResponseMessages.UNAUTHORIZED,
        message: ResponseMessages.UNAUTHORIZED_QUESTION_UPDATE,
      });
    }
  }

  static async validateQuestionWeight(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const weight: number = req.body.weight as number;
    if (!weight || isNaN(weight) || weight <= 0) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.QUESTION_WEIGHT_ERROR,
      });
      return;
    }
    next();
  }

  static async validateQuestionBankId(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const questionId = parseInt(req.params.question_id);
    const profId = res.locals.user.id;
    const questionModel: QuestionModel = new QuestionModel();
    try {
      // validate id
      if (!questionId || isNaN(questionId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: ResponseMessages.BAD_REQUEST,
          message: ResponseMessages.ID_ERROR,
        });
      }

      const q: Question = await questionModel.getQuestion(questionId,profId);
      // console.log(q);
      if (!q) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: ResponseMessages.NOT_FOUND,
          message: ResponseMessages.QUESTION_NOT_FOUND,
        });
      }
      res.locals.question = q;
      next();
    } catch (err) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: ResponseMessages.NOT_FOUND,
        message: ResponseMessages.QUESTION_NOT_FOUND,
      });
    }
  }

  static async validateQuestionBankIds(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    // const questionId = parseInt(req.params.question_id);
    // const profId = res.locals.user.id;
    const questionIdsWeight: { question_id: number; weight: number }[] = req
      .body.questions as { question_id: number; weight: number }[];
    const profId: number = parseInt(res.locals.user.id);
    const questionIds: number[] = [];
    const questionIdWeightMap = new Map<number, number>();
    if (!questionIdsWeight || questionIdsWeight.length === 0) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.QUESTION_BANK_IDS_ERROR,
      });
      return;
    }
    for (let i = 0; i < questionIdsWeight.length; i++) {
      if (
        !questionIdsWeight[i].question_id ||
        isNaN(questionIdsWeight[i].question_id)
      ) {
        // No question id provided
        res.status(StatusCodes.BAD_REQUEST).json({
          status: ResponseMessages.BAD_REQUEST,
          message: ResponseMessages.QUESTION_BANK_IDS_ERROR,
        });
        return;
      }
      if (!questionIdsWeight[i].weight) {
        // If weight is not provided, set it to 1
        questionIdsWeight[i].weight = 1;
      }
      if (
        questionIdsWeight[i].weight <= 0 ||
        isNaN(questionIdsWeight[i].weight)
      ) {
        // Wrong weight provided
        res.status(StatusCodes.BAD_REQUEST).json({
          status: ResponseMessages.BAD_REQUEST,
          message: ResponseMessages.QUESTION_BANK_WEIGHT_ERROR,
        });
        return;
      }
      if (!questionIdWeightMap.has(questionIdsWeight[i].question_id)) {
        questionIds.push(questionIdsWeight[i].question_id);
        questionIdWeightMap.set(
          questionIdsWeight[i].question_id,
          questionIdsWeight[i].weight
        );
      }
    }

    try {
      const questions: Question[] =
        await new QuestionModel().getQuestionsFromBank(
          questionIds,
          profId,
          questionIdWeightMap
        );
      // console.log('question');
      // console.log(question);
      if (!questions || questions.length === 0) {
        res.status(StatusCodes.NOT_FOUND).json({
          status: ResponseMessages.NOT_FOUND,
          message: ResponseMessages.QUESTION_NOT_FOUND,
        });
        return;
      }
      res.locals.questions = questions;
      next();
    } catch (err) {
      console.log(err);
      res.status(StatusCodes.NOT_FOUND).json({
        status: ResponseMessages.NOT_FOUND,
        message: ResponseMessages.QUESTION_NOT_FOUND,
      });
      return;
    }
  }

  static async validateSectionQuestionId(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const questionId = parseInt(req.params.question_id);
    // const profId = res.locals.user.id;
    const examId: number = parseInt(req.params.exam_id);
    const sectionId: number = parseInt(req.params.section_id);
    if (!questionId || isNaN(questionId)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.ID_ERROR,
      });
      return;
    }

    const sectionQuestionModel: SectionQuestionModel =
      new SectionQuestionModel();
    const question: Question = await sectionQuestionModel.getSectionQuestion(
      examId,
      sectionId,
      questionId
    );
    if (!question) {
      res.status(StatusCodes.NOT_FOUND).json({
        status: ResponseMessages.NOT_FOUND,
        message: ResponseMessages.QUESTION_NOT_FOUND,
      });
      return;
    }
    res.locals.question = question;

    next();
  }

  static validateQuestion(
    question: Question,
    isSectionQuestion = false
  ): boolean {
    // console.log(question);
    if (
      question == null ||
      question.question_text == null ||
      !question.question_text.trim() ||
      typeof question.question_text !== 'string' ||
      question.question_text.trim().length === 0 ||
      (isSectionQuestion && !question.weight) ||
      (isSectionQuestion && typeof question.weight !== 'number') ||
      (isSectionQuestion && question.weight! < 0) ||
      !question.choices ||
      !Array.isArray(question.choices) ||
      !question.course_id ||
      typeof question.course_id !== 'string' ||
      question.course_id.trim().length === 0 ||
      !question.difficulty ||
      !Object.values(Difficulty).includes(question.difficulty as Difficulty) ||
      (!isSectionQuestion && question.is_public == null) ||
      (!isSectionQuestion && typeof question.is_public !== 'boolean')
    ) {
      return false;
    }
    return true;
  }
}
