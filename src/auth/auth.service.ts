import { ConflictException, Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register-dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    
    constructor(@InjectRepository(User) private userRepository: Repository<User>) { }


   async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
       const isUserExist = await this.userRepository.findOne({ where: { email } });
        if (!isUserExist) {
            return `User with email ${email} does not exist!`;
        }   
        return `User with email ${loginDto.email} logged in successfully!`;
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
       return savedUser;
    }
}
