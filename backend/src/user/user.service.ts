import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entity/users.js';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UserService {
    constructor(@InjectRepository(Users) private userRepo: Repository<Users>){}

    async getProfile(id: string): Promise<Users | null>{
        return await this.userRepo.findOne({
            where:{
                id: parseInt(id)
            }
        })
    }

    async getUserById(userId: string): Promise<Users | null>{
        return await this.userRepo.findOne({
            where:[
                {username: userId},
                {email: userId}
            ]
        })
    }

    async createUser(createUserDto: CreateUserDto): Promise<any>{
        try{
            await this.userRepo.save(await this.userRepo.create(createUserDto));
        }
        catch{
            throw new BadRequestException("Failed to create user");
        }
    }
}
