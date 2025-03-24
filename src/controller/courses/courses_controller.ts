import { Course, CoursesModel } from '../../models/courses';
import { Request, Response } from 'express';
import { StatusCodes } from '../../constants/status_codes';
import { ResponseMessages } from '../../constants/error_messages';

export class CoursesController {
  coursesModel: CoursesModel;
  constructor() {
    this.coursesModel = new CoursesModel();
  }

  async getAllCourses(req: Request, res: Response): Promise<void> {
    try {
      const profId: number = res.locals.user.id;
      const showQuestionCount: boolean =
        req.query.show_questions_count === 'true';
      let courses: Course[];
      if (showQuestionCount) {
        courses = await this.coursesModel.getAllCoursesWithQuestionsCount(
          profId
        );
      } else {
        courses = await this.coursesModel.getAllCourses();
      }
      if (!courses) {
        res.status(StatusCodes.NOT_FOUND).json({
          status: ResponseMessages.NOT_FOUND,
          message: ResponseMessages.NOT_FOUND,
        });
        return;
      }
      res.json({
        status: ResponseMessages.OK,
        message: ResponseMessages.COURSES_FETCHED,
        data: courses,
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
  }

  async getCourse(req: Request, res: Response): Promise<void> {
    const course_id: string = req.params.course_id as string;
    try {
      const course: Course = await this.coursesModel.getCourse(course_id);
      if (!course) {
        res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: course_id + ResponseMessages.COURSE_NOT_FOUND,
        });
        return;
      } else {
        res.status(StatusCodes.OK).json({
          status: ResponseMessages.OK,
          message: ResponseMessages.COURSES_FETCHED,
          data: course,
        });
      }
      return;
    } catch (err) {
      const errorMessage = (err as Error)?.message;
      console.log(errorMessage);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ status: ResponseMessages.ERROR, message: errorMessage });
    }
  }

  async addCourse(req: Request, res: Response): Promise<void> {
    const course: Course = req.body;
    try {
      const newCourse: Course = await this.coursesModel.createCourse(
        course.course_id,
        course.course_name
      );
      res.status(StatusCodes.CREATED).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.COURSE_ADDED,
        data: newCourse,
      });
      return;
    } catch (err) {
      const errorMessage = (err as Error)?.message;
      // console.log(errorMessage);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ status: ResponseMessages.ERROR, message: errorMessage });
    }
  }

  async updateCourse(req: Request, res: Response): Promise<void> {
    const course_id: string = req.params.course_id as string;
    const course: Course = req.body;
    course.course_id = course_id;
    try {
      const updatedCourse: Course = await this.coursesModel.updateCourse(
        course
      );
      if (!updatedCourse) {
        res.status(StatusCodes.NOT_FOUND).json({
          status: StatusCodes.NOT_FOUND,
          message: ResponseMessages.COURSE_NOT_FOUND,
        });
        return;
      }
      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.COURSE_UPDATED,
        data: updatedCourse,
      });
      return;
    } catch (err) {
      const errorMessage = (err as Error)?.message;
      // console.log(errorMessage);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ status: ResponseMessages.ERROR, message: errorMessage });
    }
  }

  async deleteCourse(req: Request, res: Response): Promise<void> {
    const course_id: string = req.params.course_id as string;
    try {
      const deletedCourse = await this.coursesModel.deleteCourse(course_id);
      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.COURSE_DELETED,
        data: deletedCourse,
      });
      return;
    } catch (err) {
      const errorMessage = (err as Error)?.message;
      // console.log(errorMessage);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ status: ResponseMessages.ERROR, message: errorMessage });
      return;
    }
  }
}
