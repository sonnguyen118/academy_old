import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { InformationUsersEntity } from './information_users.entity';
import { RoleConfigEntity } from '@modules/auth/entities/role.entity';
import * as mongoose from 'mongoose'; // Import mongoose

@Schema({ collection: 'users' })
export class UsersEntity extends Document {
  @Prop()
  _id: mongoose.Schema.Types.ObjectId; // Sử dụng mongoose.Schema.Types.ObjectId

  @Prop()
  userName: string;

  @Prop()
  password: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: InformationUsersEntity.name,
  })
  information: InformationUsersEntity;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: RoleConfigEntity.name })
  role: RoleConfigEntity;

  @Prop()
  isActive: boolean;

  @Prop()
  isDelete: boolean;

  @Prop()
  isValidate: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UsersSchema = SchemaFactory.createForClass(UsersEntity);
