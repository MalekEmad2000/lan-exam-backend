import Client from '../utils/db-config/database';
import { User, UserModel } from './user';

export interface SuperUser extends User {}

export class SuperUserModel {
  tableName: string = 'super_users';
  async loginByEmail(
    email: string,
    password: string
  ): Promise<SuperUser | null> {
    try {
      const userModel: UserModel = new UserModel();
      const user: User = await userModel.loginByEmail(email, password);
      const super_user: SuperUser = await this.findById(user.id);
      if (super_user) {
        return user;
      } else {
        return null;
      }
    } catch (err) {
      throw new Error(`Could not login super user by email. Error: ${err}`);
    }
  }

  // async loginByUserName(
  //   username: string,
  //   password: string
  // ): Promise<SuperUser | null> {
  //   try {
  //     const userModel: UserModel = new UserModel();
  //     // const user: User = await userModel.loginByUsername(username, password);
  //     const super_user: SuperUser = await this.findById(user.id);
  //     if (super_user) {
  //       return user;
  //     } else {
  //       return null;
  //     }
  //   } catch (err) {
  //     throw new Error(`Could not login super user by email. Error: ${err}`);
  //   }
  // }
  async isThereSuperUser(): Promise<boolean> {
    try {
      const conn = await Client.connect();
      const sql = `SELECT * FROM ${this.tableName} LIMIT 1`;

      const result = await conn.query(sql);

      conn.release();
      if (result.rows.length === 0) {
        return false;
      }
      return true;
    } catch (err) {
      throw new Error(`Could not get all super users. Error: ${err}`);
    }
  }

  async findById(id: number): Promise<User> {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE id=($1)`;

      const conn = await Client.connect();

      const result = await conn.query(sql, [id]);

      conn.release();

      return result.rows[0];
    } catch (err) {
      throw new Error(`Could not find super user ${id}. Error: ${err}`);
    }
  }

  async createAdminFromUser(user_id: number): Promise<SuperUser> {
    try {
      const sql = `INSERT INTO ${this.tableName} (id) VALUES($1) RETURNING *`;
      const conn = await Client.connect();

      const result = await conn.query(sql, [user_id]);
      conn.release();
      const user = result.rows[0];

      return user;
    } catch (err) {
      throw new Error(`Could not add new super user ${user_id}. Error: ${err}`);
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
      throw new Error(`Could not delete super user ${id}. Error: ${err}`);
    }
  }
}
