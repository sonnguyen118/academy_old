import { Injectable, HttpException, HttpStatus, Req } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { BaseResponse } from '@interface/base.response';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import config from '@config';
import {
  convertJwtRefreshToken,
  convertJwtAccessToken,
  convertJwtTemporaryToken,
} from '@utils/functions/convertJwtToken';
import { DecodedToken } from '@interface/decodedToken';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersEntity } from '@modules/users/entities/users.entity';
import { RoleConfigEntity } from './entities/role.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UsersEntity.name)
    private readonly userModel: Model<UsersEntity>,
    @InjectModel(RoleConfigEntity.name)
    private readonly roleConfigModel: Model<RoleConfigEntity>,
  ) {}

  async validateUser(userName: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ userName });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user.toJSON();
      return result;
    }
    return null;
  }

  async loginAdmin(dto: LoginDto): Promise<BaseResponse> {
    try {
      const checkUser = await this.userModel.findOne({
        userName: dto.userName,
      });
      if (!checkUser) {
        throw new Error('Incorrect account');
      }
      const isMatch = await bcrypt.compare(dto.password, checkUser.password);
      if (!isMatch) {
        throw new Error('Incorrect password');
      }
      const checkRole = await this.roleConfigModel.findOne({
        _id: checkUser.role,
      });
      const role = checkRole.name;
      if (role !== config.supper_admin && role !== config.teacher_admin) {
        throw new Error('You do not have the right to operate');
      }

      const accessToken = await convertJwtAccessToken(
        checkUser._id.toString(),
        dto.userName,
        role,
        config.jwt,
      );
      const refreshToken = await convertJwtRefreshToken(
        checkUser._id.toString(),
        dto.userName,
        role,
        config.jwt,
      );

      return new BaseResponse(
        'Logged in successfully',
        {
          userName: checkUser.userName,
          uuid: checkUser._id.toString(),
          accessToken,
          refreshToken,
        },
        200,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.FORBIDDEN);
    }
  }

  async loginStudent(dto: LoginDto): Promise<BaseResponse> {
    try {
      const checkUser = await this.userModel.findOne({
        userName: dto.userName,
      });
      if (!checkUser) {
        throw new Error('Tài khoản không chính xác');
      }
      const isMatch = await bcrypt.compare(dto.password, checkUser.password);
      if (!isMatch) {
        throw new Error('Mật khẩu không chính xác');
      }
      const checkRole = await this.roleConfigModel.findOne({}); // Điều kiện tìm kiếm role
      const role = checkRole.name;
      if (role !== config.student) {
        throw new Error('You do not have the right to operate');
      }

      if (!checkUser.isValidate) {
        const accessToken = await convertJwtTemporaryToken(
          checkUser._id.toString(),
          dto.userName,
          role,
          config.jwt,
        );
        return new BaseResponse(
          'Logged in successfully, please chên mật khủ trong vòng 2 phút',
          {
            userName: checkUser.userName,
            uuid: checkUser._id.toString(),
            isValidate: checkUser.isValidate,
            accessToken,
          },
          200,
        );
      }

      const accessToken = await convertJwtAccessToken(
        checkUser._id.toString(),
        dto.userName,
        role,
        config.jwt,
      );
      const refreshToken = await convertJwtRefreshToken(
        checkUser._id.toString(),
        dto.userName,
        role,
        config.jwt,
      );

      return new BaseResponse(
        'Logged in successfully',
        {
          userName: checkUser.userName,
          uuid: checkUser._id.toString(),
          isValidate: checkUser.isValidate,
          accessToken,
          refreshToken,
        },
        200,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.FORBIDDEN);
    }
  }

  async checkUserAdmin(@Req() req: any): Promise<BaseResponse> {
    try {
      const token = req.headers.authorization;
      if (!token || !token.startsWith('Bearer ')) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }
      // Extract the token part after 'Bearer '
      const tokenValue = token.split(' ')[1];
      // Giải mã token để lấy thông tin người dùng
      const decodedToken = jwt.decode(tokenValue) as DecodedToken; // Thay 'your-secret-key' bằng khóa bí mật bạn sử dụng khi tạo token
      const { uuid, userName, role } = decodedToken;
      // Lấy thông tin người dùng từ token
      if (role !== config.supper_admin) {
        throw new HttpException(
          'Role Failse or You has delete Role',
          HttpStatus.UNAUTHORIZED,
        );
      }
      // Xử lý và trả về kết quả
      return new BaseResponse(
        'Check User Suceess',
        {
          userName: userName,
        },
        200,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.FORBIDDEN);
    }
  }

  async checkUserStudent(@Req() req: any): Promise<BaseResponse> {
    try {
      const token = req.headers.authorization;
      if (!token || !token.startsWith('Bearer ')) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }
      // Extract the token part after 'Bearer '
      const tokenValue = token.split(' ')[1];
      // Giải mã token để lấy thông tin người dùng
      const decodedToken = jwt.decode(tokenValue) as DecodedToken; // Thay 'your-secret-key' bằng khóa bí mật bạn sử dụng khi tạo token
      const { uuid, userName, role } = decodedToken;
      // Lấy thông tin người dùng từ token
      if (role !== config.student) {
        throw new HttpException(
          'Role Failse or You has delete Role',
          HttpStatus.UNAUTHORIZED,
        );
      }
      // Xử lý và trả về kết quả
      return new BaseResponse(
        'Check User Suceess',
        {
          userName: userName,
        },
        200,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.FORBIDDEN);
    }
  }
}
