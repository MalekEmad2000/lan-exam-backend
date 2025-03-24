// Error messages constants

export const ResponseMessages = {
  // 200
  OK: '200 OK',
  CREATED: 'Created',
  ACCEPTED: 'Accepted',
  NO_CONTENT: 'No Content',
  ERROR: 'An error has occured while processing your request',

  // Error messages
  // 400
  BAD_REQUEST: '400 Bad Request',
  // 401
  UNAUTHORIZED: '401 Unauthorized',
  // 403
  FORBIDDEN: 'Forbidden',
  // 404
  NOT_FOUND: '404 Not Found',
  // 409
  CONFLICT: 'Conflict',
  // 500
  INTERNAL_SERVER_ERROR: '500 Internal Server Error',
  // 503
  SERVICE_UNAVAILABLE: 'Service Unavailable',
  // 504
  GATEWAY_TIMEOUT: 'Gateway Timeout',

  // Custom error messages
  FILE_READ_ERROR: 'An error has occured. Could not read file',
  UNAUTHORIZED_EXAM_OWNER: 'Unauthorized. You are not the owner of this exam (Only the owner can perform this action)',
  SECTION_QUESTION_ADDED_BANK_QUESTION_NOT_ADDED: 'Section question added but an error occured while adding question to question bank',
  FILE_PATH_ERROR: 'An error has occured. File path is invalid',
  FILE_EXTENSION_ERROR: 'An error has occured. File extension is invalid (Only .lanexam files are allowed)',
  SIGNUP_ERROR: 'An error has occured. Could not create account',
  INVALID_EMAIL: 'Wrong email format',
  INVALID_PASSWORD_LENGTH: 'Password must be at least 6 characters long',
  ADMIN_EXISTS:
    'There is an admin in the system. Only admin can create a professor account. Contact admin',
  PROFESSOR_CREATE_ADMIN_ERROR: 'User created but could not be made admin',
  TOKEN_REQUIRED: 'Authorization token is required',
  USER_EXISTS: 'User already exists. Please login',
  UNAUTHORIZED_ACCESS: 'You do not have permission to access this resources.',
  USERNAME_PASSWORD_REQUIRED: 'Username or email and password are required',
  EXAM_NOT_FOUND: 'Exam not found',
  EXAM_ALREADY_SUBMITTED: 'Exam already submitted',
  EXAM_UPDATE_ERROR: 'Exam could not be updated',
  STUDENT_NOT_FOUND: 'Student not found',
  STUDENT_ALREADY_REGISTERED: 'Student already registered',
  STUDENTS_FETCHED: 'Students fetched successfully',
  DELETE_STUDENT_FAIL: 'An error has occured. Could not delete student',
  DELETE_STUDENT_SUCCESS: 'Student deleted successfully',
  UPDATE_STUDENT_FAIL: 'An error has occured. Could not update student',
  UPDATE_STUDENT_SUCCESS: 'Student updated successfully',
  STUDENTS_FETCH_FAIL: 'An error has occured. Could not fetch students',
  LOGIN_UNAUTHORIZED: 'Wrong username or password',
  ID_ERROR: 'Invalid id',
  ID_MISMATCH_ERROR: 'Id in url does not match id in body',
  NO_BODY_ERROR: 'No body',
  DATE_TIME_ERROR: 'Invalid date or time',
  EXAM_BODY_ERROR: 'Invalid exam body.Some fields are missing',
  SECTION_BODY_ERROR:
    'Invalid section entries (Required: section_title, random_shuffle)',
  SECTION_BODY_RANDOM_SHUFFLE_ERROR:
    'Invalid random_shuffle value (must be boolean)',
  SECTION_BODY_QUESTIONS_ERROR: 'Invalid questions value (must be array)',
  SECTION_NOT_FOUND: 'Section not found',
  QUESTION_BODY_ERROR: 'Invalid question body or missing fields',
  QUESTION_WEIGHT_ERROR: 'Question weight must be a number greater than 0',
  QUESTION_CHOICE_BODY_ERROR: 'Invalid question choice body or missing fields',
  SECTION_NOT_ADDED: 'An error occurred while adding new section',
  QUESTION_NOT_ADDED: 'An error occurred while adding new question',
  QUESTION_NOT_FOUND: 'Question not found',
  UNAUTHORIZED_QUESTION_UPDATE:
    'Unauthorized Question Update (You can only update your own questions)',
  CHOICE_NOT_ADDED: 'An error occurred while adding question choices',
  COURSE_NOT_FOUND: 'Course not found',
  COURSE_ID_REQUIRED: 'Course id is required',
  MIN_SUBMISSION_TIME_ERROR:
    'Minimum submission time must be after exam start time and before exam end time',
  ADD_STUDENT_FAIL: 'An error has occured. Could not add students to exam',
  ADD_STUDENT_SUCCESS: 'Students added to the exam suceesfully.',
  STUDENT_ID_ERROR: 'Student ID must be provided for all elements',
  STUDENT_NOT_FOUND_IN_EXAM: 'Student not found in exam',
  STUDENT_NAME_ERROR: 'Student Name must be provided for all elements',
  UPDATE_PROFILE_BODY_ERROR: 'The body of update request must contain name',
  UNAUTHORIZED_PROFILE_UPDATE: 'Unauthorized Profile Update',
  PROFESSOR_CREATE_ERROR:
    'An error has occured. Could not create professor. Email already exists',
  EXAM_COMPLETED: 'Exam has already been completed. You can no longer start it',
  EXAM_ALREADY_STARTED: 'Exam has already been started',
  EXAM_NOT_STARTED: 'Exam has not been started yet',
  FORBIDDEN_EXAMS_STARTED:
    'You cannot delete an exam that has already been started',
  STUDENT_ANSWERS_FETCH_FAIL:
    'An error has occured. Could not fetch student answers',
  INVALID_LIMIT: 'Invalid limit value. Must be a number greater than 0',
  EXAM_LOGS_NOT_FOUND: 'Exam logs not found',
  QUESTION_BANK_IDS_ERROR: 'Invalid question bank ids',
  QUESTION_BANK_WEIGHT_ERROR:
    'Invalid question bank weight (must be number greater than 0)',
    QUESTION_NOT_UPDATED: 'An error occurred while updating question',
  // Custom success messages
  EXAM_SUBMITTED: 'Exam submitted',
  EXAMS_FETCHED: 'Exams fetched successfully',
  LOGIN_SUCCESS: 'Login successful',
  EXAM_ADDED: 'Exam added successfully',
  EXAM_UPDATED: 'Exam updated successfully',
  EXAM_DELETED: 'Exam deleted successfully',
  EXAM_GRADES_FETCHED: 'Exam grades fetched successfully',
  EXAN_STARTED: 'Exam started successfully',
  EXAM_ENDED: 'Exam ended successfully',
  SECTION_ADDED: 'Section added successfully',
  SECTIONS_FETCHED: 'Section fetched successfully',
  SECTION_UPDATED: 'Section updated successfully',
  SECTION_DELETED: 'Section deleted successfully',
  SECTION_QUESTION_DELETED: 'Question deleted from section successfully',
  COURSES_FETCHED: 'Courses fetched successfully',
  COURSE_ADDED: 'Course added successfully',
  COURSE_UPDATED: 'Course updated successfully',
  COURSE_DELETED: 'Course deleted successfully',
  QUESTION_BANK_FETCHED: 'Question bank fetched successfully',
  QUESTION_CREATED: 'Question created successfully',
  QUESTION_UPDATED: 'Question Updated Successfully',
  QUESTION_DELETED: 'Question Deleted Successfully',
  SECTION_QUESTION_ADDED:
    'Question added to section successfully and all section questions fetched',
  PROFILE_UPDATED: 'User profile updated successfully',
  PROFESSORS_FETCHED: 'Professors fetched successfully',
  PROFESSOR_ADDED: 'Professor added successfully',
  PROFESSOR_UPDATED: 'Professor updated successfully',
  PROFESSOR_DELETED: 'Professor deleted successfully',
  STUDENT_ANSWERS_FETCHED: 'Student answers fetched successfully',
  EXAM_IMPORTED: 'Exam imported successfully',
  EXAM_STATS_FETCHED: 'Exam stats fetched successfully',
};
