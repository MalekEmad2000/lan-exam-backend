import { Request, Response } from 'express';
import { ResponseMessages } from '../../constants/error_messages';
import { StatusCodes } from '../../constants/status_codes';
import { Student, StudentModel } from '../../models/student';
import {
  StudentAnswer,
  StudentAnswerModel,
  StudentGrade,
} from '../../models/student_answer';
export class StudentController {
  studentModel: StudentModel;
  constructor() {
    this.studentModel = new StudentModel();
  }
  async getAllStudentsInExam(req: Request, res: Response) {
    try {
      const examId: number = res.locals.exam.id;
      const students: Student[] = await this.studentModel.getAllStudentsInExam(
        examId
      );
      if (!students) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          status: ResponseMessages.INTERNAL_SERVER_ERROR,
          message: ResponseMessages.STUDENTS_FETCH_FAIL,
        });
      }
      return res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.STUDENTS_FETCHED,
        data: students,
      });
    } catch (err) {
      const errorMessage = (err as Error)?.message;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
    }
  }
  async addStudentsToExam(req: Request, res: Response) {
    try {
      const examId: number = res.locals.exam.id;
      const students = req.body;

      const addedStudents: Student[] =
        await this.studentModel.addStudentsToExam(examId, students);
      if (!addedStudents) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          status: ResponseMessages.INTERNAL_SERVER_ERROR,
          message: ResponseMessages.ADD_STUDENT_FAIL,
        });
      }
      return res.status(StatusCodes.CREATED).json({
        status: ResponseMessages.CREATED,
        message: ResponseMessages.ADD_STUDENT_SUCCESS,
        data: addedStudents,
      });
    } catch (err) {
      const errorMessage = (err as Error)?.message;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
    }
  }

  // get all students answers in exam
  async getAllStudentsAnswers(req: Request, res: Response) {
    try {
      const examId: number = res.locals.exam.id;
      const studentAnswerModel: StudentAnswerModel = new StudentAnswerModel();
      const studentAnswers: StudentGrade[] =
        await studentAnswerModel.getAllStudentsAnswersWithStats(examId);
      if (!studentAnswers) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          status: ResponseMessages.INTERNAL_SERVER_ERROR,
          message: ResponseMessages.STUDENT_ANSWERS_FETCH_FAIL,
        });
      }
      return res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.STUDENT_ANSWERS_FETCHED,
        data: studentAnswers,
      });
    } catch (err) {
      const errorMessage = (err as Error)?.message ?? ResponseMessages.ERROR;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
    }
  }

  // get student answers in exam
  async getStudentAnswers(req: Request, res: Response) {
    try {
      const examId: number = res.locals.exam.id;
      const studentId: string = req.params.student_id;
      const studentAnswerModel: StudentAnswerModel = new StudentAnswerModel();
      const studentAnswers: StudentGrade =
        await studentAnswerModel.getStudentAnswers(examId, studentId);
      if (!studentAnswers) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          status: ResponseMessages.INTERNAL_SERVER_ERROR,
          message: ResponseMessages.STUDENT_ANSWERS_FETCH_FAIL,
        });
      }
      return res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.STUDENT_ANSWERS_FETCHED,
        data: studentAnswers,
      });
    } catch (err) {
      const errorMessage = (err as Error)?.message ?? ResponseMessages.ERROR;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
    }
  }

  async updateStudentInExam(req: Request, res: Response) {
    try {
      const examId: number = res.locals.exam.id;
      const studentId: string = req.params.student_id;
      const student = req.body;
      student.id = studentId;
      const updatedStudent: Student = await this.studentModel.updateStudent(
        student,
        examId
      );
      if (!updatedStudent) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          status: ResponseMessages.INTERNAL_SERVER_ERROR,
          message: ResponseMessages.UPDATE_STUDENT_FAIL,
        });
      }
      return res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.UPDATE_STUDENT_SUCCESS,
        data: updatedStudent,
      });
    } catch (err) {
      const errorMessage = (err as Error)?.message;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
    }
  }

  async deleteStudentFromExam(req: Request, res: Response) {
    try {
      const examId: number = res.locals.exam.id;
      const studentId: string = req.params.student_id;
      const deletedStudent: Student = await this.studentModel.delete(
        studentId,
        examId
      );
      if (!deletedStudent) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: ResponseMessages.NOT_FOUND,
          message: ResponseMessages.DELETE_STUDENT_FAIL,
        });
      }
      return res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.DELETE_STUDENT_SUCCESS,
      });
    } catch (err) {
      const errorMessage = (err as Error)?.message;
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: ResponseMessages.INTERNAL_SERVER_ERROR,
        message: errorMessage,
      });
    }
  }
}
