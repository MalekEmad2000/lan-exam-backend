import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from '../../../constants/status_codes';
import { Course, CoursesModel } from '../../../models/courses';
export class CoursesValidationMiddleware {
  static validateCourseId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const course_id = req.params.course_id;
    const course = await new CoursesModel().getCourse(course_id);
    if (!course) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: StatusCodes.NOT_FOUND,
        message: `Course with id ${course_id} not found`,
      });
    }
    next();
  };

  static validateCourseBody = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const course: Course = req.body;
    if (!course.course_name || course.course_name.trim().length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: `Course name is required`,
      });
    }
    if (!course.course_id || course.course_id.trim().length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: `Course id is required`,
      });
    }

    next();
  };
}
