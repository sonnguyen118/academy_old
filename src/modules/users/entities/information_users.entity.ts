import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'information_users' })
export class InformationUsersEntity extends Document {
  @Prop()
  code: string;

  @Prop()
  name: string;

  @Prop()
  identificationNumber: number;

  @Prop()
  IdentificationDate: Date;

  @Prop()
  IdentificationAdress: string;

  @Prop({ type: Date })
  DOB: Date;

  @Prop()
  gender: boolean;

  @Prop()
  city: string;

  @Prop()
  district: string;

  @Prop()
  wards: string;

  @Prop()
  street: string;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop()
  parentPhone: string;

  @Prop()
  wishToJoin: string;

  @Prop()
  note: string;

  @Prop()
  avatar: string;

  @Prop([String]) // Sử dụng kiểu Array
  identificationImage: string[];

  @Prop()
  isSuspended: string;
}

export const InformationUsersSchema = SchemaFactory.createForClass(
  InformationUsersEntity,
);
