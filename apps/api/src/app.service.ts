import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'SmartCanteen 360 API - Enterprise Digital Canteen Management Platform';
  }
}
