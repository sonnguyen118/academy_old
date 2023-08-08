import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersEntity, UsersSchema } from './entities/users.entity';
import {
  InformationUsersEntity,
  InformationUsersSchema,
} from './entities/information_users.entity';
import {
  RoleConfigEntity,
  RoleConfigSchema,
} from '@modules/auth/entities/role.entity';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    MongooseModule.forFeature([
      { name: UsersEntity.name, schema: UsersSchema },
      { name: InformationUsersEntity.name, schema: InformationUsersSchema },
      { name: RoleConfigEntity.name, schema: RoleConfigSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
