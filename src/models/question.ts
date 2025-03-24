import Client from '../utils/db-config/database';
import { QuestionChoice } from './question_choices';

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}
export type Question = {
  id?: number;
  question_id?: number;
  question_text: string;
  professor_id?: number;
  diagram?: string ;
  weight?: number;
  choices?: QuestionChoice[];
  course_id?: string;
  difficulty: Difficulty;
  is_public: boolean;
};

export class QuestionModel {
  tableName: string = 'bank_questions';
  async getQuestionBank(professor_id: number): Promise<Question[]> {
    try {
      const conn = await Client.connect();
      const sql = `SELECT bank_questions.question_text, bank_questions.id,
      bank_questions.professor_id,
      bank_questions.course_id, bank_questions.difficulty, bank_questions.is_public,
       encode(bank_questions.diagram, 'base64') as diagram
        FROM ${this.tableName} WHERE professor_id=($1) OR is_public=($2)
        ORDER BY bank_questions.id ASC`;

      const result = await conn.query(sql, [professor_id, true]);
      conn.release();

      return result.rows;
    } catch (err) {
      throw new Error(`Could not get questions. Error: ${err}`);
    }
  }
  async getQuestionsByCourseId(
    professorId: number,
    courseId: string
  ): Promise<Question[]> {
    try {
      const conn = await Client.connect();
      const sql = `SELECT bank_questions.question_text, bank_questions.id,
      bank_questions.professor_id,
      bank_questions.course_id, bank_questions.difficulty, bank_questions.is_public,
       encode(bank_questions.diagram, 'base64') as diagram
      FROM ${this.tableName} WHERE course_id=($1) AND (professor_id=($2) OR is_public=($3))
      ORDER BY bank_questions.id ASC`;

      const result = await conn.query(sql, [courseId, professorId, true]);
      conn.release();

      return result.rows;
    } catch (err) {
      throw new Error(`Could not get questions. Error: ${err}`);
    }
  }

  async createQuestion(question: Question): Promise<Question> {
    try {
      const conn = await Client.connect();
      const questionSql = `INSERT INTO ${this.tableName} (question_text, diagram, professor_id, course_id, difficulty, is_public)
       VALUES ($1,decode( $2,'base64'), $3, $4, $5, $6) RETURNING question_text, id, professor_id, course_id, difficulty, is_public`;
      let choiceSql = `INSERT INTO bank_question_choices (question_id, choice_text, is_correct,choice_id) VALUES `;
      for (let i = 0; i < question.choices!.length; i++) {
        choiceSql += `($1, '${question.choices![i].choice_text}', ${
          question.choices![i].is_correct
        }, ${i + 1} )`;
        if (i < question.choices!.length - 1) {
          choiceSql += ',';
        }
      }
      choiceSql += ' RETURNING *';
      try {
        const transaction = await conn.query('BEGIN');

        const questionsQuery = await conn.query(questionSql, [
          question.question_text,
          question.diagram ? question.diagram?.split(',')[1] : null,
          question.professor_id,
          question.course_id,
          question.difficulty,
          question.is_public,
        ]);
        // console.log(choiceSql);
        const questionId: number = questionsQuery.rows[0].id as number;
        const choicesQuery = await conn.query(choiceSql, [questionId]);
        await conn.query('COMMIT');
        conn.release();

        const newQuestion = questionsQuery.rows[0] as Question;
        newQuestion.choices = choicesQuery.rows as QuestionChoice[];
        return newQuestion;
      } catch (err) {
        // console.log(err);
        await conn.query('ROLLBACK');
        conn.release();
        throw new Error(`Could not create question. Error: ${err}`);
      }
    } catch (err) {
      throw new Error(`Could not create question. Error: ${err}`);
    }
  }

  async getQuestionsFromBank(
    questionIds: number[],
    professorId: number,
    questionIdWeightMap?: Map<number, number>
  ): Promise<Question[]> {
    try {
      const sql = `SELECT bank_question_choices.choice_id , bank_question_choices.choice_text,
      bank_question_choices.is_correct,
       bank_questions.id, 
       bank_questions.question_text, bank_questions.professor_id,
        bank_questions.course_id, 
        bank_questions.difficulty, bank_questions.is_public,
        encode(bank_questions.diagram::bytea, 'base64') as diagram
      FROM ${this.tableName} 
      LEFT JOIN bank_question_choices 
      ON bank_questions.id = bank_question_choices.question_id
      WHERE bank_questions.id IN (${questionIds}) 
      AND (professor_id=($1) OR is_public = ($2))
      ORDER BY bank_questions.id ASC;`;

      const conn = await Client.connect();
      const result = await conn.query(sql, [professorId, true]);
      conn.release();
      if (result.rows.length === 0) {
        // throw new Error(`Could not find question with id ${questionId}.`);
        return result.rows[0];
      }
      const questionsResultSet: Set<number> = new Set();
      const questionsResult: Question[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        if (!questionsResultSet.has(result.rows[i].id)) {
          questionsResultSet.add(result.rows[i].id);

          const question: Question = {
            id: result.rows[i].id,
            question_text: result.rows[i].question_text,
            diagram: result.rows[i].diagram,
            professor_id: result.rows[i].professor_id,
            course_id: result.rows[i].course_id,
            difficulty: result.rows[i].difficulty,
            is_public: result.rows[i].is_public,
            weight: questionIdWeightMap
              ? questionIdWeightMap.get(result.rows[i].id)
                ? questionIdWeightMap.get(result.rows[i].id)
                : 1
              : undefined,
            choices: result.rows
              .filter((row) => row.id === result.rows[i].id)
              .map((row) => {
                return {
                  choice_id: row.choice_id,
                  choice_text: row.choice_text,
                  is_correct: row.is_correct,
                };
              }),
          };

          questionsResult.push(question);
        }
      }

      return questionsResult;
    } catch (err) {
      console.log('error in getQuestionsFromBank  ' + err);
      throw new Error(
        `Could not get questions with ids ${questionIds}. Error: ${err}`
      );
    }
  }

  async getQuestion(
    questionId: number,
    professorId: number
  ): Promise<Question> {
    try {
      const sql = `SELECT bank_questions.question_text, bank_questions.id,
      bank_questions.professor_id,
      bank_questions.course_id, bank_questions.difficulty, bank_questions.is_public,
       encode(bank_questions.diagram, 'base64') as diagram,
          bank_question_choices.*
      FROM ${this.tableName} 
      LEFT JOIN bank_question_choices 
      ON bank_questions.id = bank_question_choices.question_id
      WHERE id=($1) AND (professor_id=($2) OR is_public = ($3))
      ORDER BY bank_questions.id ASC , bank_question_choices.choice_id ASC`;
      const conn = await Client.connect();
      const result = await conn.query(sql, [questionId, professorId, true]);
      conn.release();
      if (result.rows.length === 0) {
        // throw new Error(`Could not find question with id ${questionId}.`);
        return result.rows[0];
      }
      const question: Question = {
        id: result.rows[0].id,
        question_text: result.rows[0].question_text,
        diagram: result.rows[0].diagram,
        professor_id: result.rows[0].professor_id,
        course_id: result.rows[0].course_id,
        difficulty: result.rows[0].difficulty,
        is_public: result.rows[0].is_public,
        choices: result.rows.map((row) => {
          return {
            choice_id: row.choice_id,
            choice_text: row.choice_text,
            is_correct: row.is_correct,
          };
        }),
      };
      return question;
    } catch (err) {
      throw new Error(
        `Could not find question with id ${questionId}. Error: ${err}`
      );
    }
  }
  async findProfessorQuestionById(
    professor_id: number,
    question_id: number
  ): Promise<Question> {
    try {
      const sql = `SELECT question_text, bank_questions.id,
      professor_id,
       course_id, difficulty, is_public, encode(diagram, 'base64') as diagram
      FROM ${this.tableName} WHERE id=($1) AND professor_id=($2)`;

      const conn = await Client.connect();

      const result = await conn.query(sql, [question_id, professor_id]);

      conn.release();
      if (result.rows.length === 0)
        throw new Error(
          `Could not find question_id ${question_id} for professor_id ${professor_id}.`
        );

      return result.rows[0];
    } catch (err) {
      throw new Error(
        `Could not find question_id ${question_id} for professor_id ${professor_id}. Error: ${err}`
      );
    }
  }

  async updateQuestion(q: Question): Promise<Question> {
    try {
      const sql = `UPDATE ${this.tableName} 
      SET question_text =$1, diagram= decode($2, 'base64'),
      course_id=$3, difficulty=$4, is_public=$5
      WHERE professor_id = $6 AND id = $7
      RETURNING question_text, id, professor_id, course_id, difficulty, is_public
      ;`;
      const allQuestionChoicesSql = `SELECT choice_id FROM bank_question_choices
      WHERE question_id = $1;`;

      const qChoicesSql = `UPDATE bank_question_choices
      SET choice_text = $1, is_correct = $2
      WHERE question_id = $3 AND choice_id = $4
      RETURNING choice_text, is_correct, question_id, choice_id;`;
      const createQChoicesSql = `INSERT INTO bank_question_choices
      (choice_text, is_correct, question_id, choice_id)
      VALUES ($1, $2, $3, $4)
      RETURNING choice_text, is_correct, question_id, choice_id;`;
      
      const deleteQChoicesSql = `DELETE FROM bank_question_choices
      WHERE question_id = $1 AND choice_id  IN ($2);`;
    
      let updatedQuestion: Question;
      const allQuestionChoicesIds: Set<number> = new Set();

      const conn = await Client.connect();
      await conn.query('BEGIN');
      const result = await conn.query(sql, [
        q.question_text,
        q.diagram ? q.diagram?.split(',')[1] : null,
        q.course_id,
        q.difficulty,
        q.is_public,
        q.professor_id,
        q.id,
      ]);

      updatedQuestion = result.rows[0];
      if(!updatedQuestion) {
        // Question does not exist
        await conn.query('ROLLBACK');
        conn.release();
        throw new Error(
          `Could not find question with id ${q.id} for professor_id ${q.professor_id}.`
        );
      }
      updatedQuestion.choices = [];
      let lastChoiceId: number = 0;
      // get all choices for question
      const allQuestionChoicesResult = await conn.query(allQuestionChoicesSql, [q.id]);
      allQuestionChoicesResult.rows.forEach((row) => {
        allQuestionChoicesIds.add(row.choice_id);
        if(row.choice_id > lastChoiceId) 
        // get last choice id
          lastChoiceId = row.choice_id;
      });
      lastChoiceId++;

      if(q.choices) {
        // Update or create choices
        for (let i = 0; i < q.choices.length; i++) {
          const choice = q.choices[i];
          if (choice.choice_id) {
            // remove choice from set so we can delete any remaining choices
            allQuestionChoicesIds.delete(choice.choice_id);

            // Update choice
            const choicesResult = await conn.query(qChoicesSql, [
              choice.choice_text,
              choice.is_correct,
              q.id,
              choice.choice_id,
            ]);
            if (choicesResult.rowCount === 0) {
              // Choice does not exist
             await conn.query('ROLLBACK');
              conn.release();
              throw new Error(
                `Could not find choice with id ${choice.choice_id} for question_id ${q.id}.`
              );
            }
            updatedQuestion.choices.push(choicesResult.rows[0]);
          } else {
            // No choice_id, create new choice
            const choiceCreateResult = await conn.query(createQChoicesSql, [
              choice.choice_text,
              choice.is_correct,
              q.id,
              lastChoiceId++,
            ]);
            if (choiceCreateResult.rowCount === 0) {
              // could not create choice
              await conn.query('ROLLBACK');
              conn.release();
              throw new Error(
                `Could not create choice for question_id ${q.id}.`
              );
            }
            updatedQuestion.choices.push(choiceCreateResult.rows[0]);
          }
        }}

        // Delete unwanted choices (Not in q.choices)
        if (allQuestionChoicesIds.size > 0) {
          try{
          await conn.query(deleteQChoicesSql, [q.id].concat(Array.from(allQuestionChoicesIds)));
          } catch (err) {
            await conn.query('ROLLBACK');
            conn.release();
            throw new Error(
              `Could not delete choices for question_id ${q.id}. Error: ${err}`
            );
          }
        }
        // console.log(updatedQuestion);
      await conn.query('COMMIT');
    

      conn.release();
      
      return updatedQuestion;
    } catch (err) {
    
      throw new Error(
        `Could not update question with id ${q.id} for professor_id ${q.professor_id}. Error: ${err}`
      );
    }
  }

  async deleteProfessorQuestion(
    questionId: number,
    professorId: number
  ): Promise<Question> {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE id=($1) AND professor_id=($2) 
      RETURNING question_text, id, professor_id, course_id, difficulty, is_public;`;
      // @ts-ignore
      const conn = await Client.connect();

      const result = await conn.query(sql, [questionId, professorId]);
      conn.release();
      if (result.rowCount === 0)
        throw new Error(
          `Could not find question with id ${questionId} for professor_id ${professorId}.`
        );

      return result.rows[0];
    } catch (err) {
      throw new Error(
        `Could not delete question_id ${questionId} for professor_id ${professorId}. Error: ${err}`
      );
    }
  }
}
