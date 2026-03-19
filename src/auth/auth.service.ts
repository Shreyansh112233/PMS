import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { ConfigType } from 'src/config/config.type';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './strategies/jwt.strategy';
import { StringValue } from 'ms';
import { v4 as uuidv4 } from 'uuid';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService<ConfigType>,
        private readonly refreshTokenService: RefreshTokenService,
    ) {}

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        this.logger.log(`Login attempt for email: ${email}`);

        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            this.logger.warn(`Login failed - user not found: ${email}`);
            throw new UnauthorizedException('Invalid email or password');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            this.logger.warn(`Login failed - invalid password for: ${email}`);
            throw new UnauthorizedException('Invalid email or password');
        }
        const payload: JwtPayload = { sub: user.id, email: user.email };
        const tokens = await this.generateTokens(payload);

        this.logger.log(`Login successful for: ${email}`);
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
        const payload: JwtPayload = {
            sub: savedUser.id,
            email: savedUser.email,
        };
        const tokens = await this.generateTokens(payload);
        return tokens;
    }

    /**
     * Refresh tokens: validate old token, revoke it (rotation), issue new pair.
     * If validation fails on a structurally-valid JWT, it may indicate token reuse (theft).
     * In that case, revoke ALL tokens for the user (token family invalidation).
     */
    async refreshTokens(userId: string, tokenId: string, refreshToken: string) {
        const isValid = await this.refreshTokenService.validateToken(userId, tokenId, refreshToken);
        if (!isValid) {
            // Possible token reuse attack — revoke all sessions for safety
            this.logger.warn(`Invalid refresh token for user ${userId}, revoking all sessions`);
            await this.refreshTokenService.revokeAllTokens(userId);
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Token rotation: revoke old token before issuing new one
        await this.refreshTokenService.revokeToken(userId, tokenId);

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const payload: JwtPayload = { sub: user.id, email: user.email };
        return this.generateTokens(payload);
    }

    /**
     * Logout: revoke a single session (one device).
     */
    async logout(userId: string, tokenId: string) {
        await this.refreshTokenService.revokeToken(userId, tokenId);
        this.logger.log(`User ${userId} logged out from session ${tokenId}`);
    }

    /**
     * Logout from all devices: revoke all refresh tokens.
     */
    async logoutAll(userId: string) {
        await this.refreshTokenService.revokeAllTokens(userId);
        this.logger.log(`User ${userId} logged out from all devices`);
    }

    private async generateTokens(payload: JwtPayload) {
        const authConfig = this.configService.get('auth', { infer: true })!;
        const tokenId = uuidv4();

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: authConfig.jwt.secret,
                expiresIn: authConfig.jwt.expiresIn as StringValue,
            }),
            this.jwtService.signAsync({ ...payload, tokenId }, {
                secret: authConfig.refresh.secret,
                expiresIn: authConfig.refresh.expiresIn as StringValue,
            }),
        ]);

        // Store hashed refresh token in Redis
        await this.refreshTokenService.storeToken(payload.sub, tokenId, refreshToken);

        return { accessToken, refreshToken };
    }
}
