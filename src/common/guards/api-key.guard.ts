import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const providedKey = request.headers['x-api-key'];
    const validKey =
      this.configService.get<string>('TELEMETRY_API_KEY') || 'default-telemetry-secret-key';

    if (!providedKey || providedKey !== validKey) {
      throw new UnauthorizedException('Invalid or missing API Key');
    }

    return true;
  }
}
