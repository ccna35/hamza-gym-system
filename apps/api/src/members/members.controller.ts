import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard, RequestWithOwner } from '../auth/auth.guard';
import { CreateMemberDto } from './dto/create-member.dto';
import { MemberQueryDto, PaginationDto } from './dto/member-query.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersService } from './members.service';

@UseGuards(AuthGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  list(@Query() query: MemberQueryDto) {
    return this.members.list(query);
  }

  @Post()
  create(@Body() body: CreateMemberDto, @Req() request: RequestWithOwner) {
    return this.members.create(body, request.owner!.id, this.requestId(request));
  }

  @Get(':memberId')
  get(@Param('memberId', new ParseUUIDPipe()) memberId: string) {
    return this.members.get(memberId);
  }

  @Patch(':memberId')
  update(
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
    @Body() body: UpdateMemberDto,
    @Req() request: RequestWithOwner,
  ) {
    return this.members.update(memberId, body, request.owner!.id, this.requestId(request));
  }

  @Post(':memberId/archive')
  @HttpCode(HttpStatus.OK)
  archive(
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
    @Req() request: RequestWithOwner,
  ) {
    return this.members.archive(memberId, request.owner!.id, this.requestId(request));
  }

  @Post(':memberId/restore')
  @HttpCode(HttpStatus.OK)
  restore(
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
    @Req() request: RequestWithOwner,
  ) {
    return this.members.restore(memberId, request.owner!.id, this.requestId(request));
  }

  @Post(':memberId/photo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  uploadPhoto(
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() request: RequestWithOwner,
  ) {
    return this.members.uploadPhoto(memberId, file, request.owner!.id, this.requestId(request));
  }

  @Get(':memberId/photo')
  @Header('Content-Type', 'image/webp')
  @Header('Cache-Control', 'private, max-age=300')
  async getPhoto(@Param('memberId', new ParseUUIDPipe()) memberId: string) {
    return new StreamableFile(await this.members.getPhoto(memberId));
  }

  @Get(':memberId/subscriptions')
  subscriptions(
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
    @Query() query: PaginationDto,
  ) {
    return this.members.emptyHistory(memberId, query);
  }

  @Get(':memberId/payments')
  payments(
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
    @Query() query: PaginationDto,
  ) {
    return this.members.emptyHistory(memberId, query);
  }

  private requestId(request: RequestWithOwner) {
    const value = request.headers['x-request-id'];
    return Array.isArray(value) ? value[0] : value;
  }
}
