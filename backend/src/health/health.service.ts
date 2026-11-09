import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
    constructor(private readonly dataSource: DataSource){}

    private async checkDatabase(): Promise<boolean>{
        try{
            await this.dataSource.query('SELECT 1');
            return true;
        }
        catch(err){
            return false;
        }
    }
   
    live(){
        return {
            status: 'ok'
        };
    }

    
    async ready(){
        const databaseUp = await this.checkDatabase();

        if(!databaseUp){
            throw new ServiceUnavailableException({
                status: 'error',
                database: 'down'
            });
        }

        return {
            status: 'ok',
            database: 'up'
        };
    }

   
    async health(){
        const databaseUp = await this.checkDatabase();

        return {
            status: databaseUp ? 'ok' : 'error',
            database: databaseUp ? 'up' : 'down',
            uptime: process.uptime(),
            timestamp: new Date()
        };
    }

    
}