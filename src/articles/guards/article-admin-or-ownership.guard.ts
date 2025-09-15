import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { hasAdminAccess } from '../../common/roles';
import { User } from '../../users/entities/user.entity';
import { ArticlesService } from '../articles.service';

interface Req {
  user?: User;
  params: { id: string };
}

@Injectable()
export class ArticleAdminOrOwnershipGuard implements CanActivate {
  constructor(private readonly articlesService: ArticlesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Req>();
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Forbidden: User not authenticated');
    }
    if (hasAdminAccess(user.role)) return true;

    const articleId = req.params?.id;
    const article = await this.articlesService.findById(articleId);
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    if (article.author?.id !== user.id) {
      throw new ForbiddenException(
        'Forbidden: You can only manage your own articles',
      );
    }

    return true;
  }
}
