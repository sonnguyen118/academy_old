import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'role_config' })
export class RoleConfigEntity extends Document {
  @Prop()
  _id: string; // Sử dụng kiểu string thay vì ObjectId

  @Prop()
  name: string;
}

export const RoleConfigSchema = SchemaFactory.createForClass(RoleConfigEntity);
