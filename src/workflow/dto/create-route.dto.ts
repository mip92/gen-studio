import { IsString, IsNotEmpty, IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  routeKey: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  templateIds: string[];
}
