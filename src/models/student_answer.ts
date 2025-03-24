import Client from '../utils/db-config/database';
import { ExamSection } from './exam_sections';
import { Question } from './question';

export type StudentAnswer = {
  student_id: string;
  question_id: number;
  exam_id: number;
  student_choice: number;
  question_order: number;
  section_id: number;
  section_order: number;

};

export type StudentGrade = {
  name: string;
  student_id: string;
  exam_id: number;
  total_questions: number;
  score: number;
  number_of_solved_questions: number;
  total_exam_score: number;
  student_answers?: StudentAnswer[];
  sections?: ExamSection[];
  // number_of_absent_students?: number;
};

export class StudentAnswerModel {
  tableName: string = 'student_answers';

  async show_student_exam_answers(
    student_id: number,
    exam_id: number
  ): Promise<StudentAnswer> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE student_id=($1) AND exam_id=($2)`;

      const conn = await Client.connect();
      conn.release();
      const result = await conn.query(sql, [student_id, exam_id]);
      return result.rows[0];
    } catch (err) {
      throw new Error(
        `Could not find student answer for student_id ${student_id} in exam ${exam_id}. Error: ${err}`
      );
    }
  }

  async getAllStudentGrades(
    examId: number,
    studentId?: string
  ): Promise<StudentGrade[]> {
    try {
      const sql = `select 
      students.id AS student_id,students.name,section_questions.exam_id ,COUNT(section_questions.question_id) AS total_questions ,
      COUNT(student_answers.student_choice) AS number_of_solved_questions,
      COALESCE(SUM( CASE WHEN section_question_choices.is_correct THEN section_questions.weight  END) , 0) AS score,
      COALESCE(SUM(section_questions.weight) , 0) AS total_exam_score
      FROM 
          students
          LEFT JOIN section_questions
          on students.exam_id = section_questions.exam_id 
          AND students.exam_id = $1 ${studentId ? `AND students.id = $2` : ''}
          
           LEFT JOIN student_answers
           ON student_answers.question_id = section_questions.question_id
           AND student_answers.section_id = section_questions.section_id
           AND student_answers.student_id = students.id
           AND student_answers.exam_id = section_questions.exam_id
           
           LEFT JOIN section_question_choices
           ON section_question_choices.question_id =  student_answers.question_id
           AND section_question_choices.exam_id = student_answers.exam_id
           AND section_question_choices.section_id = student_answers.section_id
           AND student_answers.student_choice = section_question_choices.choice_id

           WHERE section_questions.exam_id = $1 AND students.exam_id =$1
        GROUP BY section_questions.exam_id ,students.id,students.name
        ORDER BY students.id ASC`;
      const conn = await Client.connect();
      const values = studentId ? [examId, studentId] : [examId];
      const result = await conn.query(sql, values);
      conn.release();

      return result.rows;
    } catch (err) {
      throw new Error(
        `Could not find students grades for exam ${examId}. Error: ${err}`
      );
    }
  }
  async getStudensAnswersForExam(examId: number): Promise<StudentAnswer[]> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE exam_id=($1)`;
      const conn = await Client.connect();
      const answersResult = await conn.query(sql, [examId]);
      conn.release();
      return answersResult.rows;
    } catch (err) {
      throw new Error(
        `Could not find students answers for exam ${examId}. Error: ${err}`
      );
    }
  }

  async getAllStudentsAnswersWithStats(examId: number): Promise<StudentGrade[]> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE exam_id=($1) ORDER BY student_id ASC`;
      const conn = await Client.connect();
      const answersResult = await conn.query(sql, [examId]);
      const gradeStats = await this.getAllStudentGrades(examId);
      conn.release();
      for (let i = 0; i < gradeStats.length; i++) {
        gradeStats[i].student_answers = answersResult.rows.filter(
          (answer: StudentAnswer) =>
            answer.student_id === gradeStats[i].student_id
        );
      }
      return gradeStats;
    } catch (err) {
      throw new Error(
        `Could not find students grades for exam ${examId}. Error: ${err}`
      );
    }
  }
  async getStudentAnswers(
    examId: number,
    studentId: string
  ): Promise<StudentGrade> {
    try {
      // const sql = `SELECT * FROM ${this.tableName} WHERE exam_id=($1) AND student_id=($2)`;
      const sql = `select 
      section_questions.*
  , section_question_choices.*,
      student_answers.student_choice, section_question_choices.choice_id
      ,( CASE WHEN (student_answers.student_choice =section_question_choices.choice_id)  THEN true else false  END)
      AS is_student_choice
        FROM 
            students
            LEFT JOIN section_questions
            on students.exam_id = section_questions.exam_id 
            AND students.exam_id = $1 AND  students.id = $2
            LEFT JOIN section_question_choices
        ON section_question_choices.question_id =  section_questions.question_id
        AND section_question_choices.section_id = section_questions.section_id
        AND section_question_choices.exam_id = section_questions.exam_id

            LEFT JOIN student_answers
             ON student_answers.question_id = section_questions.question_id
             AND student_answers.section_id = section_questions.section_id
             AND student_answers.student_id = students.id
              AND student_answers.exam_id = section_questions.exam_id

             WHERE section_questions.exam_id = $1
          GROUP BY section_questions.exam_id ,students.id,students.name,
      section_questions.question_id , section_questions.section_id,
      section_question_choices.exam_id,section_question_choices.question_id,
      section_question_choices.section_id,
      section_question_choices.choice_text,section_question_choices.choice_id
      ,student_answers.student_choice
      order by section_questions.section_id , section_questions.question_id asc ,section_question_choices.choice_id ;`;
      const conn = await Client.connect();
      const answersResult = await conn.query(sql, [examId, studentId]);
      const gradeStats = await this.getAllStudentGrades(examId, studentId);
      conn.release();
      // gradeStats[0].student_answers = answersResult.rows;
      const questionsResultSet: Set<string> = new Set();
      const questionsResult: Question[] = [];

      for (let i = 0; i < answersResult.rows.length; i++) {
        if (!questionsResultSet.has(answersResult.rows[i].section_id + ' '+ answersResult.rows[i].question_id)) {
          questionsResultSet.add(answersResult.rows[i].section_id + ' '+ answersResult.rows[i].question_id);

          const question: Question = {
            id: answersResult.rows[i].id,
            question_text: answersResult.rows[i].question_text,
            diagram: answersResult.rows[i].diagram,
            professor_id: answersResult.rows[i].professor_id,
            course_id: answersResult.rows[i].course_id,
            difficulty: answersResult.rows[i].difficulty,
            is_public: answersResult.rows[i].is_public,
            weight: answersResult.rows[i].weight,
            choices: answersResult.rows
              .filter((row) => row.question_id === answersResult.rows[i].question_id && row.section_id === answersResult.rows[i].section_id)
              .map((row) => {
                return {
                  choice_id: row.choice_id,
                  choice_text: row.choice_text,
                  is_correct: row.is_correct,
                  is_student_choice: row.is_student_choice,
                };
              }),
          };

          questionsResult.push(question);
        }
      }

      gradeStats[0].student_answers = questionsResult as unknown as StudentAnswer[];

      return gradeStats[0];
    } catch (err) {
      throw new Error(
        `Could not find students grades for exam ${examId}. Error: ${err}`
      );
    }
  }

  async add_student_question_answer(s: StudentAnswer): Promise<StudentAnswer> {
    try {
      const sql = `INSERT INTO ${this.tableName} 
      (student_id, question_id,exam_id, student_choice,question_order,section_id,section_order)
       VALUES($1, $2, $3,$4,$5,$6,$7) RETURNING *`;
      // @ts-ignore
      const conn = await Client.connect();

      const result = await conn.query(sql, [
        s.student_id,
        s.question_id,
        s.exam_id,
        s.student_choice,
        s.question_order,
        s.section_id,
        s.section_order,
      ]);
      conn.release();
      const student_answer = result.rows[0];

      return student_answer;
    } catch (err) {
      throw new Error(
        `Could not add new student answer ${s.student_id} for question ${s.question_id}. Error: ${err}`
      );
    }
  }

  async add_all_student_answers(
    studentAnswers: StudentAnswer[],
    studentId?: string
  ): Promise<boolean> {
    try {
      const sql = `INSERT INTO ${this.tableName} 
      (student_id, question_id,exam_id, student_choice,question_order,section_id,section_order)
       VALUES($1, $2, $3,$4,$5,$6,$7)`;
      // @ts-ignore
      const conn = await Client.connect();
      for (let i = 0; i < studentAnswers.length; i++) {
        const s = studentAnswers[i];
        if (studentId) {
          s.student_id = studentId;
        }
        await conn.query(sql, [
          s.student_id,
          s.question_id,
          s.exam_id,
          s.student_choice,
          s.question_order,
          s.section_id,
          s.section_order,
        ]);
      }
      conn.release();
      return true;
    } catch (err) {
      throw new Error(`Could not add new student answers. Error: ${err}`);
    }
  }

  async delete(
    student_id: number,
    question_id: number,
    exam_id: number
  ): Promise<StudentAnswer> {
    try {
      const sql = `DELETE FROM ${this.tableName}
       WHERE student_id=($1) AND question_id=($2) AND exam_id=($3) RETURNING *`;
      // @ts-ignore
      const conn = await Client.connect();

      const result = await conn.query(sql, [student_id, question_id, exam_id]);

      const student = result.rows[0];

      conn.release();

      return student;
    } catch (err) {
      throw new Error(
        `Could not delete student answer for student ${student_id} adn question ${question_id}. Error: ${err}`
      );
    }
  }
}
