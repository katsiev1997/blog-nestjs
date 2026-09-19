import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { eq, ilike, or, type SQL } from 'drizzle-orm';
import type { PublicUser } from '../auth/types';
import { DRIZZLE } from '../db/db.module';
import type { DrizzleDB } from '../db/drizzle.types';
import { usersTable } from '../db/schema';
import { UpdateUserDto } from './dto/update-user.dto';

type UserRow = typeof usersTable.$inferSelect;

@Injectable()
export class UserService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** Case-insensitive substring match on username. */
  async findByUsername(username: string): Promise<PublicUser[]> {
    const users = await this.db
      .select()
      .from(usersTable)
      .where(ilike(usersTable.username, `%${username}%`));

    return users.map((user) => this.toPublicUser(user));
  }

  async findOne(id: number): Promise<PublicUser> {
    const user = await this.findOneOrFail(id);
    return this.toPublicUser(user);
  }

  async update(
    id: number,
    requesterId: number,
    dto: UpdateUserDto,
  ): Promise<PublicUser> {
    this.assertSelf(id, requesterId);
    await this.findOneOrFail(id);

    if (dto.email || dto.username) {
      await this.assertUniqueCredentials(id, dto.email, dto.username);
    }

    const values: Partial<typeof usersTable.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.name !== undefined) values.name = dto.name;
    if (dto.age !== undefined) values.age = dto.age;
    if (dto.email !== undefined) values.email = dto.email.toLowerCase();
    if (dto.username !== undefined) values.username = dto.username;
    if (dto.imageUrl !== undefined) values.imageUrl = dto.imageUrl;
    if (dto.password !== undefined) {
      values.password = await argon2.hash(dto.password);
    }

    const [user] = await this.db
      .update(usersTable)
      .set(values)
      .where(eq(usersTable.id, id))
      .returning();

    if (!user) {
      throw new InternalServerErrorException('Failed to update user');
    }

    return this.toPublicUser(user);
  }

  async remove(id: number, requesterId: number): Promise<PublicUser> {
    this.assertSelf(id, requesterId);
    await this.findOneOrFail(id);

    const [user] = await this.db
      .delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning();

    if (!user) {
      throw new InternalServerErrorException('Failed to delete user');
    }

    return this.toPublicUser(user);
  }

  private async findOneOrFail(id: number): Promise<UserRow> {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    return user;
  }

  private assertSelf(id: number, requesterId: number): void {
    if (id !== requesterId) {
      throw new ForbiddenException('You can only modify your own profile');
    }
  }

  private async assertUniqueCredentials(
    userId: number,
    email?: string,
    username?: string,
  ): Promise<void> {
    const conditions: SQL[] = [];

    if (email) {
      conditions.push(eq(usersTable.email, email.toLowerCase()));
    }
    if (username) {
      conditions.push(eq(usersTable.username, username));
    }

    if (conditions.length === 0) {
      return;
    }

    const [existing] = await this.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(or(...conditions))
      .limit(1);

    if (existing && existing.id !== userId) {
      throw new ConflictException('Email or username is already taken');
    }
  }

  private toPublicUser(user: UserRow): PublicUser {
    const { password, ...publicUser } = user;
    void password;
    return publicUser;
  }
}
