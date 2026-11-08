import { PartialType } from '@nestjs/swagger';
import { CreateConnectorDto } from './create-connector-type.dto.js';

export class UpdateConnectorDto extends PartialType(CreateConnectorDto) {}
