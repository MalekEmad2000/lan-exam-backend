import { DateTime } from 'luxon';
import Client from '../utils/db-config/database';
import { Student, StudentStatus } from './student';
import { ExamSection, ExamSectionModel } from './exam_sections';
import { SectionQuestionModel } from './section_questions';
import { ExamLogs } from './exam_logs';
import { StudentAnswer } from './student_answer';
import { Course } from './courses';

export type Exam = {
  id?: number;
  name: string;
  start_date: string;
  start_time: string;
  end_time: string;
  min_submit_time: string;
  max_attempts: number;
  exam_instructions: string;
  professor_id: number;
  course_id: string;
  exam_password: string;
  status: ExamStatus;
  questions_count?: number;
  total_weight?: number;
  exam_link?: string;

  // Used only for exam export
  sections?: ExamSection[];
  students?: Student[];
  exam_log?: ExamLogs[];
  student_answers?: StudentAnswer[];
  course:Course;
};
export type ExamStats = {
  exam_id: number;
  number_of_students: number;
  number_of_submitted_students: number;
  number_of_absent_students: number;
  avg_score: number;
  total_exam_score: number;
  // median_score: number;
  min_score: number;
  max_score: number;
}

export enum ExamStatus {
  NOT_STARTED = 'NOT_STARTED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
}

export class ExamModel {
  tableName: string = 'exams';

  async getAllProfessorExams(
    professorId: number,
    isAdmin: boolean
  ): Promise<Exam[]> {
    try {
      const sql = `SELECT exams.id, exams.name, to_char(exams.start_date, 'DD-MM-YYYY') AS start_date, to_char(exams.start_time, 'HH12:MI PM') AS start_time, to_char(exams.end_time, 'HH12:MI PM') AS end_time, to_char(exams.min_submit_time, 'HH12:MI PM') AS min_submit_time,
       exams.max_attempts, exams.exam_instructions, exams.professor_id, exams.course_id, exams.exam_password, exams.status
       , COUNT(section_questions.question_id)::int AS questions_count ,
      COALESCE(SUM(section_questions.weight) , 0) AS total_weight 
      FROM exams LEFT JOIN section_questions ON exams.id = section_questions.exam_id
     WHERE exams.professor_id=($1) OR ($2)
     GROUP BY exams.id
     ORDER BY exams.status = 'ONGOING' DESC,
     exams.status = 'NOT_STARTED' DESC, 
      exams.status = 'COMPLETED' DESC, exams.id DESC,
      exams.status,
     exams.start_date ASC,
      exams.start_time ASC    
     `;

      const conn = await Client.connect();

      const result = await conn.query(sql, [professorId, isAdmin]);

      conn.release();

      return result.rows;
    } catch (err) {
      throw new Error(
        `Could not find exams for professor ${professorId}. Error: ${err}`
      );
    }
  }
  changeDateFormat(exam: Exam): Exam {
    exam.start_date = DateTime.fromFormat(exam.start_date, 'dd-MM-yyyy')
      .toFormat('yyyy-MM-dd')
      .toString();

    exam.start_time = DateTime.fromFormat(exam.start_time, 'hh:mm a')
      .toFormat('HH:mm')
      .toString();
    exam.end_time = DateTime.fromFormat(exam.end_time, 'hh:mm a')
      .toFormat('HH:mm')
      .toString();
    exam.min_submit_time = DateTime.fromFormat(exam.min_submit_time, 'hh:mm a')
      .toFormat('HH:mm')
      .toString();
    return exam;
  }
  async startExam(exam: Exam): Promise<Exam> {
    try {
      // convert time format from AM/PM to 24 hours format
      exam = this.changeDateFormat(exam);
      const currDate = DateTime.now();
      const startTime = DateTime.fromISO(
        exam.start_date + 'T' + exam.start_time
      );

      const endTime = DateTime.fromISO(exam.start_date + 'T' + exam.end_time);
      const minSubmitTime = DateTime.fromISO(
        exam.start_date + 'T' + exam.min_submit_time
      );
      const duraution = endTime.diff(startTime).as('milliseconds');
      console.log('duration', startTime);
      const newEndTime = currDate.plus(duraution);

      const newMinSubmitTime = currDate.plus(minSubmitTime.diff(startTime));

      const sql = `UPDATE ${this.tableName} SET status=($1) , start_date=($2) , start_time=($3)
      , end_time=($4), min_submit_time=($5) WHERE id=($6) RETURNING exams.id, exams.name, to_char(exams.start_date, 'DD-MM-YYYY') AS start_date, to_char(exams.start_time, 'HH12:MI PM') AS start_time, 
      to_char(exams.end_time, 'HH12:MI PM') AS end_time, to_char(exams.min_submit_time, 'HH12:MI PM') AS min_submit_time,
      exams.max_attempts, exams.exam_instructions, exams.professor_id, exams.course_id, exams.exam_password, exams.status`;
      const conn = await Client.connect();
      const res = await conn.query(sql, [
        ExamStatus.ONGOING,
        currDate.toSQLDate(),
        currDate.toSQLTime(),
        newEndTime.toSQLTime(),
        newMinSubmitTime.toSQLTime(),
        exam.id,
      ]);
      conn.release();
      return res.rows[0];
    } catch (err) {
      throw new Error(`Could not start exam. Error: ${err}`);
    }
  }
  async endExam(exam: Exam): Promise<Exam> {
    try {
      exam = this.changeDateFormat(exam);
      const currDate = DateTime.now();
      const endTime = DateTime.fromISO(exam.start_date + 'T' + exam.end_time);
      const minSubmitTime = DateTime.fromISO(
        exam.start_date + 'T' + exam.min_submit_time
      );
      let values;
      let sql;
      if (minSubmitTime > currDate) {
        sql = `UPDATE ${this.tableName} SET status=($1) , end_time=($2) , min_submit_time=($3) WHERE id=($4) RETURNING *`;
        values = [
          ExamStatus.COMPLETED,
          currDate.toSQLTime(),
          currDate.toSQLTime(),
          exam.id,
        ];
      } else {
        sql = `UPDATE ${this.tableName} SET status=($1) , end_time=($2) WHERE id=($3) RETURNING *`;
        values = [ExamStatus.COMPLETED, currDate.toSQLTime(), exam.id];
      }
      const conn = await Client.connect();
      const res = await conn.query(sql, values);
      // Update students state
      // students who are active and have not submitted the exam
      // will be marked as submitted by professor
      sql = `UPDATE students SET status =$1 
      WHERE exam_id =$2 AND status=$3 `;
      const resStudents = await conn.query(sql, [
        StudentStatus.SUBMITTED_BY_PROFESSOR,
        exam.id,
        StudentStatus.ACTIVE,
      ]);
      conn.release();
      const updatedExam = res.rows[0] as unknown as Exam;
      return updatedExam;
    } catch (err) {
      throw new Error(`Could not end exam. Error: ${err}`);
    }
  }

  async getExamStatus(examId: number): Promise<ExamStatus> {
    try {
      const sql = `SELECT status FROM ${this.tableName} WHERE id=($1)`;
      const conn = await Client.connect();
      const res = await conn.query(sql, [examId]);
      conn.release();
      const examStatus = res.rows[0].status;
      return examStatus;
    } catch (err) {
      throw new Error(`Could noف get exam status.`);
    }
  }

  async getProfessorExam(exam_id: number): Promise<Exam> {
    try {
      const sql = `SELECT exams.id, exams.name, to_char(exams.start_date, 'DD-MM-YYYY') AS start_date, to_char(exams.start_time, 'HH12:MI PM') AS start_time, to_char(exams.end_time, 'HH12:MI PM') AS end_time, to_char(exams.min_submit_time, 'HH12:MI PM') AS min_submit_time,
      exams.max_attempts, exams.exam_instructions, exams.professor_id, exams.course_id, exams.exam_password, exams.status FROM ${this.tableName} WHERE id=($1)`;

      const conn = await Client.connect();
      const result = await conn.query(sql, [exam_id]);
      conn.release();

      const exam: Exam = result.rows[0];
      return exam;
    } catch (err) {
      throw new Error(
        `Could not find professor exam exam_id ${exam_id}. Error: ${err}`
      );
    }
  }

  async createExam(e: Exam): Promise<Exam> {
    try {
      //INSERT INTO exams (name,start_date,start_time,end_time,min_submit_duration,max_attempts) VALUES('asdasd', '2002-01-11', '20:11','20:11',5, 2);
      const sql = `INSERT INTO ${this.tableName}
       (name,start_date,start_time,end_time,min_submit_time,max_attempts,exam_instructions,professor_id,course_id,exam_password) 
       VALUES($1, $2, $3, $4, $5, $6,$7,$8,$9,$10) RETURNING *`;
      // @ts-ignore
      const conn = await Client.connect();

      const result = await conn.query(sql, [
        e.name,
        e.start_date,
        e.start_time,
        e.end_time,
        e.min_submit_time,
        e.max_attempts,
        e.exam_instructions,
        e.professor_id,
        e.course_id,
        e.exam_password,
      ]);

      console.log('result = ' + result);

      const exam = result.rows[0];

      conn.release();

      return exam;
    } catch (err) {
      throw new Error(`Error: ${err}`);
    }
  }

  async updateExam(e: Exam): Promise<Exam> {
    try {
      const sql = `UPDATE ${this.tableName} SET name=($1), 
      start_date=($2), start_time=($3), end_time=($4), 
      min_submit_time=($5), max_attempts=($6), exam_instructions=($7),
       course_id=($8) WHERE id=($9) RETURNING *`;
      const conn = await Client.connect();
      const result = await conn.query(sql, [
        e.name,
        e.start_date,
        e.start_time,
        e.end_time,
        e.min_submit_time,
        e.max_attempts,
        e.exam_instructions,
        e.course_id,
        e.id,
      ]);
      conn.release();
      const exam = result.rows[0];
      // console.log('exam = ' + exam);
      return exam;
    } catch (err) {
      console.log(err);
      throw new Error(`Could not update exam ${e.id}. Error: ${err}`);
    }
  }

  async delete(id: number): Promise<Exam> {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE id=($1) RETURNING *`;
      // @ts-ignore
      const conn = await Client.connect();

      const result = await conn.query(sql, [id]);
      conn.release();
      if (result.rows.length === 0) {
        throw new Error(`Could not find exam ${id}.`);
      } else {
        const exam = result.rows[0];
        return exam;
      }
    } catch (err) {
      throw new Error(`Could not delete exam ${id}. Error: ${err}`);
    }
  }

  async exportExam(examId: number): Promise<Exam> {
    try {
      const examSectionModel = new ExamSectionModel();
      const sectionQuestionModel = new SectionQuestionModel();

      const exam: Exam = await this.getProfessorExam(examId);
      exam.sections = await examSectionModel.getExamSections(examId);
      exam.sections.forEach(async (section) => {
        // section.questions = [];
        section.questions = await sectionQuestionModel.getSectionQuestions(
          examId,
          section.section_id!
        );
      });
      return exam;
    } catch (err) {
      throw new Error(`Could not export exam ${examId}. Error: ${err}`);
    }
  }



  async importExam(exam: Exam , profId:number): Promise<Exam> {
    try{
      // Insert course if not exists
      const courseSQL = `INSERT INTO courses (course_id , course_name)
      VALUES ($1,$2) ON CONFLICT (course_id) DO NOTHING`;

      // query to insert exam and return the serial id
      const examSQL = `INSERT INTO ${this.tableName} 
      (name,start_date,start_time,end_time,min_submit_time,max_attempts,exam_instructions,professor_id,course_id,exam_password,status)
       VALUES($1, $2, $3, $4, $5, $6,$7,$8,$9,$10,$11) RETURNING id`;

       let sectionsSQL = `INSERT INTO exam_sections 
       (exam_id, section_id, section_title, random_shuffle) VALUES `;

       let questionsSQL = `INSERT INTO section_questions (exam_id, 
        section_id,professor_id,weight , question_text, difficulty,question_id,diagram)
        VALUES `;
        let choicesSql = `INSERT INTO section_question_choices 
        (exam_id,choice_id,choice_text, is_correct, question_id,section_id) VALUES `;
        let studentsSql = `INSERT INTO students (exam_id, id,name,email,national_id , remaining_attempts , status) VALUES `;
        let studentsAnswersSql = `INSERT INTO student_answers 
        (exam_id,student_id, question_id, student_choice,question_order,section_id,section_order) VALUES `;
        let examLogsSql = `INSERT INTO exam_logs (exam_id, student_id, ip_addr, user_agent, action, section_id, 
          question_id,time_stamp)  VALUES `;
        let sectionValues:any[] = [];
        let questionValues:any[] = [];
        let choiceValues:any[] = [];
        let studentValues:any[] = [];
        let studentAnswerValues:any[] = [];
        let examLogValues:any[] = [];
        let sectionCounter = 2;
        let questionCounter = 2;
        let choiceCounter = 2;
        // connvert exam start date from dmY to Ymd
        exam.start_date = exam.start_date.split('-').reverse().join('-');
        exam?.sections?.forEach((section,sectionIndex) => {
        if(sectionIndex !==0)
          sectionsSQL+= ',';
        sectionsSQL+=`($1,$${sectionCounter++},$${sectionCounter++},$${sectionCounter++})`;
        sectionValues.push(section.section_id,section.section_title,section.random_shuffle);
        
        // prepare questions sql
        // if(!section.questions) 
        section?.questions?.forEach((question,questionIndex) => {
          if(questionIndex !==0 || sectionIndex !==0)
            questionsSQL+= ',';
          questionsSQL+=`($1, $${questionCounter++},
             $${questionCounter++}, $${questionCounter++},
              $${questionCounter++}, $${questionCounter++}, $${questionCounter++}, decode($${questionCounter++},'base64'))`;
          questionValues.push(section.section_id,profId,question.weight,question.question_text,
            question.difficulty,question.question_id,question.diagram);
         // prepare choices sql
          question?.choices?.forEach((choice,index) => {
            if(index !==0 || sectionIndex !==0 || questionIndex !==0)
              choicesSql+= ',';
            choicesSql+=`( $1 , $${choiceCounter++}, $${choiceCounter++}, $${choiceCounter++},
               $${choiceCounter++}, $${choiceCounter++})`;
            choiceValues.push(choice.choice_id,choice.choice_text,choice.is_correct,question.question_id,section.section_id);
          });
        }
        );
       });
       
       let studentCounter:number = 2;
       // prepare students sql
        exam?.students?.forEach((student,index) => {
          if(index !==0)
            studentsSql+= ',';
          studentsSql+=`($1,$${studentCounter++},$${studentCounter++},$${studentCounter++}
            ,$${studentCounter++},$${studentCounter++},$${studentCounter++})`;

          studentValues.push(student.id,student.name,student.email,student.national_id,student.remaining_attempts,student.status);
        });

        let studentAnswerCounter:number = 2;
        // prepare students answers sql
        exam?.student_answers?.forEach((studentAnswer,index) => {
          if(index !==0)
            studentsAnswersSql+= ',';
          studentsAnswersSql+=`($1, $${studentAnswerCounter++}, $${studentAnswerCounter++}, 
            $${studentAnswerCounter++}, $${studentAnswerCounter++}, $${studentAnswerCounter++}, $${studentAnswerCounter++})`;
          studentAnswerValues.push(studentAnswer.student_id,studentAnswer.question_id,studentAnswer.student_choice,studentAnswer.question_order,studentAnswer.section_id,studentAnswer.section_order);
        });

        let examLogCounter = 2;
        // prepare exam logs sql
        exam?.exam_log?.forEach((examLog,index) => {
          if(index !==0)
            examLogsSql+= ',';
          examLogsSql+=`($1, $${examLogCounter++}, $${examLogCounter++}, $${examLogCounter++},
             $${examLogCounter++}, $${examLogCounter++}, $${examLogCounter++}, $${examLogCounter++})`;
          examLogValues.push(examLog.student_id,examLog.ip_addr,examLog.user_agent,examLog.action,examLog.section_id,
            examLog.question_id,examLog.time_stamp);
        });
        
      // @ts-ignore
      const conn = await Client.connect();
      try{
      await conn.query('BEGIN');
      await conn.query(courseSQL, [exam.course.course_id, exam.course.course_name]);
      const examResult = await conn.query(examSQL, [
        exam.name,
        exam.start_date,
        exam.start_time,
        exam.end_time,
        exam.min_submit_time,
        exam.max_attempts,
        exam.exam_instructions,
        profId,
        exam.course.course_id,
        exam.exam_password,
        exam.status
      ]);
      const examId = examResult.rows[0].id;
      console.log(sectionsSQL);
      if(sectionValues.length > 0)
      await conn.query(sectionsSQL, [examId, ...sectionValues]);
    //  console.log(questionsSQL)
    if(questionValues.length > 0)
      await conn.query(questionsSQL, [examId, ...questionValues]);
      console.log('questionsSQL');
      if(choiceValues.length > 0)
      await conn.query(choicesSql, [examId, ...choiceValues]);
      console.log('choicesSql');
      // add students
      if(studentValues.length > 0)
      await conn.query(studentsSql, [examId, ...studentValues]);
      console.log('studentsSql');
      // add students answers
      console.log(studentsAnswersSql);
      console.log(studentAnswerValues);
      if(studentAnswerValues.length > 0)
      await conn.query(studentsAnswersSql, [examId , ...studentAnswerValues]);
      console.log('studentsAnswersSql');
      // add exam logs
      if(examLogValues.length > 0)
      await conn.query(examLogsSql, [examId, ...examLogValues]);
      console.log('examLogsSql');
      await conn.query('COMMIT');
      conn.release();
      return exam;
    }
    catch(err){
      console.log('ROLLBACK');
      await conn.query('ROLLBACK');
      conn.release();
      throw new Error(`Could not import exam . Error: ${err}`);
    }

    }
    catch(err){
      throw new Error(`Could not import exam . Error: ${err}`);
    }
  }


  async getExamStats(examId:number):Promise<ExamStats>{
    try{
      const examStatssql = `SELECT
      student_answers.student_id,
      COALESCE(
        SUM(
          CASE
            WHEN section_question_choices.is_correct = true
              AND student_answers.student_choice = section_question_choices.choice_id
              AND student_answers.question_id = section_question_choices.question_id
              AND student_answers.section_id = section_question_choices.section_id
            THEN section_questions.weight
            ELSE 0
          END
        ),
        0
      ) AS score
      
    FROM
      section_questions
    LEFT JOIN section_question_choices ON
      section_question_choices.exam_id = section_questions.exam_id
      AND section_question_choices.section_id = section_questions.section_id
      AND section_question_choices.question_id = section_questions.question_id
    LEFT JOIN student_answers ON
      student_answers.exam_id = section_question_choices.exam_id
      AND student_answers.section_id = section_question_choices.section_id
      AND student_answers.question_id = section_question_choices.question_id
    WHERE
      section_questions.exam_id = $1
    GROUP BY
      student_answers.student_id
      HAVING  student_answers.student_id IS NOT NULL;
    `;
        const studentsStastSql = `select 
        COUNT(id)::int
        as number_of_students,
        COUNT(CASE WHEN status = 'SUBMITTED' THEN 1 ELSE NULL END)::int
         as number_of_submitted_students,
        COUNT(CASE WHEN status = 'NOT_STARTED' THEN 1 ELSE NULL END)::int
         as number_of_absent_students
        FROM students
        WHERE exam_id = $1`;
        const totalScoreSql = `select
        SUM(section_questions.weight) as total_score
        FROM section_questions
        WHERE section_questions.exam_id = $1`;
        
          
        const conn = await Client.connect();
        const result = await conn.query(examStatssql,[examId]);
        const studentsStats = await conn.query(studentsStastSql,[examId]);
        const totalScoreResult = await conn.query(totalScoreSql,[examId]);
        conn.release();
        const totalScore = totalScoreResult.rows[0].total_score;
        let sumScore:number = 0;
        let numberOfAnswerdStudents:number = 0;
        let minScore = 10000;
        let maxScore = 0;
        let isMinScoreSet = false;
        for(let row of result.rows){
          sumScore+=row.score;
          numberOfAnswerdStudents++;
          if(row.score > maxScore)
            maxScore = row.score;
          if(row.score < minScore){
            minScore = row.score;
            isMinScoreSet = true;
          }
        }
        
        const examStats:ExamStats = {
          exam_id:examId,
          number_of_students:studentsStats.rows[0].number_of_students,
          number_of_submitted_students:studentsStats.rows[0].number_of_submitted_students,
          number_of_absent_students:studentsStats.rows[0].number_of_absent_students,
          avg_score:numberOfAnswerdStudents > 0 ? sumScore/numberOfAnswerdStudents : 0,
          min_score:isMinScoreSet ? minScore : 0,
          max_score:maxScore,
          total_exam_score:totalScore
          
        };
        // examStats.number_of_students = studentsStats.rows[0].number_of_students;
        // examStats.number_of_submitted_students = studentsStats.rows[0].number_of_submitted_students;
        // examStats.number_of_absent_students = studentsStats.rows[0].number_of_absent_students;


        
        return examStats;

    } catch(err){
      throw new Error(`Could not get exam stats. Error: ${err}`);
    }
  }
}
