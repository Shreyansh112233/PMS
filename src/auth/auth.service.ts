import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register-dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { ConfigType } from 'src/config/config.type';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './strategies/jwt.strategy';
import { StringValue } from 'ms';

@Injectable()
export class AuthService {


    constructor(@InjectRepository(User) private userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService<ConfigType>,) { }


    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }
        const payload: JwtPayload = { sub: user.id, email: user.email };
        const tokens = await this.generateTokens(payload);
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }

    async register(registerDto: RegisterDto) {
        const { name, email, password } = registerDto;
        const isUserExist = await this.userRepository.findOne({ where: { email } });
        if (isUserExist) {
            throw new ConflictException(`User with email ${email} already exists`);
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({ name, email, password: hashedPassword });
        const savedUser = await this.userRepository.save(user);
        const payload = {
            sub: savedUser.id,
            email: savedUser.email,
            role: savedUser.role,
        };
        const tokens = await this.generateTokens(payload);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }

    private async generateTokens(payload: JwtPayload) {
        const authConfig = this.configService.get('auth', { infer: true })!;

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: authConfig.jwt.secret,
                expiresIn: authConfig.jwt.expiresIn as StringValue,
            }),
            this.jwtService.signAsync(payload, {
                secret: authConfig.refresh.secret,
                expiresIn: authConfig.refresh.expiresIn as StringValue,
            }),
        ]);

        return { accessToken, refreshToken };
    }
    private async updateRefreshToken(userId: string, refreshToken: string) {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.userRepository.update(userId, {
            refreshToken: hashedRefreshToken,
        });
    }
}
