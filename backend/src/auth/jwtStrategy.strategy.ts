import { Injectable } from "@nestjs/common";
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(){
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: 'ghosthunters',
            ignoreExpiration: false
        });
    }

    async validate(payload: any): Promise<any>{
        return {
            id: payload.id,
            username: payload.username,
            email: payload.email,
            role: payload.role
        };
    }
}