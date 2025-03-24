import Client from '../utils/db-config/database';
import { Question } from './question';
import { QuestionChoice } from './question_choices';

export class SectionQuestionModel {
  tableName: string = 'section_questions';
  async getSectionQuestion(
    examId: number,
    sectionId: number,
    questionId: number
  ): Promise<Question> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE exam_id=($1) AND section_id=($2) AND question_id=($3)`;
      const conn = await Client.connect();
      const result = await conn.query(sql, [examId, sectionId, questionId]);
      conn.release();
      return result.rows[0];
    } catch (err) {
      throw new Error(
        `Could not find question with exam_id ${examId}, section_id ${sectionId}, and question_id ${questionId}.`
      );
    }
  }

  async getSectionQuestions(
    examId: number,
    sectionId: number
  ): Promise<Question[]> {
    try {
      const sql = `SELECT 
       section_questions.question_id, section_questions.question_text,
        encode(section_questions.diagram::bytea, 'base64') as diagram,
        section_questions.weight,
        section_questions.professor_id,
       section_questions.difficulty,
       choices.choice_id, choices.choice_text, choices.is_correct 
       FROM section_questions 
        LEFT JOIN section_question_choices AS choices 
        ON section_questions.question_id = choices.question_id
        AND section_questions.section_id = choices.section_id
        AND section_questions.exam_id = choices.exam_id
        WHERE section_questions.exam_id=($1) AND section_questions.section_id=($2)`;
      const conn = await Client.connect();
      const res = await conn.query(sql, [examId, sectionId]);
      conn.release();
      // if no questions in section return empty object
      if (res.rowCount === 0) return {} as Question[];

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

      return questions;
    } catch (err) {
      throw new Error(
        `Could not find exam section questions in exam_id ${examId} and section_id ${sectionId}. Error: ${err}`
      );
    }
  }

  // create question with choices and rollback if any of the choices fail
  // you can use this to create any number of questions and choices
  async addQuestionToSection(
    professorId: number,
    examId: number,
    sectionId: number,
    question: Question
  ): Promise<Question> {
    try {
      const lastQIdSql = `SELECT question_id 
      FROM section_questions WHERE exam_id=($1) AND section_id=($2) ORDER BY question_id DESC LIMIT 1`;
      let sectionQuestionsSql = `INSERT INTO section_questions 
      (exam_id, section_id,weight , question_text, diagram,professor_id, difficulty,question_id) 
      VALUES ($1, $2, $3, $4, decode($5,'base64'), $6, $7 , $8)
       RETURNING exam_id, section_id, weight, question_text, professor_id, difficulty, question_id
      `;

      let choicesSql = `INSERT INTO section_question_choices 
      (choice_id,choice_text, is_correct, question_id,exam_id,section_id) VALUES `;
      for (let j = 0; j < question.choices!.length; j++) {
        choicesSql += `(${j + 1}, '${question.choices![j].choice_text}',
         ${question.choices![j].is_correct}, $1, $2, $3)`;
        if (j < question.choices!.length - 1) {
          choicesSql += ',';
        }
      }
      choicesSql += ' RETURNING *';
      // console.log(choicesSql);

      const conn = await Client.connect();
      const lastQIdResult = await conn.query(lastQIdSql, [examId, sectionId]);
      // console.log(lastQIdResult.rows);
      const lastQId: number = (lastQIdResult.rows[0]?.question_id ?? 0) + 1;

      const result = await conn.query('BEGIN');

      const questionsResult = await conn.query(sectionQuestionsSql, [
        examId,
        sectionId,
        question.weight,
        question.question_text,
        question.diagram ? question.diagram.split(',')[1] : null,
        professorId,
        question.difficulty,
        lastQId,
      ]);
      const questionOutput = questionsResult.rows[0] as Question;
      const choicesResult = await conn.query(choicesSql, [
        questionOutput.question_id,
        examId,
        sectionId,
      ]);

      questionOutput.choices = choicesResult.rows as QuestionChoice[];

      try {
        await conn.query('COMMIT');
      } catch (err) {
        await conn.query('ROLLBACK');
        conn.release();
        throw new Error(
          `Database Error: Could not create question. Error: ${err}`
        );
      }
      conn.release();

      return questionOutput;
    } catch (err) {
      throw new Error(`Could not create question. ${err}`);
    }
  }

  async addQuestionsToSection(
    professorId: number,
    examId: number,
    sectionId: number,
    questions: Question[]
  ): Promise<boolean> {
    try {
      const lastQIdSql = `SELECT question_id 
      FROM section_questions WHERE exam_id=($1) AND section_id=($2) ORDER BY question_id DESC LIMIT 1`;

      let sectionQuestionsSql = `INSERT INTO section_questions 
      (exam_id, section_id,professor_id,weight , question_text, diagram, difficulty,question_id) 
      VALUES `;
      let choicesSql = `INSERT INTO section_question_choices 
      (choice_id,choice_text, is_correct, question_id,exam_id,section_id) VALUES `;
      // ts-ignore
      const Questionvalues: (string | number | boolean | File | undefined|null)[] =
        [];
      const choicesValues: (string | number | boolean | undefined)[] = [];

      

      const conn = await Client.connect();
      const lastQIdResult = await conn.query(lastQIdSql, [examId, sectionId]);
      // console.log(lastQIdResult.rows);
      let lastQId: number = (lastQIdResult.rows[0]?.question_id ?? 0) + 1;
      let choiceIndex = 1;
      for (let i = 0; i < questions.length; i++) {
        sectionQuestionsSql += `($${i * 8 + 1}, $${i * 8 + 2}, $${
          i * 8 + 3
        }, $${i * 8 + 4}, $${i * 8 + 5}, decode($${i * 8 + 6},'base64'), $${i * 8 + 7}, $${
          i * 8 + 8
        }) `;
        
        Questionvalues.push(
          examId,
          sectionId,
          professorId,
          questions[i].weight ?? 1,
          questions[i].question_text,
          questions[i].diagram ,
          questions[i].difficulty,
          lastQId
        );
        
        for (let j = 0; j < questions[i].choices!.length; j++) {
          choicesSql += `($${choiceIndex++}, $${choiceIndex++}, $${choiceIndex++}, $${choiceIndex++}, $${choiceIndex++}, $${choiceIndex++})`;
          choicesValues.push(
            j + 1,
            questions[i].choices![j].choice_text,
            questions[i].choices![j].is_correct,
            lastQId,
            examId,
            sectionId
          );
          if (choicesSql[choicesSql.length - 1] === ')') {
            if (
              j == questions[i].choices!.length - 1 &&
              i == questions.length - 1
            ) {
              break;
            }
            choicesSql += ',';
          }
        }
        if (i < questions.length - 1) {
          sectionQuestionsSql += ',';
        }
        lastQId++;
      }

      // sectionQuestionsSql += ' RETURNING *';
      // choicesSql += ' RETURNING *';
      // console.log(choicesSql);
      const result = await conn.query('BEGIN');

      const questionsResult = await conn.query(
        sectionQuestionsSql,
        Questionvalues
      );
      // const questionOutput = questionsResult.rows as Question[];
      const choicesResult = await conn.query(choicesSql, choicesValues);

      // questionOutput.choices = choicesResult.rows as QuestionChoice[];

      try {
        await conn.query('COMMIT');
        conn.release();
        return true;
      } catch (err) {
        await conn.query('ROLLBACK');
        conn.release();
        // throw new Error(
        //   `Database Error: Could not create question. Error: ${err}`
        // );
      }
      // conn.release();

      return false;
    } catch (err) {
      console.log(err);
      throw new Error(`Could not create question. ${err}`);
    }
  }

  async updateSectionQuestion(
    exam_id: number,
    section_id: number,
    question_id: number,
    question: Question
  ): Promise<void> {
    try {
      const sql = `UPDATE section_questions SET weight=($1),
       question_text=($2), diagram=decode($3,'base64'), 
       difficulty=($4) WHERE exam_id=($5) AND section_id=($6) AND question_id=($7)`;
       const allChoicesSql = `SELECT choice_id FROM section_question_choices WHERE exam_id=($1) AND section_id=($2) AND question_id=($3)`;
       
     
        const allQuestionChoicesIds:Set<number> = new Set();
        
       
      // @ts-ignore
      const conn = await Client.connect();
      try{
      // BEGIN
      await conn.query('BEGIN');
      // update question
      const result = await conn.query(sql, [
        question.weight,
        question.question_text,
        question.diagram ? question.diagram?.split(',')[1] : null,
        question.difficulty,
        exam_id,
        section_id,
        question_id,
      ]);
      // get all choices
      const allChoicesResult = await conn.query(allChoicesSql, [exam_id, section_id, question_id]);

      let lastChoiceId:number = 0;
      allChoicesResult.rows.forEach((row:any)=>{
        // put all choices ids in a set fo better performance
        allQuestionChoicesIds.add(row.choice_id);
        if(row.choice_id > lastChoiceId){
          // get last choice id
          lastChoiceId = row.choice_id;
        }
      });

      lastChoiceId++;

      // update choices
      if (question.choices) {
        for(let i=0;i<question.choices.length;i++){
          if(question.choices[i].choice_id){
          // remove choice id from set because it is not deleted
          allQuestionChoicesIds.delete(question.choices[i].choice_id);
          // update choice
          const choiceSql = `UPDATE section_question_choices 
          SET choice_text=($1), is_correct=($2) 
          WHERE exam_id=($3) AND section_id=($4) AND question_id=($5) AND choice_id=($6)`;
          await conn.query(choiceSql, [
            question.choices[i].choice_text,
            question.choices[i].is_correct,
            exam_id,
            section_id,
            question_id,
            question.choices[i].choice_id
          ]);
        } else {
          // create choice
          const choiceSql = `INSERT INTO section_question_choices
          (choice_text, is_correct, question_id, exam_id, section_id, choice_id)
          VALUES ($1, $2, $3, $4, $5, $6)`;
          await conn.query(choiceSql, [
            question.choices[i].choice_text,
            question.choices[i].is_correct,
            question_id,
            exam_id,
            section_id,
            lastChoiceId++
          ]);

        }
      }}
      // delete unwanted choices
      if(allQuestionChoicesIds.size > 0){
        const deleteChoicesSql = `DELETE FROM section_question_choices
        WHERE exam_id=($1) AND section_id=($2) AND question_id=($3) AND choice_id IN (${Array.from(allQuestionChoicesIds).join(',')})`;
        conn.query(deleteChoicesSql, [exam_id, section_id, question_id]);
      }
      // COMMIT
      await conn.query('COMMIT');
      conn.release();
     
    } catch (err) {
      console.log(err);
      await conn.query('ROLLBACK');
      conn.release();
      throw new Error(
        `Could not update question ${question_id} from section ${section_id} for exam ${exam_id}.`
      );
    }
      // update choices
      // conn.release();
      
    } catch (err) {
      console.log(err);
      throw new Error(
        `Could not update question ${question_id} from section ${section_id} for exam ${exam_id}.`
      );
    }
  }

  async deleteSectionQuestion(
    exam_id: number,
    section_id: number,
    question_id: number
  ): Promise<void> {
    try {
      // console.log('deleting question');
      const sql = `DELETE FROM section_questions WHERE exam_id=($1) AND section_id=($2) AND question_id=($3)`;
      // @ts-ignore
      const conn = await Client.connect();

      const result = await conn.query(sql, [exam_id, section_id, question_id]);
      conn.release();

      // return true;
    } catch (err) {
      console.log(err);
      throw new Error(
        `Could not delete question ${question_id} from section ${section_id} for exam ${exam_id}.`
      );
    }
  }
}
