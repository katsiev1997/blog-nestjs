import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE } from '../db/db.module';
import { LikeService } from '../like/like.service';
import { PostService } from './post.service';

describe('PostService', () => {
  let service: PostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: DRIZZLE,
          useValue: {},
        },
        {
          provide: LikeService,
          useValue: {
            getPostLikeCounts: jest.fn(),
            getLikedPostIds: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
