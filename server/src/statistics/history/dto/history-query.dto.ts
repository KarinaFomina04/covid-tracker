import { IsIn, IsOptional, Matches } from 'class-validator';
import { HistoryPeriod } from '../history.types';

export class HistoryQueryDto {
  @IsOptional()
  @IsIn(['7d', '30d', '90d', 'all'])
  period?: HistoryPeriod;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;
}
