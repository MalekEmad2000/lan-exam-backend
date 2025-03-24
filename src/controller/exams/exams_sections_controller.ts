import { Request, Response } from 'express';
import { Exam, ExamModel } from '../../models/exam';
import { Difficulty, Question, QuestionModel } from '../../models/question';
import {
  QuestionChoice,
  QuestionChoiceModel,
} from '../../models/question_choices';
import { StatusCodes } from '../../constants/status_codes';
import { ResponseMessages } from '../../constants/error_messages';
import { ExamSection, ExamSectionModel } from '../../models/exam_sections';
import { SectionQuestionModel } from '../../models/section_questions';
import HelperFunctions from '../../utils/helper_functions';

export default class ExamSectionsController {
  examSectionModel: ExamSectionModel;
  questionModel: QuestionModel;
  questionChoiceModel: QuestionChoiceModel;
  sectionQuestionModel: SectionQuestionModel;
  constructor() {
    this.examSectionModel = new ExamSectionModel();
    this.questionModel = new QuestionModel();
    this.questionChoiceModel = new QuestionChoiceModel();
    this.sectionQuestionModel = new SectionQuestionModel();
  }

  async getExamSection(req: Request, res: Response): Promise<void> {
    try {
      // const profId = res.locals.user.id;
      const examId = parseInt(req.params.exam_id);
      const sectionId = parseInt(req.params.section_id);
      const section: ExamSection =
        await this.examSectionModel.getExamSectionQuestions(examId, sectionId);
      if (!section) {
        res.status(StatusCodes.NOT_FOUND).json({
          status: ResponseMessages.NOT_FOUND,
          message: ResponseMessages.SECTION_NOT_FOUND,
        });
        return;
      }
      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.SECTIONS_FETCHED,
        data: section,
      });
      return;
    } catch (e) {
      const errorMessage =
        (e as Error).message ?? ResponseMessages.INTERNAL_SERVER_ERROR;
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
    }
  }

  async getAllExamSections(req: Request, res: Response): Promise<void> {
    try {
      const prof_id = res.locals.user.id;
      const exam_id = parseInt(req.params.exam_id);
      // get all exam sections
      let sections: ExamSection[] =
        await this.examSectionModel.getAllExamSections(exam_id);

      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.SECTIONS_FETCHED,
        data: sections,
      });
      return;
    } catch (e) {
      const errorMessage =
        (e as Error).message ?? ResponseMessages.INTERNAL_SERVER_ERROR;
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
    }
  }

  async addExamSection(req: Request, res: Response): Promise<void> {
    try {
      const prof_id = res.locals.user.id;
      const exam_id = parseInt(req.params.exam_id);
      const section_title: string = req.body.section_title;
      const random_shuffle: boolean = req.body.random_shuffle;

      // create section in exam
      const section: ExamSection =
        await this.examSectionModel.createExamSection(
          exam_id,
          section_title,
          random_shuffle
        );

      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.SECTION_ADDED,
        data: section,
      });
      return;
    } catch (e) {
      const errorMessage = (e as Error).message ?? ResponseMessages.ERROR;
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
      return;
    }
  }

  async addQuestionToSection(req: Request, res: Response): Promise<void> {
    try {
      const profId = res.locals.user.id;
      const examId = parseInt(req.params.exam_id);
      const sectionId = parseInt(req.params.section_id);
      const question: Question = req.body;
      question.professor_id = profId;
      const questionOutput: Question =
        await this.sectionQuestionModel.addQuestionToSection(
          profId,
          examId,
          sectionId,
          question
        );
      if (!questionOutput) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          status: ResponseMessages.INTERNAL_SERVER_ERROR,
          message: ResponseMessages.QUESTION_NOT_ADDED,
        });
        return;
      }

      // add question to bank
      const bankQuestion: Question = await this.questionModel.createQuestion(question);
      if (!bankQuestion) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          status: ResponseMessages.INTERNAL_SERVER_ERROR,
          message: ResponseMessages.SECTION_QUESTION_ADDED_BANK_QUESTION_NOT_ADDED,
        });
        return;
      }
    

      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.SECTION_QUESTION_ADDED,
        data: questionOutput,
      });

      return;
    } catch (e) {
      const errorMessage = (e as Error).message ?? ResponseMessages.ERROR;
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
      return;
    }
  }

  async addQuestionFromBankToSection(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const profId = res.locals.user.id;
      const examId = parseInt(req.params.exam_id);
      const sectionId = parseInt(req.params.section_id);
      const questions: Question[] = res.locals.questions;
      // const weight = req.body.weight as number;
      // question.weight = weight;

      // ADD QUESTION TO SECTION
      const isAdded: boolean =
        await this.sectionQuestionModel.addQuestionsToSection(
          profId,
          examId,
          sectionId,
          questions
        );
      if (!isAdded) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          status: ResponseMessages.INTERNAL_SERVER_ERROR,
          message: ResponseMessages.QUESTION_NOT_ADDED,
        });
        return;
      }
      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.SECTION_QUESTION_ADDED,
        // data: questionOutput,
      });
      return;
    } catch (e) {
      const errorMessage = (e as Error).message ?? ResponseMessages.ERROR;
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
      return;
    }
  }

  async updateExamSection(req: Request, res: Response): Promise<void> {
    try {
      const prof_id = res.locals.user.id;
      const exam_id = parseInt(req.params.exam_id);
      const section_id = parseInt(req.params.section_id);
      const section_title: string = req.body.section_title;
      const random_shuffle: boolean = req.body.random_shuffle;
      const section: ExamSection =
        await this.examSectionModel.updateExamSection(
          exam_id,
          section_id,
          section_title,
          random_shuffle
        );
      if (!section) {
        res.status(StatusCodes.NOT_FOUND).json({
          status: ResponseMessages.NOT_FOUND,
          message: ResponseMessages.SECTION_NOT_FOUND,
        });
        return;
      }
      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.SECTION_UPDATED,
        data: section,
      });
      return;
    } catch (e) {
      const errorMessage =
        (e as Error).message ?? ResponseMessages.INTERNAL_SERVER_ERROR;
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
    }
  }

  async deleteExamSection(req: Request, res: Response): Promise<void> {
    try {
      const prof_id = res.locals.user.id;
      const exam_id = parseInt(req.params.exam_id);
      const section_id = parseInt(req.params.section_id);
      const section: ExamSection =
        await this.examSectionModel.deleteExamSection(exam_id, section_id);
      if (!section) {
        res.status(StatusCodes.NOT_FOUND).json({
          status: ResponseMessages.NOT_FOUND,
          message: ResponseMessages.SECTION_NOT_FOUND,
        });
        return;
      }
      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.SECTION_DELETED,
      });
      return;
    } catch (e) {
      const errorMessage =
        (e as Error).message ?? ResponseMessages.INTERNAL_SERVER_ERROR;
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
    }
  }

  async updateSectionQuestion(req: Request, res: Response): Promise<void> {
    try {
      const questionId: number = parseInt(req.params.question_id);
      const sectionId: number = parseInt(req.params.section_id);
      const examId: number = parseInt(req.params.exam_id);
      const question: Question = req.body;
      
        await this.sectionQuestionModel.updateSectionQuestion(
          examId,
          sectionId,
          questionId,
          question
        );
      
      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.QUESTION_UPDATED,
        // data: questionOutput,
      });
      return;
    } catch (err) {
      
      HelperFunctions.sendInternalServerError(res, err);
    }
  }

  async deleteSectionQuestion(req: Request, res: Response): Promise<void> {
    try {
      const questionId: number = parseInt(req.params.question_id);
      const sectionId: number = parseInt(req.params.section_id);
      const examId: number = parseInt(req.params.exam_id);
      await this.sectionQuestionModel.deleteSectionQuestion(
        examId,
        sectionId,
        questionId
      );
      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.SECTION_QUESTION_DELETED,
      });
      return;
    } catch (err) {
      HelperFunctions.sendInternalServerError(res, err);
    }
  }
}
