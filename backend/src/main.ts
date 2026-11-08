import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true
  }))

  const config = new DocumentBuilder()
  .setTitle('Privacy-First AI Data Control Center')
  .setDescription('API documentation')
  .setVersion('1.0')
  .addBearerAuth()
  .addSecurityRequirements('bearer')
  .build();
  
    const doc= SwaggerModule.createDocument(app,config);
    SwaggerModule.setup('api',app,doc);

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
