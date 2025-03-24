import { DateTime } from 'luxon';
import { ResponseMessages } from '../constants/error_messages';
import { networkInterfaces } from 'os';
import { StatusCodes } from '../constants/status_codes';
import { Response } from 'express';

export default class HelperFunctions {
  // validate string
  static validateString(str: string): boolean {
    if (str == null || str == undefined) {
      return false;
    }
    return true;
  }

  static validateNumber(id): boolean {
    // check if id is a number and is not negative
    if (id == null || id == undefined || id < 0 || isNaN(id)) {
      return false;
    }
    return true;
  }

  static formErrorResponse(errorMessage: string, statusCode?: number) {
    return {
      status: statusCode == null ? ResponseMessages.ERROR : statusCode,
      message: errorMessage,
    };
  }

  static sendInternalServerError(res: Response, error?: Error | unknown) {
    let errorMessage = ResponseMessages.ERROR;
    if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: ResponseMessages.INTERNAL_SERVER_ERROR,
      message: errorMessage,
    });
  }

  // validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = new RegExp(
      '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*$'
    );
    return emailRegex.test(email);
  }

  // convert time to 12 hour format using luxon
  static convertTimeTo12HourFormat(time: string): string {
    const dateTime = DateTime.fromISO(time);
    return dateTime.toFormat('t');
  }

  // get IP address of the current machine
  static getIPAddress(): string {
    const nets = networkInterfaces();
    const results = {};

    for (const name of Object.keys(nets)) {
      // @ts-ignore
      for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
        const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
        if (net.family === familyV4Value && !net.internal) {
          if (!results[name]) {
            results[name] = [];
          }
          results[name].push(net.address);
        }
      }
    }
    console.log(results);
    return results['en0'][0];
  }
}
