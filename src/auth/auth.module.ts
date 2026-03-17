import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { User } from 'src/user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
  ]
})
export class AuthModule {}
