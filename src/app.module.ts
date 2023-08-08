import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import config from '@config/index';
import { UsersEntity } from '@modules/users/entities/users.entity';
import { InformationUsersEntity } from '@modules/users/entities/information_users.entity';
import { UploadsModule } from './modules/uploads/uploads.module';
import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static/dist/serve-static.module';
import { join } from 'path';
import { AuthModule } from '@modules/auth/auth.module';
import { RoleConfigEntity } from '@modules/auth/entities/role.entity';
import { AppService } from './app.service';

@Module({
  imports: [
    MongooseModule.forRoot(config.mongo_url),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads/',
    }),
    MulterModule.register({
      dest: './uploads',
    }),
    UsersModule,
    UploadsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
