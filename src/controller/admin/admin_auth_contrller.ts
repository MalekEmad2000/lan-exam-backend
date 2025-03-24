import { SuperUser, SuperUserModel } from '../../models/super_user';
import { Request, Response } from 'express';
import HelperFunctions from '../../utils/helper_functions';
import { StatusCodes } from '../../constants/status_codes';
import { ResponseMessages } from '../../constants/error_messages';

export default class AdminAuthController {
  adminModel: SuperUserModel;
  constructor() {
    this.adminModel = new SuperUserModel();
  }

  async adminLogin(req: Request, res: Response): Promise<void> {
    try {
      // const user_name: string = req.body.username;
      const email: string = req.body.email;
      const password: string = req.body.password;

      let admin: SuperUser | null;
      // if (email == null) {
      //   admin = await this.adminModel.loginByUserName(user_name, password);
      // } else {
      admin = await this.adminModel.loginByEmail(email, password);
      // }
      if (admin) {
        res.json({
          status: ResponseMessages.OK,
          message: ResponseMessages.LOGIN_SUCCESS,
          data: admin,
        });
      } else {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json(
            HelperFunctions.formErrorResponse(
              ResponseMessages.LOGIN_UNAUTHORIZED,
              StatusCodes.UNAUTHORIZED
            )
          );
      }
    } catch (err) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json(
          HelperFunctions.formErrorResponse(
            ResponseMessages.LOGIN_UNAUTHORIZED,
            StatusCodes.UNAUTHORIZED
          )
        );
    }
  }
}
