import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Throttle } from '@nestjs/throttler';
import { JwtRefreshGuard } from 'src/common/guards/jwt-refresh.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Throttle({ default: { ttl: 60_000, limit: 5 } })
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Throttle({ default: { ttl: 60_000, limit: 10 } })
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Throttle({ default: { ttl: 60_000, limit: 10 } })
    @UseGuards(JwtRefreshGuard)
    @Post('refresh')
    async refresh(@CurrentUser() user: any) {
        return this.authService.refreshTokens(user.id, user.tokenId, user.refreshToken);
    }

    @UseGuards(JwtRefreshGuard)
    @Post('logout')
    async logout(@CurrentUser() user: any) {
        await this.authService.logout(user.id, user.tokenId);
        return { message: 'Logged out successfully' };
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout-all')
    async logoutAll(@CurrentUser() user: any) {
        await this.authService.logoutAll(user.id);
        return { message: 'Logged out from all devices' };
    }
}
