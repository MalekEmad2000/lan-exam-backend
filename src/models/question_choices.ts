import Client from '../utils/db-config/database';

export type QuestionChoice = {
  question_id?: number;
  choice_text: string;
  choice_id: number;
  is_correct: boolean;
};

export class QuestionChoiceModel {
  tableName: string = 'bank_question_choices';

  async getQuestionChoices(question_id: number): Promise<QuestionChoice[]> {
    try {
      const sql = `SELECT choice_id , choice_text , is_correct
      FROM ${this.tableName} WHERE question_id=($1) ORDER BY choice_id ASC`;

      const conn = await Client.connect();

      const result = await conn.query(sql, [question_id]);
      conn.release();
      const choices: QuestionChoice[] = result.rows;

      return choices;
    } catch (err) {
      throw new Error(
        `Could not find qustion choices for question_id ${question_id}. Error: ${err}`
      );
    }
  }

  async createQuestionChoice(q: QuestionChoice): Promise<QuestionChoice> {
    try {
      const sql = `INSERT INTO ${this.tableName} 
      (question_id,choice_id, choice_text,is_correct) VALUES($1, $2,$3,$4) RETURNING *`;
      // @ts-ignore
      const conn = await Client.connect();

      const result = await conn.query(sql, [
        q.question_id,
        q.choice_id,
        q.choice_text,
        q.is_correct,
      ]);
      conn.release();
      if (result.rows.length === 0) {
        throw new Error('Could not add new question choice');
      }
      const qustionChoice = result.rows[0];
      return qustionChoice;
    } catch (err) {
      throw new Error(
        `Could not add new question choice ${q.question_id}. Error: ${err}`
      );
    }
  }

  async delete_choice(
    exam_id: number,
    choice_id: number
  ): Promise<QuestionChoice> {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE exam_id = ($1) choice_id=($2) RETURNING *`;
      // @ts-ignore
      const conn = await Client.connect();

      const result = await conn.query(sql, [exam_id, choice_id]);
      conn.release();
      const qChoice = result.rows[0];
      return qChoice;
    } catch (err) {
      throw new Error(
        `Could not delete question choice ${choice_id}. Error: ${err}`
      );
    }
  }

  async delete_all_question_choices(
    exam_id: number,
    question_id: number
  ): Promise<QuestionChoice> {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE exam_id=($1) AND question_id=($2) RETURNING *`;
      // @ts-ignore
      const conn = await Client.connect();

      const result = await conn.query(sql, [exam_id, question_id]);
      conn.release();
      const qChoice = result.rows[0];
      return qChoice;
    } catch (err) {
      throw new Error(
        `Could not delete question all choices for exam_id ${exam_id} and ${question_id}. Error: ${err}`
      );
    }
  }

  async get_exam_questions_choices(exam_id: number): Promise<QuestionChoice[]> {
    try {
      const sql = `SELECT * FROM ${this.tableName}
       WHERE question_id IN (SELECT id FROM questions WHERE exam_id=($1))`;
      // @ts-ignore
      const conn = await Client.connect();

      const result = await conn.query(sql, [exam_id]);

      conn.release();

      return result.rows;
    } catch (err) {
      throw new Error(
        `Could not find exam questions choices with exam id ${exam_id}. Error: ${err}`
      );
    }
  }
}
