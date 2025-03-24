import { Request, Response } from 'express';

import { UserModel, User } from '../../models/user';
import { StatusCodes } from '../../constants/status_codes';
import { ResponseMessages } from '../../constants/error_messages';
import HelperFunctions from '../../utils/helper_functions';
import { JWTHelper } from '../../utils/jwt_helper';
import { SuperUserModel } from '../../models/super_user';

export default class ProfessorAuthController {
  userModel: UserModel;
  constructor() {
    this.userModel = new UserModel();
  }

  async adminSignUp(req: Request, res: Response): Promise<void> {
    try {
      const name: string = req.body.name;
      const email: string = req.body.email;
      const password: string = req.body.password;

      const user: User = await this.userModel.create(name, email, password);

      if (!user) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json(
            HelperFunctions.formErrorResponse(
              ResponseMessages.SIGNUP_ERROR,
              StatusCodes.INTERNAL_SERVER_ERROR
            )
          );
        return;
      }

      const adminModel: SuperUserModel = new SuperUserModel();
      const admin = await adminModel.createAdminFromUser(user.id);
      if (admin) {
        user.is_admin = true;
      } else {
        user.is_admin = false;
        // remove user
        await this.userModel.delete(user.id);
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json(
            HelperFunctions.formErrorResponse(
              ResponseMessages.SIGNUP_ERROR,
              StatusCodes.INTERNAL_SERVER_ERROR
            )
          );
        return;
      }

      const token = JWTHelper.sign({ userId: user.id });

      res.json({
        status: ResponseMessages.OK,
        message: ResponseMessages.LOGIN_SUCCESS,
        token: token,
        data: user,
      });
      return;
    } catch (err) {
      // console.log(err);
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(
          HelperFunctions.formErrorResponse(
            ResponseMessages.SIGNUP_ERROR,
            StatusCodes.INTERNAL_SERVER_ERROR
          )
        );
      return;
    }
  }

  async professorLogin(req: Request, res: Response): Promise<void> {
    try {
      const email: string = req.body.email;
      const password: string = req.body.password;
      const user: User = await this.userModel.loginByEmail(email, password);
      if (!user) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json(
            HelperFunctions.formErrorResponse(
              ResponseMessages.LOGIN_UNAUTHORIZED,
              StatusCodes.UNAUTHORIZED
            )
          );
        return;
      }

      const adminModel: SuperUserModel = new SuperUserModel();
      const admin = await adminModel.findById(user.id);
      if (admin) {
        user.is_admin = true;
      } else {
        user.is_admin = false;
      }

      const token = JWTHelper.sign({ userId: user.id });

      res.json({
        status: ResponseMessages.OK,
        message: ResponseMessages.LOGIN_SUCCESS,
        token: token,
        data: user,
      });
      return;
    } catch (err) {
      // console.log(err);
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(
          HelperFunctions.formErrorResponse(
            ResponseMessages.LOGIN_UNAUTHORIZED,
            StatusCodes.UNAUTHORIZED
          )
        );
      return;
    }
  }

  async updateProfessor(req: Request, res: Response) {
    try {
      // console.log(req.body);
      const email = req.body.email as string;
      const id = parseInt(req.params.prof_id);
      const password = req.body.password as string;
      const name = req.body.name as string;
      const isAdmin: boolean = (req.body.is_admin as boolean) || false;

      // console.log(isAdmin);
      const prof: User = await this.userModel.update(email, id, name, password);
      // console.log(prof);
      if (!prof) {
        res.json({
          status: ResponseMessages.NOT_FOUND,
          message: ResponseMessages.NOT_FOUND,
        });
        return;
      }

      // ONLY ADMIN CAN UPDATE ADMIN STATUS
      if (res.locals.user.is_admin == true) {
        if(req.body.is_admin != undefined) {
        if (isAdmin) {
          // If admin is true, add admin
          const adminModel: SuperUserModel = new SuperUserModel();
          const admin = await adminModel.findById(prof.id);
          if (!admin) {
            await adminModel.createAdminFromUser(prof.id);
            prof.is_admin = true;
          }
        } else {
          // console.log("here");
          // If admin is false, remove admin
          const adminModel: SuperUserModel = new SuperUserModel();
          const admin = await adminModel.findById(prof.id);
          // console.log(admin);
          if (admin) {
            await adminModel.delete(prof.id);
          }
          prof.is_admin = false;
        }
      }
      }

      res.json({
        status: ResponseMessages.OK,
        message: ResponseMessages.PROFILE_UPDATED,
        data: prof,
      });
      return;
    } catch (err) {
      const message: string = (err as Error).message ?? ResponseMessages.ERROR;
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(
          HelperFunctions.formErrorResponse(
            ResponseMessages.INTERNAL_SERVER_ERROR,
            StatusCodes.UNAUTHORIZED
          )
        );
      return;
    }
  }

  async createProfessor(req: Request, res: Response) {
    try {
      const email = req.body.email as string;
      const password = req.body.password as string;
      const name = req.body.name as string;
      const isAdmin = (req.body.is_admin as boolean) ?? false;

      const prof: User = await this.userModel.create(name, email, password);
      // console.log(prof);
      if (!prof) {
        res.status(StatusCodes.BAD_REQUEST).json({
          status: ResponseMessages.BAD_REQUEST,
          message: ResponseMessages.PROFESSOR_CREATE_ERROR,
        });
        return;
      }
      if (isAdmin) {
        const adminModel: SuperUserModel = new SuperUserModel();
        const admin = await adminModel.createAdminFromUser(prof.id);
        if (!admin) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: ResponseMessages.INTERNAL_SERVER_ERROR,
            message: ResponseMessages.PROFESSOR_CREATE_ADMIN_ERROR,
          });
        } else {
          prof.is_admin = true;
        }
      }

      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.PROFESSOR_ADDED,
        data: prof,
      });
      return;
    } catch (err) {
      const message: string = (err as Error).message ?? ResponseMessages.ERROR;
      // console.log(message);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(
          HelperFunctions.formErrorResponse(
            message,
            StatusCodes.INTERNAL_SERVER_ERROR
          )
        );
    }
  }

  async deleteProfessor(req: Request, res: Response) {
    try {
      const id: number = parseInt(req.params.prof_id);
      const prof: User = await this.userModel.delete(id);
      // console.log(prof);
      if (!prof) {
        res.status(StatusCodes.NOT_FOUND).json({
          status: ResponseMessages.NOT_FOUND,
          message: ResponseMessages.NOT_FOUND,
        });
        return;
      }
      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.PROFESSOR_DELETED,
        data: prof,
      });
      return;
    } catch (err) {
      const message: string = (err as Error).message ?? ResponseMessages.ERROR;
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(
          HelperFunctions.formErrorResponse(
            ResponseMessages.INTERNAL_SERVER_ERROR,
            StatusCodes.UNAUTHORIZED
          )
        );
    }
  }

  async getAllProfessors(req: Request, res: Response) {
    try {
      const profs: User[] = await this.userModel.getAllUsers();
      // console.log(profs);
      if (!profs) {
        res.status(StatusCodes.NOT_FOUND).json({
          status: ResponseMessages.NOT_FOUND,
          message: ResponseMessages.NOT_FOUND,
        });
        return;
      }
      res.status(StatusCodes.OK).json({
        status: ResponseMessages.OK,
        message: ResponseMessages.PROFESSORS_FETCHED,
        data: profs,
      });
      return;
    } catch (err) {
      const message: string = (err as Error).message ?? ResponseMessages.ERROR;
      // console.log(message);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(
          HelperFunctions.formErrorResponse(
            ResponseMessages.INTERNAL_SERVER_ERROR,
            StatusCodes.INTERNAL_SERVER_ERROR
          )
        );
    }
  }
}
