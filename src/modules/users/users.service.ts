import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { CreateUsersDto, CreateStudentDto } from './dto/create-users.dto';
import {
  UpdateUserDto,
  ChangePassWordUserDto,
  UpdateStudentDto,
} from './dto/update-users.dto';

import { UsersEntity } from './entities/users.entity';
import { InformationUsersEntity } from './entities/information_users.entity';
import { RoleConfigEntity } from '@modules/auth/entities/role.entity';
import { sendEmail, sendEmailValidate } from '@config/mail';
import { BaseResponse } from '@interface/base.response';
import { generatePassword } from '@utils/functions/passwordGenerator';
import config from '@config';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('Users') private readonly userModel: Model<UsersEntity>,
    @InjectModel('InformationUsers')
    private readonly informationUsersModel: Model<InformationUsersEntity>,
    @InjectModel('RoleConfig')
    private readonly roleConfigModel: Model<RoleConfigEntity>,
  ) {}

  async createSuperAdmin(dto: CreateUsersDto) {
    try {
      // checkUser
      const checkUser = await this.userModel.findOne({
        userName: dto.userName,
      });
      if (checkUser) {
        throw new Error('Account already exists');
      }
      // Check quyền
      const checkRole = await this.roleConfigModel.findOne({
        name: dto.role,
      });
      if (!checkRole) {
        throw new Error('Role already exists');
      }
      // Tạo thông tin người dùng
      const informationUser = new this.informationUsersModel(dto.information);
      await informationUser.save();

      // Tạo user
      const hashPwd = await bcrypt.hash(dto.password, 10);
      const data = {
        userName: dto.userName,
        password: hashPwd,
        isActive: true,
        isDelete: false,
        information: informationUser._id,
        role: checkRole._id,
        isValidate: true,
      };
      const user = new this.userModel(data);
      const savedUser = await user.save();
      return new BaseResponse(
        'Create User Super-Admin successfully',
        { savedUser },
        201,
      );
    } catch (error) {
      throw new ConflictException(error.message);
    }
  }

  async createStudent(dto: CreateStudentDto) {
    try {
      let isDuplicate: boolean;
      // checkUser
      const checkUser = await this.userModel.findOne({
        userName: dto.userName,
      });
      if (checkUser) {
        throw new Error('Account already exists');
      }
      // Check quyền từ env xem db có lưu hay không
      const checkRole = await this.roleConfigModel.findOne({
        name: config.student,
      });
      if (!checkRole) {
        throw new Error('Database no have this role');
      }

      // Tạo mã học viên mới và kiểm tra sự trùng lặp
      const generateCode = async (newCode?: string): Promise<string> => {
        const codeToCheck = newCode || generatePassword();
        const existingUser = await this.informationUsersModel.findOne({
          code: codeToCheck,
        });
        const isDuplicate = !!existingUser;

        if (isDuplicate) {
          return generateCode(); // Nếu mã trùng lặp, gọi lại hàm đệ quy để tạo mã mới
        }

        return codeToCheck;
      };
      // Tạo mã mới và kiểm tra tính duy nhất
      const code = await generateCode();
      // Tạo thông tin người dùng
      const information = dto.information;
      information.code = code;
      // check các thông tin người dùng
      if (
        !information.email ||
        !information.name ||
        !information.phone ||
        !information.identificationNumber
      ) {
        throw new Error('UserInfor must have email');
      }
      const informationUser = new this.informationUsersModel(information);
      await informationUser.save();

      // tự động tạo password
      const randomPassword = generatePassword();
      // Tạo user
      const hashPwd = await bcrypt.hash(randomPassword, 10);
      const data = {
        userName: dto.userName,
        password: hashPwd,
        isActive: true,
        isDelete: false,
        information: informationUser._id,
        role: checkRole._id,
        isValidate: false,
      };
      const user = new this.userModel(data);
      await user.save();
      // Gửi email tới student
      sendEmail(information.email, dto.userName, randomPassword)
        .then(() => {
          console.log('Email sent successfully');
        })
        .catch((error) => {
          console.error('Failed to send email:', error);
        });
      return new BaseResponse(
        'Create Student successfully',
        {
          userName: dto.userName,
          password: randomPassword,
        },
        201,
      );
    } catch (error) {
      throw new ConflictException(error.message);
    }
  }

  async changeStudentPassword(dto: ChangePassWordUserDto) {
    try {
      // check repassword
      if (dto.password !== dto.repassword) {
        throw new Error('passwords and repassword entered do not match');
      }
      // checkUser
      const checkUser = await this.userModel.findOne({
        userName: dto.userName,
      });
      if (!checkUser) {
        throw new Error('Account exists in Systems');
      }
      const checkInfor = await this.informationUsersModel.findOne({
        _id: checkUser.information,
      });

      // Tạo user
      const hashPwd = await bcrypt.hash(dto.password, 10);

      if (!checkInfor.email) {
        throw new Error('User dont have email');
      }
      await this.userModel.updateOne(
        { _id: checkUser._id },
        { password: hashPwd, isValidate: true },
      );
      // Gửi email tới student
      sendEmailValidate(checkInfor.email, dto.userName, dto.password)
        .then(() => {
          console.log('Email sent successfully');
        })
        .catch((error) => {
          console.error('Failed to send email:', error);
        });
      return new BaseResponse(
        'Validate Student successfully',
        {
          userName: dto.userName,
          password: dto.password,
        },
        201,
      );
    } catch (error) {
      throw new ConflictException(error.message);
    }
  }

  async getListStudents(pageIndex: number, pageSize: number): Promise<any> {
    try {
      const skip = (pageIndex - 1) * pageSize;
      // Lấy id của role Student
      const checkRole = await this.roleConfigModel.findOne({
        name: config.student,
      });

      const query: FilterQuery<any> = {
        isActive: true,
        isDelete: false,
        role: checkRole._id,
      };

      const [data, totalRecord] = await Promise.all([
        this.userModel.find(query).skip(skip).limit(pageSize).exec(),
        this.userModel.countDocuments(query),
      ]);

      const customData = {
        listData: data,
        pageIndex: pageIndex,
        pageSize: pageSize,
      };

      return new BaseResponse('Success', customData, 200);
    } catch (error) {
      throw new ConflictException(error.message);
    }
  }

  // xem chi tiết student
  async getDetailStudents(_id: string): Promise<any> {
    try {
      const query: FilterQuery<any> = {
        isDelete: false,
        'information.code': _id,
      };

      const data = await this.userModel.findOne(query).exec();

      if (!data) {
        throw new NotFoundException('User not found');
      }

      const informationQuery: FilterQuery<any> = {
        'information.code': _id,
      };

      const information = await this.informationUsersModel
        .findOne(informationQuery)
        .exec();

      if (!information) {
        throw new NotFoundException('User not information!');
      }

      return new BaseResponse('Success', data, 200);
    } catch (error) {
      throw new ConflictException(error.message);
    }
  }
}
