import { PartialType } from '@nestjs/swagger';
import { OmitType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';

/** Update accepts any create field except the immutable employee number. */
export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['employeeNumber'] as const),
) {}
