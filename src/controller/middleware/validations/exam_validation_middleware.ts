import { Request, Response, NextFunction } from 'express';
import { DateTime } from 'luxon';
import { ResponseMessages } from '../../../constants/error_messages';
import { StatusCodes } from '../../../constants/status_codes';
import { Exam, ExamModel, ExamStatus } from '../../../models/exam';
import { ExamSectionModel } from '../../../models/exam_sections';
import { QuestionChoice } from '../../../models/question_choices';
import HelperFunctions from '../../../utils/helper_functions';
import { QuestionsValidationMiddleware } from './questions_validation_middleware';
import { Question } from '../../../models/question';

export class ExamValidationMiddleware {
  static async validateExamId(req: Request, res: Response, next: NextFunction) {
    const examId = parseInt(req.params.exam_id);
    const profId = res.locals.user.id;
    const isAdmin = res.locals.user.is_admin;
    if (!HelperFunctions.validateNumber(examId)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: 'Invalid Exam ID',
      });
      return;
    }
    try {
      // check that professor owns the exam or he is an admin
      const exam: Exam = await new ExamModel().getProfessorExam(examId);
      if (!exam) {
        res.status(StatusCodes.NOT_FOUND).json({
          status: ResponseMessages.NOT_FOUND,
          message: ResponseMessages.EXAM_NOT_FOUND,
        });
      } else if (exam.professor_id != profId && !isAdmin) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          status: ResponseMessages.UNAUTHORIZED,
          message: ResponseMessages.UNAUTHORIZED_ACCESS,
        });
      } else {
        res.locals.exam = exam;
        next();
      }
    } catch (error) {
      HelperFunctions.sendInternalServerError(res, error);
    }
  }

  static async authExamDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const examStatus = res.locals.exam.status;

      if (examStatus === ExamStatus.ONGOING) {
        return res.status(StatusCodes.FORBIDDEN).json({
          status: ResponseMessages.FORBIDDEN,
          message: ResponseMessages.FORBIDDEN_EXAMS_STARTED,
        });
      }
    } catch (error) {
      HelperFunctions.sendInternalServerError(res, error);
    }
    next();
  }

  static async authExamEndDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const examStatus = res.locals.exam.status;

      if (examStatus === ExamStatus.ONGOING || examStatus === ExamStatus.COMPLETED) {
        return res.status(StatusCodes.FORBIDDEN).json({
          status: ResponseMessages.FORBIDDEN,
          message: ResponseMessages.FORBIDDEN_EXAMS_STARTED,
        });
      }
    } catch (error) {
      HelperFunctions.sendInternalServerError(res, error);
    }
    next();
  }
  // Middleware to check body of exam
  static async validateExamBody(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const exam: Exam = req.body;
    exam.professor_id = res.locals.user.id;

    if (!ExamValidationMiddleware.validateExam(exam)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.EXAM_BODY_ERROR,
      });
      return;
    }
    if (!ExamValidationMiddleware.validateExamDateTime(exam)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.DATE_TIME_ERROR,
      });
      return;
    }

    if (!exam.course_id) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.COURSE_ID_REQUIRED,
      });
      return;
    }

    next();
  }

  static async validateExamOwner(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const examId = parseInt(req.params.exam_id);
    const profId = res.locals.user.id;
    try {
      const exam: Exam = res.locals.exam;
      if (exam.professor_id != profId) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          status: ResponseMessages.UNAUTHORIZED,
          message: ResponseMessages.UNAUTHORIZED_EXAM_OWNER,
        });
      } else {
        next();
      }
    } catch (error) {
      HelperFunctions.sendInternalServerError(res, error);
    }
  }
  static async validateSectionId(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const sectionId = parseInt(req.params.section_id as string);
      const examId = parseInt(req.params.exam_id as string);
      // const profId = res.locals.user.id;
      if (!HelperFunctions.validateNumber(sectionId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: ResponseMessages.BAD_REQUEST,
          message: ResponseMessages.ID_ERROR,
        });
      }
      if (!(await new ExamSectionModel().findById(examId, sectionId))) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: ResponseMessages.NOT_FOUND,
          message: ResponseMessages.SECTION_NOT_FOUND,
        });
      }
      next();
    } catch (error) {
      HelperFunctions.sendInternalServerError(res, error);
    }
  }

  static async validateSectionBody(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const section_title = req.body.section_title;
    const random_shuffle = req.body.random_shuffle;
    if (!section_title || typeof section_title !== 'string') {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.SECTION_BODY_ERROR,
      });
      return;
    } else if (typeof random_shuffle !== 'boolean') {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.SECTION_BODY_RANDOM_SHUFFLE_ERROR,
      });
      return;
    } else {
      next();
    }
  }

  // validate questions in section
  static async validateSectionQuestion(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const question: Question = req.body;

    if (!HelperFunctions.validateNumber(question.weight)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.QUESTION_WEIGHT_ERROR,
      });
      return;
    }

    if (!QuestionsValidationMiddleware.validateQuestion(question, true)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.QUESTION_BODY_ERROR,
      });
      return;
    }
    // validate all choices in the question
    if (!question.choices || !Array.isArray(question.choices)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.QUESTION_CHOICE_BODY_ERROR,
      });
      return;
    }

    for (let j = 0; j < question.choices.length; j++) {
      const qc: QuestionChoice = question.choices[j];
      if (!ExamValidationMiddleware.validateChoice(qc)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          status: ResponseMessages.BAD_REQUEST,
          message: ResponseMessages.QUESTION_CHOICE_BODY_ERROR,
        });
        return;
      }
    }
    next();
  }

  // validate section question  uodate
  static async validateSectionQuestionUpdate(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const question: Question = req.body;

   if(!question.weight){
    question.weight = 1;
    }

    if (!QuestionsValidationMiddleware.validateQuestion(question , true)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.QUESTION_BODY_ERROR,
      });
      return;
    }
    // validate all choices in the question
    if (!question.choices || !Array.isArray(question.choices)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.QUESTION_CHOICE_BODY_ERROR,
      });
      return;
    }

    for (let j = 0; j < question.choices.length; j++) {
      const qc: QuestionChoice = question.choices[j];
      if (!ExamValidationMiddleware.validateChoice(qc) && !qc.choice_id) {
        res.status(StatusCodes.BAD_REQUEST).json({
          status: ResponseMessages.BAD_REQUEST,
          message: ResponseMessages.QUESTION_CHOICE_BODY_ERROR,
        });
        return;
      }
    }
    next();
  }

  // static async validateImportExam(
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) {
  //   // console.log(req.body);
  //   try{
  //     // check file path in body
  //     const file_path = req.body.file_path;
  //     if (!file_path || typeof file_path !== 'string') {
  //       res.status(StatusCodes.BAD_REQUEST).json({
  //         status: ResponseMessages.BAD_REQUEST,
  //         message: ResponseMessages.FILE_PATH_ERROR,
  //       });
  //       return;
  //     }

  //     // check file extension
  //     const file_extension = file_path.split('.').pop();
  //     if (file_extension !== 'lanexam') {
  //       res.status(StatusCodes.BAD_REQUEST).json({
  //         status: ResponseMessages.BAD_REQUEST,
  //         message: ResponseMessages.FILE_EXTENSION_ERROR,
  //       });
  //       return;
  //     }
  //     next();
  //   } catch (error) {
  //     HelperFunctions.sendInternalServerError(res, error);
  //   }
    
  // }


  //

  /// Helper functions
  private static validateExam(exam: Exam): boolean {
    if (!exam) {
      return false;
    }
    if (!HelperFunctions.validateNumber(exam.professor_id)) {
      return false;
    }
    if (!exam.name) {
      return false;
    }
    if (!exam.start_date) {
      return false;
    }
    if (!exam.start_time) {
      return false;
    }
    if (!exam.end_time) {
      return false;
    }
    if (!exam.min_submit_time) {
      return false;
    }
    if (!exam.exam_instructions) {
      return false;
    }
    if (!exam.exam_password || typeof exam.exam_password !== 'string')
      return false;
    if (!HelperFunctions.validateNumber(exam.max_attempts)) {
      return false;
    }
    return true;
  }

  private static validateExamDateTime(exam: Exam): boolean {
    // exam date must be now or in the future
    const now = DateTime.now();
    const examDate = DateTime.fromISO(exam.start_date + 'T' + exam.start_time);

    const examEndTime = DateTime.fromISO(exam.start_date + 'T' + exam.end_time);
    const examMinSubmitTime = DateTime.fromISO(
      exam.start_date + 'T' + exam.min_submit_time
    );

    if (!examDate.isValid || !examEndTime.isValid || !examMinSubmitTime.isValid)
      return false;

    // exam date must be now or in the future
    if (examDate < now) {
      return false;
    }

    // exam start time must be before exam end time
    if (examDate >= examEndTime) {
      return false;
    }

    // exam min submit time must be before exam end time
    if (examMinSubmitTime > examEndTime || examMinSubmitTime < examDate) {
      return false;
    }

    return true;
  }

  private static validateChoice(choice: QuestionChoice): boolean {
    
    if (
      !choice.choice_text ||
      typeof choice.choice_text !== 'string' ||
      choice.choice_text.trim().length === 0 ||
      choice.is_correct === undefined ||
      typeof choice.is_correct !== 'boolean'
    ) {
      return false;
    }
    return true;
  }
}
