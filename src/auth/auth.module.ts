import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from 'src/user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from 'src/config/config.type';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { RefreshTokenService } from './refresh-token.service';

@Module({
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, RefreshTokenService],
  controllers: [AuthController],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<ConfigType>) => {
        const auth = config.get('auth', { infer: true })!;
        return {
          secret: auth.jwt.secret,
          signOptions: {
            expiresIn: auth.jwt.expiresIn as any,
          },
        };
      },
    }),
  ],
  exports: [RefreshTokenService],
})
export class AuthModule {}
