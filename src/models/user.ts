import Client from '../utils/db-config/database';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

export type User = {
  id: number;
  name: string;
  email: string;
  password?: string;
  is_admin?: boolean;
};

export class UserModel {
  tableName: string = 'users';

  async getAllUsers(): Promise<User[]> {
    try {
      const conn = await Client.connect();
      const sql = `SELECT id, name, email, EXISTS(SELECT * FROM super_users WHERE id = users.id)  AS is_admin
       FROM ${this.tableName} `;

      const result = await conn.query(sql);

      conn.release();

      return result.rows;
    } catch (err) {
      throw new Error(`Could not get all users. Error: ${err}`);
    }
  }

  async findById(id: number): Promise<User> {
    try {
      const sql = `SELECT users.id , users.name,users.email, (CASE 
        WHEN super_users.id IS NULL THEN false 
        ELSE true 
      END) AS is_admin
           FROM users LEFT JOIN super_users 
         on users.id = super_users.id
          WHERE users.id=($1)`;

      const conn = await Client.connect();

      const result = await conn.query(sql, [id]);

      conn.release();
      // if (result.rows.length !== 1) {
      //   throw new Error(`Could not find user ${id}`);
      // }

      return result.rows[0];
    } catch (err) {
      throw new Error(`Could not find user ${id}. Error: ${err}`);
    }
  }

  async findByEmail(email: string): Promise<User> {
    try {
      const sql = `SELECT id, name, email
       FROM ${this.tableName} WHERE email=($1)`;

      const conn = await Client.connect();

      const result = await conn.query(sql, [email.toLocaleLowerCase()]);

      conn.release();

      return result.rows[0];
    } catch (err) {
      throw new Error(`Could not find user ${email}. Error: ${err}`);
    }
  }

  async create(name: string, email: string, password: string): Promise<User> {
    try {
      const saltRounds: number =
        parseInt(process.env.SALT_ROUNDS as string) ?? 10;

      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const sql = `INSERT INTO ${this.tableName} (name, email, password) VALUES($1, $2, $3) RETURNING id, name, email`;
      // @ts-ignore
      const conn = await Client.connect();

      const result = await conn.query(sql, [name, email.toLowerCase(), hashedPassword]);
      conn.release();
      // console.log(result.rows[0]);
      return result.rows[0];
    } catch (err) {
      // console.log(err);
      throw new Error(`Could not add new user ${name}. Email Already Exists.`);
    }
  }

  async delete(id: number): Promise<User> {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE id=($1) RETURNING *`;
      // @ts-ignore
      const conn = await Client.connect();

      const result = await conn.query(sql, [id]);
      conn.release();
      const user = result.rows[0];

      return user;
    } catch (err) {
      throw new Error(`Could not delete user ${id}. Error: ${err}`);
    }
  }

  // async loginByUsername(user_name: string, password: string): Promise<User> {
  //   try {
  //     const sql = `SELECT id, name, username, email
  //     FROM ${this.tableName} WHERE username=($1) AND password=($2)`;
  //     // @ts-ignore
  //     const conn = await Client.connect();

  //     const result = await conn.query(sql, [user_name, password]);
  //     conn.release();

  //     const user = result.rows[0];

  //     return user;
  //   } catch (err) {
  //     throw new Error(`Could not find user ${user_name}. Error: ${err}`);
  //   }
  // }

  async loginByEmail(email: string, password: string): Promise<User> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE email=($1)`;
      // console.log(email.toLowerCase())
      // @ts-ignore
      const conn = await Client.connect();

      const result = await conn.query(sql, [email.toLowerCase()]);
      conn.release();

      const user = result.rows[0];
      console.log(user);
      if (!user) throw new Error(`Could not find user ${email}.`);

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) throw new Error(`Wrong Email or Password.`);
      delete user.password;
      return user;
    } catch (err) {
      console.log(err);
      throw new Error(`Could not find user ${email}. Error: ${err}`);
    }
  }

  async update(email: string, id: number, name: string, password: string) {
    try {
      let sql = '';
      if (password) {
        sql = `UPDATE users SET name=$1,password=$2 WHERE id = $3  AND email=$4 `;
      } else sql = `UPDATE users SET name=$1 WHERE id = $2 AND email=$3 `;
      sql += 'RETURNING id, name, email';

      // @ts-ignore
      const conn = await Client.connect();

      let result;
      if (password) {
        const saltRounds: number = parseInt(process.env.SALT_ROUNDS as string) ;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        result = await conn.query(sql, [name, hashedPassword, id, email.toLowerCase()]);
      } else result = await conn.query(sql, [name, id, email.toLowerCase()]);
      conn.release();

      const user = result.rows[0];

      return user;
    } catch (err) {
      console.log(err);
      throw new Error(`Could not find user ${email}. Error: ${err}`);
    }
  }
}
