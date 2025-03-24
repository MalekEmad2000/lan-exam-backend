import { Request, Response, NextFunction } from 'express';
import { ResponseMessages } from '../../../constants/error_messages';
import { StatusCodes } from '../../../constants/status_codes';
import { Exam } from '../../../models/exam';
import { SuperUserModel } from '../../../models/super_user';
import { User, UserModel } from '../../../models/user';
import HelperFunctions from '../../../utils/helper_functions';
import { JWTHelper, JWTObject } from '../../../utils/jwt_helper';
export class ProfessorValidationMiddleware {
  static async validateLoginBody(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.USERNAME_PASSWORD_REQUIRED,
      });
      return;
    } else {
      next();
    }
  }
  static async validateCreateProfessorBody(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.USERNAME_PASSWORD_REQUIRED,
      });
      return;
    } else if (
      name.length === 0 ||
      email.length === 0 ||
      password.length === 0
    ) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.USERNAME_PASSWORD_REQUIRED,
      });
      return;
    } else if (!HelperFunctions.validateEmail(email)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.INVALID_EMAIL,
      });
      return;
    } else if (password.length < 6) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.INVALID_PASSWORD_LENGTH,
      });
      return;
    } else if (await new UserModel().findByEmail(email)) {
      res.status(StatusCodes.CONFLICT).json({
        status: ResponseMessages.CONFLICT,
        message: ResponseMessages.USER_EXISTS,
      });
      return;
    } else {
      next();
    }
  }

  static async validateSignUpBody(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.USERNAME_PASSWORD_REQUIRED,
      });
      return;
    } else if (
      name.length === 0 ||
      email.length === 0 ||
      password.length === 0
    ) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.USERNAME_PASSWORD_REQUIRED,
      });
      return;
    } else if (!HelperFunctions.validateEmail(email)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.INVALID_EMAIL,
      });
      return;
    } else if (password.length < 6) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.INVALID_PASSWORD_LENGTH,
      });
      return;
    } else if (await new UserModel().findByEmail(email)) {
      res.status(StatusCodes.CONFLICT).json({
        status: ResponseMessages.CONFLICT,
        message: ResponseMessages.USER_EXISTS,
      });
      return;
    } else if (await new SuperUserModel().isThereSuperUser()) {
      // if there is a super user in the system,
      // then user can not sign up as a professor
      // Admin must create a professor account for the user
      res.status(StatusCodes.UNAUTHORIZED).json({
        status: ResponseMessages.UNAUTHORIZED,
        message: ResponseMessages.ADMIN_EXISTS,
      });
      return;
    } else {
      next();
    }
  }
  static async authProfessor(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        status: ResponseMessages.UNAUTHORIZED,
        message: ResponseMessages.TOKEN_REQUIRED,
      });
      return;
    }
    try {
      const jwtObj: JWTObject = JWTHelper.verify(token);
      const userModel = new UserModel();
      const professor: User = await userModel.findById(jwtObj.userId);
      if (!professor) {
        res.status(StatusCodes.NOT_FOUND).json({
          status: ResponseMessages.NOT_FOUND,
          message: ResponseMessages.NOT_FOUND,
        });
        return;
      }
      // professor.is_admin = jwtObj.isAdmin;
      res.locals.user = professor;
      next();
    } catch (err) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        status: ResponseMessages.UNAUTHORIZED,
        message: ResponseMessages.UNAUTHORIZED,
      });
      return;
    }
  }

  static async authAdmin(req: Request, res: Response, next: NextFunction) {
    const isAdmin = res.locals.user.is_admin;
    // console.log(admin);
    if (!isAdmin) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        status: ResponseMessages.UNAUTHORIZED,
        message: ResponseMessages.UNAUTHORIZED,
      });
      return;
    }
    next();
  }

  static async validateUpdateBody(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const profId: number = parseInt(req.params.prof_id);
    const profIdJWT: number = parseInt(res.locals.user.id);
    const isAdmin: boolean = res.locals.user.is_admin;
    const name: string = req.body.name;
    const email: string = req.body.email;

    // professor can only update his own profile or admin can update any professor profile
    if (
      !profId ||
      typeof profId !== 'number' ||
      (profId !== profIdJWT && !isAdmin)
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.UNAUTHORIZED_PROFILE_UPDATE,
      });
    }

    if (!name || !email) {
      // console.log('ssss');
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: ResponseMessages.BAD_REQUEST,
        message: ResponseMessages.UPDATE_PROFILE_BODY_ERROR,
      });
    }
    // console.log('ssss');
    next();
  }
}
