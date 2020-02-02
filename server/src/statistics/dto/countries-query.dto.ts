import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { CountrySortField } from '../statistics.types';

const SORT_FIELDS: CountrySortField[] = [
  'name',
  'totalCases',
  'totalDeaths',
  'newCases',
  'newDeaths',
  'casesPerMillion',
  'deathsPerMillion',
];

export class CountriesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  continent?: string;

  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy?: CountrySortField;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
