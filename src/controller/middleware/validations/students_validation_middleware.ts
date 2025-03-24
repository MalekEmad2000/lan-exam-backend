import { Request, Response, NextFunction } from 'express';
import { ResponseMessages } from '../../../constants/error_messages';
import { StatusCodes } from '../../../constants/status_codes';
import { Student, StudentModel } from '../../../models/student';
import { ExamModel, ExamStatus } from '../../../models/exam';

export class StudentValidationMiddleware {
  static async validateAddStudentsBody(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const students: Student[] = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: 'Students must be an array greater than zero',
      });
    }
    let error: string = '';
    let isError = false;
    students.forEach((s: Student) => {
      // trim all fields
      s.id = (s.id).toString().trim();
      s.name = (s.name).toString().trim();
      if (!s.id || s.id.length === 0) {
        error = ResponseMessages.STUDENT_ID_ERROR;
        isError = true;
        return;
      }
      if (!s.name || s.name.length === 0) {
        error = ResponseMessages.STUDENT_NAME_ERROR;
        isError = true;
        return;
      }
    });
    if (isError) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: error,
      });
    }
    next();
  }
  static async validateStudentId(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const studentId: string = (req.params.student_id as string).toString().trim();
    const examId: number = parseInt(req.params.exam_id);

    if (!studentId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.STUDENT_ID_ERROR,
      });
    }
    const student: Student = await new StudentModel().findById(
      examId,
      studentId
    );
    // console.log(student);
    if (!student) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.STUDENT_NOT_FOUND_IN_EXAM,
      });
    }

    next();
  }

  static validateStudentUpdateBody(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const student: Student = req.body;

    if (!student.name || student.name.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.STUDENT_NAME_ERROR,
      });
    }
    next();
  }

  static async authDeleteStudentFromExam(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const studentId: string = req.params.student_id;
    const examId: number = parseInt(req.params.exam_id);
    const examStatus = await new ExamModel().getExamStatus(examId);
    if (examStatus !== ExamStatus.NOT_STARTED) {
      return res.status(StatusCodes.FORBIDDEN).json({
        status: ResponseMessages.FORBIDDEN,
        message: ResponseMessages.FORBIDDEN_EXAMS_STARTED,
      });
    }
    next();
  }
}
