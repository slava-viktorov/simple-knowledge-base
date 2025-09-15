import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { ArticlesService } from '../articles.service';
import { User } from '../../users/entities/user.entity';

type RequestWithUser = {
  params: Record<string, string> & { id: string };
  user: User;
};

@Injectable()
export class ArticleOwnershipGuard implements CanActivate {
  constructor(private readonly articlesService: ArticlesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const {
      user,
      params: { id: articleId },
    } = request;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    try {
      const article = await this.articlesService.findById(articleId);
      if (article.author.id !== user.id) {
        throw new ForbiddenException(
          'You are not allowed to perform this action',
        );
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ForbiddenException(
        'You are not allowed to perform this action',
      );
    }
  }
}
