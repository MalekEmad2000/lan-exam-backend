import express, { Request, Response, NextFunction } from 'express';
import { Exam, ExamModel, ExamStatus } from '../../models/exam';
import { StatusCodes } from '../../constants/status_codes';
import { ResponseMessages } from '../../constants/error_messages';
import { StudentAnswerModel, StudentGrade } from '../../models/student_answer';
import ip from 'ip';
import { Constants } from '../../constants/constants';
import fetch from 'node-fetch';
import { ExamLogs, ExamLogsModel } from '../../models/exam_logs';
import HelperFunctions from '../../utils/helper_functions';
import { ExamSectionModel } from '../../models/exam_sections';
import { SectionQuestionModel } from '../../models/section_questions';
import { StudentModel } from '../../models/student';
import fs from 'fs';
import { CoursesModel } from '../../models/courses';

export default class ExamController {
  examModel: ExamModel;
  studentAnswersModel: StudentAnswerModel;
  constructor() {
    this.examModel = new ExamModel();
    this.studentAnswersModel = new StudentAnswerModel();
  }

  async getAllProfessorExams(req: Request, res: Response): Promise<void> {
    try {
      const profId = res.locals.user.id;
      const isAdmin = res.locals.user.is_admin;

      let exams: Exam[];

      exams = await this.examModel.getAllProfessorExams(profId, isAdmin);

      // get current local IP address
      const ipAddress = ip.address();
      // add ip address to exam object
      exams.forEach((exam) => {
        exam.exam_link = `http://${ipAddress}:${Constants.FRONTEND_PORT}?e=${exam.id}`;
      });

      res.json({
        status: ResponseMessages.OK,
        message: ResponseMessages.EXAMS_FETCHED,
        data: exams,
      });
      return;
    } catch (err) {
      const errorMessage = (err as Error)?.message;
      // console.log(errorMessage);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
    }
    // res.send('exams index');
  }

  async getExam(req: Request, res: Response): Promise<void> {
    const exam: Exam = res.locals.exam;
    res.status(StatusCodes.OK).json({
      status: ResponseMessages.OK,
      message: ResponseMessages.EXAMS_FETCHED,
      data: exam,
    });
    return;
  }

  async getExamLogs(req: Request, res: Response): Promise<void> {
    // const examLogs : ExamLogs[] = res.locals.examLogs;
    const examId = parseInt(req.params.exam_id);
    const limit = parseInt(req.query.limit as string);
    if (limit) {
      if (isNaN(limit) || limit < 0) {
        res.status(StatusCodes.BAD_REQUEST).json({
          status: ResponseMessages.BAD_REQUEST,
          message: ResponseMessages.INVALID_LIMIT,
        });
        return;
      }
    }
    try {
      const ExamLogsModeel = new ExamLogsModel();
      const examLogs = await ExamLogsModeel.getExamLogs(examId, limit);
      if (!examLogs) {
        res.status(StatusCodes.NOT_FOUND).json({
          status: ResponseMessages.NOT_FOUND,
          message: ResponseMessages.EXAM_LOGS_NOT_FOUND,
        });
        return;
      }
      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.EXAMS_FETCHED,
        data: examLogs,
      });
      return;
    } catch (err) {
      HelperFunctions.sendInternalServerError(res, err);
      return;
    }
  }

  async addExam(req: Request, res: Response): Promise<void> {
    let exam: Exam = req.body;
    exam.professor_id = res.locals.user.id;
    try {
      exam = await this.examModel.createExam(exam);
      res.json({
        status: ResponseMessages.OK,
        message: ResponseMessages.EXAM_ADDED,
        data: exam,
      });
      return;
    } catch (err) {
      HelperFunctions.sendInternalServerError(res, err);
    }
    return;
  }

  async getExamGrades(req: Request, res: Response): Promise<void> {
    const examId: number = parseInt(req.params.exam_id as string);
    try {
      const grades: StudentGrade[] =
        await this.studentAnswersModel.getAllStudentGrades(examId);
      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.EXAM_GRADES_FETCHED,
        data: grades,
      });
      return;
    } catch (err) {
      const errorMessage = (err as Error)?.message;
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
      return;
    }
  }
  async updateExam(req: Request, res: Response): Promise<void> {
    const examId = res.locals.exam.id as number;
    let reqExam: Exam = req.body;
    reqExam.id = examId;
    try {
      reqExam = await this.examModel.updateExam(reqExam);
      if (!reqExam) {
        res.status(StatusCodes.NOT_FOUND).json({
          status: ResponseMessages.INTERNAL_SERVER_ERROR,
          message: ResponseMessages.EXAM_UPDATE_ERROR,
          data: reqExam,
        });
        return;
      }
      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.EXAM_UPDATED,
        data: reqExam,
      });
      return;
    } catch (err) {
      const errorMessage = (err as Error)?.message;
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
    }
    return;
  }

  async deleteExam(req: Request, res: Response): Promise<void> {
    const examId = res.locals.exam.id as number;
    try {
      const exam = await this.examModel.delete(examId);
      res.status(StatusCodes.NO_CONTENT).json({
        status: ResponseMessages.NO_CONTENT,
        message: ResponseMessages.EXAM_DELETED,
      });
      return;
    } catch (err) {
      const errorMessage = (err as Error)?.message;
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
    }
  }

  async startExam(req: Request, res: Response): Promise<void> {
    try {
      const exam = res.locals.exam;
      if (exam.status === ExamStatus.COMPLETED) {
        res.status(StatusCodes.FORBIDDEN).json({
          status: ResponseMessages.FORBIDDEN,
          message: ResponseMessages.EXAM_COMPLETED,
        });
        return;
      }
      if (exam.status === ExamStatus.ONGOING) {
        res.status(StatusCodes.FORBIDDEN).json({
          status: ResponseMessages.FORBIDDEN,
          message: ResponseMessages.EXAM_ALREADY_STARTED,
        });
        return;
      }

      const updatedExam = await this.examModel.startExam(exam);
      // const ipAddress = ip.address();
      const link = `http://localhost:${Constants.LOCAL_FRONTEND_PORT}/start_exam`;

      const resToStartExam = await fetch(link, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exam_id: exam.id,
        }),
      });
      // const resToStartExamJson = await resToStartExam.json();
      // console.log(resToStartExamJson);

      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.EXAN_STARTED,
        data: updatedExam,
      });
      return;
    } catch (err) {
      // console.log(err);
      const errorMessage = (err as Error)?.message;
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
    }
  }

  async endExam(req: Request, res: Response): Promise<void> {
    try {
      const exam = res.locals.exam;
      if (exam.status === ExamStatus.COMPLETED) {
        res.status(StatusCodes.FORBIDDEN).json({
          status: ResponseMessages.FORBIDDEN,
          message: ResponseMessages.EXAM_COMPLETED,
        });
        return;
      }
      if (exam.status === ExamStatus.NOT_STARTED) {
        res.status(StatusCodes.FORBIDDEN).json({
          status: ResponseMessages.FORBIDDEN,
          message: ResponseMessages.EXAM_NOT_STARTED,
        });
        return;
      }
      const updatedExam = await this.examModel.endExam(exam);
      // send request to Backend of students
      // const ipAddress = ip.address();
      const link = `http://localhost:${Constants.LOCAL_FRONTEND_PORT}/end_exam`;

      const resToEndExam = await fetch(link, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: JSON.stringify({ exam_id: exam.id }),
      });

      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.EXAN_STARTED,
        data: updatedExam,
      });
      return;
    } catch (err) {
      const errorMessage = (err as Error)?.message;
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
    }
  }

  async exportExam(req: Request, res: Response): Promise<void> {
    try {
      const examId = res.locals.exam.id as number;
      const examSectionModel = new ExamSectionModel();
      const sectionQuestionModel = new SectionQuestionModel();
      const studentsModel: StudentModel = new StudentModel();

      const exam: Exam = await this.examModel.getProfessorExam(examId);
      if (!exam) {
        res.status(StatusCodes.NOT_FOUND).json({
          status: ResponseMessages.NOT_FOUND,
          message: ResponseMessages.EXAM_NOT_FOUND,
        });
        return;
      }

      // get exam course details
      exam.course = await new CoursesModel().getCourse(exam.course_id!);

      exam.sections = await examSectionModel.getExamSections(examId);
      for (let i = 0; i < exam.sections.length; i++) {
        exam.sections[i].questions =
          await sectionQuestionModel.getSectionQuestions(
            examId,
            exam.sections[i].section_id!
          );
      }
      // console.log(exam.sections[0]);
      // get students in exam
      const students = await studentsModel.getAllStudentsInExam(examId);
      exam.students = students;

      // get all student answers
      const studentAnswersModel = new StudentAnswerModel();
      const studentAnswers = await studentAnswersModel.getStudensAnswersForExam(examId);
      exam.student_answers = studentAnswers;
      // get exam logs
      const examLogs = await new ExamLogsModel().getExamLogs(examId);
      exam.exam_log = examLogs;
      // console.log(exam);
      // res.setHeader('Content-Disposition', 'attachment; filename=exam_'+examId+'_data'+'.lanexam');
      res.setHeader('Content-Type', 'application/json');

      res.status(StatusCodes.OK).send(JSON.stringify(exam, null, 0));
      return;
    } catch (err) {
      HelperFunctions.sendInternalServerError(res, err);
    }
  }



  async importExam(req: Request, res: Response): Promise<void> {
    try {
      
      const profId = res.locals.user.id;
      
        const exam: Exam = req.body;
        // console.log(exam.course);
        try{
        await this.examModel.importExam(exam , profId);
        res.status(StatusCodes.OK).json({
          status: ResponseMessages.OK,
          message: ResponseMessages.EXAM_IMPORTED,
        });
        return;
        }
        catch (err) {
          HelperFunctions.sendInternalServerError(res, err);

        }
        



    } catch (err) {
      HelperFunctions.sendInternalServerError(res, err);
    }
  }


  async getExamStats(req: Request, res: Response): Promise<void> {
    try{
      const examId = res.locals.exam.id as number;
      const examStats = await this.examModel.getExamStats(examId);
      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.EXAM_STATS_FETCHED,
        data: examStats,
      });
      return;

    }
    catch (err) {
      HelperFunctions.sendInternalServerError(res, err);
  }}
  
}


