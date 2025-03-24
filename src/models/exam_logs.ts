import Client from '../utils/db-config/database';

export type ExamLogs = {
  exam_id: number;
  student_id: number;
  time_stamp?: string;
  ip_addr: string;
  // mac_address: string;
  user_agent: string;
  action: string;
  section_id: number;
  question_id: number;
};

export class ExamLogsModel {
  tableName: string = 'exam_logs';

  async getExamLogs(exam_id: number, limit?: number): Promise<ExamLogs[]> {
    try {
      const sql = `SELECT * FROM ${this.tableName} 
      WHERE exam_id=($1) ORDER BY time_stamp DESC ${
        limit ? `LIMIT ${limit}` : ''
      }`;

      const conn = await Client.connect();

      const result = await conn.query(sql, [exam_id]);

      conn.release();

      return result.rows;
    } catch (err) {
      throw new Error(`Could not find exam logs for exam_id ${exam_id}.`);
    }
  }

  async create_exam_log(log: ExamLogs): Promise<ExamLogs> {
    try {
      const sql = `INSERT INTO ${this.tableName} 
      (exam_id, student_id, ip_address, user_agent, action, section_id, question_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
      const conn = await Client.connect();

      const result = await conn.query(sql, [
        log.exam_id,
        log.student_id,
        log.ip_addr,
        // log.mac_address,
        log.user_agent,
        log.action,
        log.section_id,
        log.question_id,
      ]);
      conn.release();
      const user = result.rows[0];

      return user;
    } catch (err) {
      throw new Error(
        `Could not add new exam logs for exam_id ${log.exam_id}. Error: ${err}`
      );
    }
  }
}
