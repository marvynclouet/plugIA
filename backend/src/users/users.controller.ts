import { Controller, Get, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Request() req) {
    return this.usersService.findOne(req.user.sub);
  }

  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  async deleteMe(@Request() req) {
    return this.usersService.deleteUser(req.user.sub);
  }
}



