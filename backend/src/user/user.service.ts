import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entity/users.js';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

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

    async createUser(createUserDto: CreateUserDto): Promise<string>{
        try{
            const u = await this.userRepo.save(await this.userRepo.create(createUserDto));
            if(u != null){
                return 'User registered successfully';
            }
            else{
                return 'failed to create user';
            }
        }
        catch{
            throw new BadRequestException("Failed to create user");
        }
    }

    async updateUser(id: string, updateUserDto: UpdateUserDto){
        const user = this.getUserById(id);
        if(user != null){
            const res = (await this.userRepo.update(id, updateUserDto)).affected;
            if(res != null && res > 0){
                return 'User updated successfully';
            }
            else{
                return 'Failed to update';
            }
        }
        else{
            throw new NotFoundException(`User with id ${id} not found`)
        }
    }
}
