import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class QueryTransformPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): unknown {
    if (metadata.metatype) {
      return plainToInstance(metadata.metatype, value, {
        enableImplicitConversion: false,
      });
    }
    return value;
  }
}
