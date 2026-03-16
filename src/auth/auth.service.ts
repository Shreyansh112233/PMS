import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login-dto';

@Injectable()
export class AuthService {
    login(loginDto: LoginDto): string | PromiseLike<string> {
        return `User with email ${loginDto.email} logged in successfully!`;
    }
}
