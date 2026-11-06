import { Injectable } from '@nestjs/common';
import { google } from 'googleapis'
 
@Injectable()
export class EmailService {
    private oauth2Client;
    private gmail;
    constructor(){
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        this.oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        this.gmail = google.gmail({
            version: 'v1',
            auth: this.oauth2Client
        });
    }

    async sendMail(to: string, subject:string, body:string): Promise<any>{
        const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        body
        ].join('\r\n');

        const response = await this.gmail.users.messages.send({
            userId: 'me',
            requestBody:{
                raw: Buffer.from(message).toString('base64url')
            }
        });

        return response.data.id;
    }
}
