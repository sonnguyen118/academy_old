import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UsersModule } from '@modules/users/users.module';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose'; // Import MongooseModule here
import { UsersSchema } from '@modules/users/entities/users.entity'; // Import UsersSchema here
import { RoleConfigSchema } from './entities/role.entity'; // Import RoleConfigSchema here

@Module({
  imports: [
    forwardRef(() => UsersModule),
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: 'Users', schema: UsersSchema },
      { name: 'RoleConfig', schema: RoleConfigSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [JwtModule],
})
export class AuthModule {}
