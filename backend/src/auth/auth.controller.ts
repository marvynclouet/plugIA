import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    console.log('📝 Register attempt:', { email: registerDto.email, name: registerDto.name });
    const result = await this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name,
    );
    console.log('✅ Register successful:', { userId: result.user.id, email: result.user.email });
    return result;
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(@Request() req, @Body() loginDto: LoginDto) {
    console.log('🔐 Login attempt:', { email: loginDto.email });
    const result = await this.authService.login(req.user);
    console.log('✅ Login successful:', { userId: req.user.id, email: req.user.email });
    return result;
  }

  @Post('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Request() req) {
    return req.user;
  }
}

