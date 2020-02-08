import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { HistoryPeriod } from '../../history/history.types';
import { CompareMetric, CompareScale } from '../compare.types';

export class CompareQueryDto {
  @IsString()
  codes!: string;

  @IsOptional()
  @IsIn(['totalCases', 'newCases', 'newCasesAverage', 'totalDeaths', 'newDeaths', 'newDeathsAverage'])
  metric?: CompareMetric;

  @IsOptional()
  @IsIn(['absolute', 'perMillion'])
  scale?: CompareScale;

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
