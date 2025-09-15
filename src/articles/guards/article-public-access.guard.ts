import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ArticlesService } from '../articles.service';
import { User } from '../../users/entities/user.entity';
import { Article } from '../entities/article.entity';

interface AuthenticatedRequest {
  user?: User;
  params: {
    id: string;
  };
}

@Injectable()
export class ArticlePublicAccessGuard implements CanActivate {
  constructor(private readonly articlesService: ArticlesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const articleId = request.params.id; // UUID-валидируется ParseUUIDPipe в контроллере

    let article: Article | null;
    try {
      article = await this.articlesService.findById(articleId);
    } catch {
      throw new NotFoundException('Article not found');
    }
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.isPublic) {
      return true;
    }

    if (!user) {
      throw new ForbiddenException(
        'Authentication required to access private articles',
      );
    }

    return true;
  }
}
