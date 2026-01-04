import { describe, it, expect } from 'vitest';
import { calculateFees } from '@/lib/commissions';
import { CommissionRates } from '@/types/database';

describe('calculateFees', () => {
  describe('with default 8% rates', () => {
    const defaultRates: CommissionRates = {
      buyer_premium_percent: 8,
      seller_commission_percent: 8,
      is_custom: false,
    };

    it('calculates correct fees for a $1000 sale', () => {
      const result = calculateFees(1000, defaultRates);

      expect(result.buyerPremiumAmount).toBe(80);
      expect(result.sellerCommissionAmount).toBe(80);
      expect(result.totalBuyerPays).toBe(1080);
      expect(result.sellerPayoutAmount).toBe(920);
      expect(result.platformEarnings).toBe(160);
    });

    it('calculates correct fees for a $5000 sale', () => {
      const result = calculateFees(5000, defaultRates);

      expect(result.buyerPremiumAmount).toBe(400);
      expect(result.sellerCommissionAmount).toBe(400);
      expect(result.totalBuyerPays).toBe(5400);
      expect(result.sellerPayoutAmount).toBe(4600);
      expect(result.platformEarnings).toBe(800);
    });

    it('calculates correct fees for a $25000 industrial equipment sale', () => {
      const result = calculateFees(25000, defaultRates);

      expect(result.buyerPremiumAmount).toBe(2000);
      expect(result.sellerCommissionAmount).toBe(2000);
      expect(result.totalBuyerPays).toBe(27000);
      expect(result.sellerPayoutAmount).toBe(23000);
      expect(result.platformEarnings).toBe(4000);
    });

    it('handles $0 sale amount', () => {
      const result = calculateFees(0, defaultRates);

      expect(result.buyerPremiumAmount).toBe(0);
      expect(result.sellerCommissionAmount).toBe(0);
      expect(result.totalBuyerPays).toBe(0);
      expect(result.sellerPayoutAmount).toBe(0);
      expect(result.platformEarnings).toBe(0);
    });

    it('handles cents correctly', () => {
      const result = calculateFees(99.99, defaultRates);

      expect(result.buyerPremiumAmount).toBeCloseTo(7.9992, 4);
      expect(result.sellerCommissionAmount).toBeCloseTo(7.9992, 4);
      expect(result.totalBuyerPays).toBeCloseTo(107.9892, 4);
      expect(result.sellerPayoutAmount).toBeCloseTo(91.9908, 4);
    });
  });

  describe('with custom seller rates', () => {
    it('calculates correctly with lower buyer premium (5%)', () => {
      const customRates: CommissionRates = {
        buyer_premium_percent: 5,
        seller_commission_percent: 8,
        is_custom: true,
      };

      const result = calculateFees(1000, customRates);

      expect(result.buyerPremiumAmount).toBe(50);
      expect(result.sellerCommissionAmount).toBe(80);
      expect(result.totalBuyerPays).toBe(1050);
      expect(result.sellerPayoutAmount).toBe(920);
      expect(result.platformEarnings).toBe(130);
    });

    it('calculates correctly with lower seller commission (5%)', () => {
      const customRates: CommissionRates = {
        buyer_premium_percent: 8,
        seller_commission_percent: 5,
        is_custom: true,
      };

      const result = calculateFees(1000, customRates);

      expect(result.buyerPremiumAmount).toBe(80);
      expect(result.sellerCommissionAmount).toBe(50);
      expect(result.totalBuyerPays).toBe(1080);
      expect(result.sellerPayoutAmount).toBe(950);
      expect(result.platformEarnings).toBe(130);
    });

    it('calculates correctly with 0% buyer premium (promotional)', () => {
      const promoRates: CommissionRates = {
        buyer_premium_percent: 0,
        seller_commission_percent: 8,
        is_custom: true,
      };

      const result = calculateFees(1000, promoRates);

      expect(result.buyerPremiumAmount).toBe(0);
      expect(result.sellerCommissionAmount).toBe(80);
      expect(result.totalBuyerPays).toBe(1000);
      expect(result.sellerPayoutAmount).toBe(920);
      expect(result.platformEarnings).toBe(80);
    });

    it('calculates correctly with 0% seller commission (promotional)', () => {
      const promoRates: CommissionRates = {
        buyer_premium_percent: 8,
        seller_commission_percent: 0,
        is_custom: true,
      };

      const result = calculateFees(1000, promoRates);

      expect(result.buyerPremiumAmount).toBe(80);
      expect(result.sellerCommissionAmount).toBe(0);
      expect(result.totalBuyerPays).toBe(1080);
      expect(result.sellerPayoutAmount).toBe(1000);
      expect(result.platformEarnings).toBe(80);
    });
  });

  describe('mathematical properties', () => {
    it('total buyer pays equals sale amount plus buyer premium', () => {
      const rates: CommissionRates = {
        buyer_premium_percent: 8,
        seller_commission_percent: 8,
        is_custom: false,
      };

      const saleAmount = 1234.56;
      const result = calculateFees(saleAmount, rates);

      expect(result.totalBuyerPays).toBe(saleAmount + result.buyerPremiumAmount);
    });

    it('seller payout equals sale amount minus seller commission', () => {
      const rates: CommissionRates = {
        buyer_premium_percent: 8,
        seller_commission_percent: 8,
        is_custom: false,
      };

      const saleAmount = 1234.56;
      const result = calculateFees(saleAmount, rates);

      expect(result.sellerPayoutAmount).toBe(saleAmount - result.sellerCommissionAmount);
    });

    it('platform earnings equals buyer premium plus seller commission', () => {
      const rates: CommissionRates = {
        buyer_premium_percent: 8,
        seller_commission_percent: 8,
        is_custom: false,
      };

      const result = calculateFees(1000, rates);

      expect(result.platformEarnings).toBe(result.buyerPremiumAmount + result.sellerCommissionAmount);
    });

    it('total money flow is balanced (buyer pays - platform = seller receives)', () => {
      const rates: CommissionRates = {
        buyer_premium_percent: 10,
        seller_commission_percent: 5,
        is_custom: true,
      };

      const saleAmount = 10000;
      const result = calculateFees(saleAmount, rates);

      // Buyer pays: 10000 + 1000 (10% premium) = 11000
      // Seller receives: 10000 - 500 (5% commission) = 9500
      // Platform gets: 1000 + 500 = 1500
      // Check: 11000 (total in) - 1500 (platform keeps) = 9500 (seller gets)
      expect(result.totalBuyerPays - result.platformEarnings).toBe(result.sellerPayoutAmount);
    });
  });

  describe('edge cases', () => {
    it('handles very large sale amounts', () => {
      const rates: CommissionRates = {
        buyer_premium_percent: 8,
        seller_commission_percent: 8,
        is_custom: false,
      };

      const result = calculateFees(1000000, rates);

      expect(result.buyerPremiumAmount).toBe(80000);
      expect(result.sellerCommissionAmount).toBe(80000);
      expect(result.totalBuyerPays).toBe(1080000);
      expect(result.sellerPayoutAmount).toBe(920000);
      expect(result.platformEarnings).toBe(160000);
    });

    it('handles very small sale amounts', () => {
      const rates: CommissionRates = {
        buyer_premium_percent: 8,
        seller_commission_percent: 8,
        is_custom: false,
      };

      const result = calculateFees(0.01, rates);

      expect(result.buyerPremiumAmount).toBeCloseTo(0.0008, 4);
      expect(result.totalBuyerPays).toBeCloseTo(0.0108, 4);
    });

    it('handles decimal percentages', () => {
      const rates: CommissionRates = {
        buyer_premium_percent: 7.5,
        seller_commission_percent: 6.25,
        is_custom: true,
      };

      const result = calculateFees(1000, rates);

      expect(result.buyerPremiumAmount).toBe(75);
      expect(result.sellerCommissionAmount).toBe(62.5);
      expect(result.totalBuyerPays).toBe(1075);
      expect(result.sellerPayoutAmount).toBe(937.5);
      expect(result.platformEarnings).toBe(137.5);
    });
  });
});
