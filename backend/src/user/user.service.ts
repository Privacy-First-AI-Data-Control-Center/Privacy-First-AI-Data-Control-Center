import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './entity/users.js';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
    constructor(@InjectRepository(Users) private userRepo: Repository<Users>){}

    async getProfile(id: string): Promise<any>{
        return await this.userRepo.findOne({
            where:{
                id: 1
            }
        })
    }
}
