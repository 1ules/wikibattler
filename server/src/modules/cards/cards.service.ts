import { prisma } from '../../config/database.js';
import type { PaginatedResponse } from '@wikibattler/shared';

export async function getUserCollection(
  userId: string,
  page = 1,
  pageSize = 500
): Promise<PaginatedResponse<object>> {
  const skip = (page - 1) * pageSize;

  const [total, cards] = await Promise.all([
    prisma.userCard.count({ where: { userId } }),
    prisma.userCard.findMany({
      where: { userId },
      include: { card: true },
      skip,
      take: pageSize,
      orderBy: { acquiredAt: 'desc' },
    }),
  ]);

  return {
    data: cards,
    total,
    page,
    pageSize,
    hasMore: skip + pageSize < total,
  };
}

export async function getUserCard(userId: string, userCardId: string) {
  return prisma.userCard.findFirst({
    where: { id: userCardId, userId },
    include: { card: true },
  });
}
