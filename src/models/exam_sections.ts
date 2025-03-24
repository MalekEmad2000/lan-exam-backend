import Client from '../utils/db-config/database';
import { Question } from './question';

export type ExamSection = {
  exam_id: number;
  section_id?: number;
  section_title: string;
  random_shuffle: boolean;
  questions_count?: number;
  total_weight?: number;
  questions?: Question[];
};

export class ExamSectionModel {
  tableName: string = 'exam_sections';
  async findById(examId: number, sectionId: number): Promise<ExamSection> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE section_id=($1) and exam_id=($2)`;
      const conn = await Client.connect();
      const result = await conn.query(sql, [sectionId, examId]);
      conn.release();
      const section: ExamSection = result.rows[0];
      return section;
    } catch (err) {
      throw new Error(
        `Could not find exam section ${sectionId}. Error: ${err}`
      );
    }
  }

  async getExamSectionQuestions(
    examId: number,
    sectionId: number
  ): Promise<ExamSection> {
    try {
      const sql = `SELECT exam_sections.exam_id, exam_sections.section_id, exam_sections.section_title, exam_sections.random_shuffle,
       section_questions.question_id, section_questions.question_text,
        encode(section_questions.diagram::bytea, 'base64') as diagram,
        section_questions.weight,
        section_questions.professor_id,
       section_questions.difficulty,
       choices.choice_id, choices.choice_text, choices.is_correct 
       FROM exam_sections INNER JOIN section_questions 
       ON exam_sections.section_id = section_questions.section_id AND exam_sections.exam_id = section_questions.exam_id
        LEFT JOIN section_question_choices AS choices 
        ON section_questions.question_id = choices.question_id
        AND section_questions.section_id = choices.section_id
        AND section_questions.exam_id = choices.exam_id
        WHERE exam_sections.exam_id=($1) AND exam_sections.section_id=($2)

        ORDER BY section_questions.question_id ASC, choices.choice_id ASC
        `;
      const conn = await Client.connect();
      const res = await conn.query(sql, [examId, sectionId]);
      conn.release();
      // if no questions in section return empty object
      if (res.rowCount === 0) return {} as ExamSection;

      const idSet = new Set();
      const questions: Question[] = [];
      for (let i = 0; i < res.rows.length; i++) {
        if (idSet.has(res.rows[i].question_id)) continue;
        idSet.add(res.rows[i].question_id);
        questions.push({
          question_id: res.rows[i].question_id,
          question_text: res.rows[i].question_text,
          diagram: res.rows[i].diagram,
          weight: res.rows[i].weight,
          course_id: res.rows[i].course_id,
          difficulty: res.rows[i].difficulty,
          is_public: res.rows[i].is_public,
          choices: res.rows
            .filter((r) => r.question_id === res.rows[i].question_id)
            .map((r) => {
              return {
                choice_id: r.choice_id,
                choice_text: r.choice_text,
                is_correct: r.is_correct,
              };
            }),
        });
      }
      const section: ExamSection = {
        exam_id: res.rows[0].exam_id,
        section_id: res.rows[0].section_id,
        section_title: res.rows[0].section_title,
        random_shuffle: res.rows[0].random_shuffle,
        questions: questions,
      };

      return section;
    } catch (err) {
      throw new Error(
        `Could not find exam section questions in exam_id ${examId} and section_id ${sectionId}. Error: ${err}`
      );
    }
  }

  async getAllExamSections(examId: number): Promise<ExamSection[]> {
    try {
      const sql = `SELECT exam_sections.*,
      COUNT(section_questions.question_id)::int AS questions_count,
      COALESCE(SUM(section_questions.weight) , 0) AS total_weight
      FROM exam_sections
       LEFT JOIN section_questions ON 
        exam_sections.exam_id = section_questions.exam_id
         AND
      exam_sections.section_id = section_questions.section_id
      WHERE exam_sections.exam_id=$1
      GROUP BY exam_sections.exam_id,exam_sections.section_id
      ORDER BY exam_sections.section_id  ;`;

      const conn = await Client.connect();

      const result = await conn.query(sql, [examId]);

      conn.release();

      return result.rows;
    } catch (err) {
      throw new Error(
        `Could not find exam sections in exam_id ${examId}. Error: ${err}`
      );
    }
  }

  async getExamSections(examId: number): Promise<ExamSection[]> {
    try {
      const sql = `SELECT exam_sections.*
      FROM exam_sections  WHERE exam_sections.exam_id=$1;`;

      const conn = await Client.connect();

      const result = await conn.query(sql, [examId]);

      conn.release();

      return result.rows;
    } catch (err) {
      throw new Error(
        `Could not find exam sections in exam_id ${examId}. Error: ${err}`
      );
    }
  }

  async createExamSection(
    exam_id: number,
    section_title: string,
    random_shuffle: boolean
  ): Promise<ExamSection> {
    try {
      const sql = `INSERT INTO ${this.tableName} 
      (exam_id, section_title, random_shuffle) VALUES($1, $2, $3) RETURNING *`;
      const conn = await Client.connect();

      const result = await conn.query(sql, [
        exam_id,
        section_title,
        random_shuffle,
      ]);
      conn.release();

      const section: ExamSection = result.rows[0];

      return section;
    } catch (err) {
      // console.log(err);
      throw new Error(
        `Could not add new section in exam_id ${exam_id}. Error: ${err}`
      );
    }
  }

  async updateExamSection(
    exam_id: number,
    section_id: number,
    section_title: string,
    random_shuffle: boolean
  ): Promise<ExamSection> {
    try {
      const sql = `UPDATE ${this.tableName} SET section_title=($1), random_shuffle=($2) WHERE exam_id=($3) AND section_id=($4) RETURNING *`;
      const conn = await Client.connect();
      const res = await conn.query(sql, [
        section_title,
        random_shuffle,
        exam_id,
        section_id,
      ]);
      conn.release();
      const section: ExamSection = res.rows[0];
      return section;
    } catch (err) {
      throw new Error(
        `Could not update exam section ${section_id}. Error: ${err}`
      );
    }
  }

  async deleteExamSection(
    exam_id: number,
    section_id: number
  ): Promise<ExamSection> {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE exam_id=($1) AND section_id=($2) RETURNING *`;
      // @ts-ignore
      const conn = await Client.connect();

      const result = await conn.query(sql, [exam_id, section_id]);
      conn.release();
      const section = result.rows[0];

      return section;
    } catch (err) {
      throw new Error(
        `Could not delete exam section ${section_id}. Error: ${err}`
      );
    }
  }
}
