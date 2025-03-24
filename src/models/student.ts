import Client from '../utils/db-config/database';

export enum StudentStatus {
  NOT_STARTED = 'NOT_STARTED',
  ACTIVE = 'ACTIVE',
  DISCONNECTED = 'DISCONNECTED',
  SUBMITTED_BY_HIMSELF = 'SUBMITTED_BY_HIMSELF',
  SUBMITTED_BY_PROFESSOR = 'SUBMITTED_BY_PROFESSOR',
}
export type Student = {
  id: string;
  exam_id: number;
  name: string;
  national_id?: string;
  email?: string;
  remaining_attempts: number;
  status: StudentStatus;
};

export class StudentModel {
  async index(): Promise<Student[]> {
    try {
      const conn = await Client.connect();
      const sql = 'SELECT * FROM students';

      const result = await conn.query(sql);

      conn.release();

      return result.rows;
    } catch (err) {
      throw new Error(`Could not get students. Error: ${err}`);
    }
  }

  async findById(exmaId: number, studentId: string): Promise<Student> {
    try {
      const sql = `SELECT * FROM students WHERE exam_id=($1) AND id=($2)`;
      const conn = await Client.connect();
      const result = await conn.query(sql, [exmaId, studentId]);
      conn.release();
      const student: Student = result.rows[0];
      return student;
    } catch (err) {
      throw new Error(
        `Could not find student with id ${studentId} in exam ${exmaId}. Error: ${err}`
      );
    }
  }

  async getAllStudentsInExam(examId: number): Promise<Student[]> {
    try {
      const sql = 'SELECT * FROM students WHERE exam_id=($1) ORDER BY id ASC ';

      const conn = await Client.connect();

      const result = await conn.query(sql, [examId]);

      conn.release();

      return result.rows;
    } catch (err) {
      throw new Error(
        `Could not find students in exam ${examId}. Error: ${err}`
      );
    }
  }

  async addStudentsToExam(
    examId: number,
    students: Student[]
  ): Promise<Student[]> {
    try {
      let sql =
        'INSERT INTO students (id,exam_id,name,national_id,email,remaining_attempts,status) VALUES ';
      const attemptsOfExamSql = `SELECT max_attempts FROM exams WHERE id=($1)`;
      const values: any[] = [];
      //  console.log(studenss);
      // @ts-ignore
      const conn = await Client.connect();
      const attemptsOfExam = (await conn.query(attemptsOfExamSql, [examId]))
        .rows[0].max_attempts;
      for (let i = 0; i < students.length; i++) {
        sql += `($${i * 7 + 1},$${i * 7 + 2},$${i * 7 + 3},$${i * 7 + 4},$${
          i * 7 + 5
        },$${i * 7 + 6} , $${i * 7 + 7})`;
        values.push(
          students[i].id,
          examId,
          students[i].name,
          students[i].national_id,
          students[i].email,
          attemptsOfExam,
          StudentStatus.NOT_STARTED
        );
        if (i != students.length - 1) sql += ',';
      }
      sql += ' RETURNING *';
      const result = await conn.query(sql, values);
      conn.release();

      return result.rows;
    } catch (err) {
      // err message
      throw new Error(
        `Could not add new students to exam ${examId}. Error: ${err}`
      );
    }
  }

  async updateStudent(student: Student, examId: number): Promise<Student> {
    try {
      const sql =
        'UPDATE students SET name=($1),national_id=($2),email=($3) WHERE id=($4) AND exam_id=($5) RETURNING *';
      // @ts-ignore
      const conn = await Client.connect();

      const result = await conn.query(sql, [
        student.name,
        student.national_id,
        student.email,
        student.id,
        examId,
      ]);

      const updatedStudent = result.rows[0];

      conn.release();

      return updatedStudent;
    } catch (err) {
      throw new Error(
        `Could not delete student ${student.id} in exam ${examId}. Error: ${err}`
      );
    }
  }

  async delete(id: string, examId: number): Promise<Student> {
    try {
      const sql =
        'DELETE FROM students WHERE id=($1) AND exam_id=($2) RETURNING *';
      // @ts-ignore
      const conn = await Client.connect();

      const result = await conn.query(sql, [id, examId]);

      const student = result.rows[0];

      conn.release();

      return student;
    } catch (err) {
      throw new Error(`Could not delete student ${id}. Error: ${err}`);
    }
  }
}
