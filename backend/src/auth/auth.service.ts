import { BadRequestException, Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto.js';
import { UserService } from '../user/user.service.js';
import {JwtService} from '@nestjs/jwt'

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService, private readonly jwtService: JwtService){}

    async login(login: LoginDto): Promise<string>{
        try{
            const user = await this.userService.getUserById(login.userId);
            if(user != null){
                if(login.password === user.passwordHash){
                    const payload = {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role
                    }

                    return this.jwtService.sign(payload);
                }
                else{
                    return 'Incorrect Password'
                }
            }
            else{
                return `User with id ${login.userId} not found`
            }
        }
        catch{
            throw new BadRequestException('Something went wrong');
        }
    }
}
