import Client from '../utils/db-config/database';

export type Course = {
  course_id: string;
  course_name: string;
};

export class CoursesModel {
  tableName: string = 'courses';

  async getAllCourses(): Promise<Course[]> {
    try {
      const sql = `SELECT * FROM ${this.tableName}`;

      const conn = await Client.connect();

      const result = await conn.query(sql);

      conn.release();

      return result.rows;
    } catch (err) {
      throw new Error(`Could not fetch courses. Error: ${err}`);
    }
  }

  async getAllCoursesWithQuestionsCount(profId: number): Promise<Course[]> {
    try {
      const sql = `SELECT courses.course_id, course_name, COUNT(bank_questions.id) AS questions_count
      FROM courses LEFT JOIN bank_questions 
      ON bank_questions.course_id = courses.course_id
      AND (bank_questions.is_public = true OR bank_questions.professor_id = $1)
    GROUP BY courses.course_id`;

      const conn = await Client.connect();

      const result = await conn.query(sql, [profId]);

      conn.release();

      return result.rows;
    } catch (err) {
      throw new Error(`Could not fetch courses. Error: ${err}`);
    }
  }

  async getCourse(course_id: string): Promise<Course> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE course_id=($1)`;
      const conn = await Client.connect();
      const result = await conn.query(sql, [course_id]);
      conn.release();

      const course: Course = result.rows[0];
      return course;
    } catch (err) {
      throw new Error(
        `Could not find course with course_id ${course_id}. Error: ${err}`
      );
    }
  }

  async createCourse(course_id: string, course_name: string): Promise<Course> {
    try {
      const sql = `INSERT INTO ${this.tableName} (course_id, course_name) VALUES($1, $2) RETURNING *`;
      const conn = await Client.connect();

      const result = await conn.query(sql, [course_id, course_name]);
      conn.release();

      const course: Course = result.rows[0];

      return course;
    } catch (err) {
      // console.log(err);
      throw new Error(`Could not add new course. Error: ${err}`);
    }
  }

  async updateCourse(course: Course): Promise<Course> {
    try {
      const sql = `UPDATE ${this.tableName} SET course_name=($1) WHERE course_id=($2) RETURNING *`;
      const conn = await Client.connect();
      const result = await conn.query(sql, [
        course.course_name,
        course.course_id,
      ]);
      conn.release();

      const updatedCourse: Course = result.rows[0];
      return updatedCourse;
    } catch (err) {
      throw new Error(`Could not update course. Error: ${err}`);
    }
  }

  async deleteCourse(course_id: string): Promise<void> {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE course_id=($1)`;
      // @ts-ignore
      const conn = await Client.connect();

      const result = await conn.query(sql, [course_id]);
      console.log('c' + result.rowCount);
      conn.release();
    } catch (err) {
      throw new Error(`Could not delete course. Error: ${err}`);
    }
  }
}
