import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { MARKET_LISTING_DURATION_DAYS } from '@wikibattler/shared';

export async function listCard(userId: string, userCardId: string, price: number) {
  if (price < 1) throw new AppError(400, 'BadRequest', 'Price must be at least 1 coin.');

  const userCard = await prisma.userCard.findFirst({
    where: { id: userCardId, userId, isForSale: false },
  });
  if (!userCard) throw new AppError(404, 'NotFound', 'Card not found or already listed.');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + MARKET_LISTING_DURATION_DAYS);

  const [, listing] = await prisma.$transaction([
    prisma.userCard.update({ where: { id: userCardId }, data: { isForSale: true } }),
    prisma.marketListing.create({ data: { sellerId: userId, userCardId, price, expiresAt } }),
  ]);

  return listing;
}

export async function buyCard(buyerId: string, listingId: string) {
  const listing = await prisma.marketListing.findFirst({
    where: { id: listingId, soldAt: null, expiresAt: { gt: new Date() } },
    include: { seller: true, userCard: true },
  });
  if (!listing) throw new AppError(404, 'NotFound', 'Listing not found or expired.');
  if (listing.sellerId === buyerId) throw new AppError(400, 'BadRequest', 'Cannot buy your own listing.');

  const buyer = await prisma.user.findUniqueOrThrow({ where: { id: buyerId } });
  if (buyer.coins < listing.price) throw new AppError(400, 'BadRequest', 'Insufficient coins.');

  await prisma.$transaction([
    prisma.user.update({ where: { id: buyerId }, data: { coins: { decrement: listing.price } } }),
    prisma.user.update({ where: { id: listing.sellerId }, data: { coins: { increment: listing.price } } }),
    prisma.userCard.update({ where: { id: listing.userCardId }, data: { userId: buyerId, isForSale: false } }),
    prisma.marketListing.update({ where: { id: listingId }, data: { soldAt: new Date(), buyerId } }),
  ]);

  return { ok: true };
}

export async function getListings(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  const [total, listings] = await Promise.all([
    prisma.marketListing.count({ where: { soldAt: null, expiresAt: { gt: new Date() } } }),
    prisma.marketListing.findMany({
      where: { soldAt: null, expiresAt: { gt: new Date() } },
      include: { userCard: { include: { card: true } }, seller: { select: { username: true } } },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  return { data: listings, total, page, pageSize, hasMore: skip + pageSize < total };
}
